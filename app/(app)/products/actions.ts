"use server";

import { z } from "zod";
import { and, eq, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { categories, productPacks, products } from "@/lib/db/schema";
import type { FieldErrors, FormResult } from "@/lib/form";
import { getDictionary } from "@/lib/i18n";
import { applyStockChange } from "@/lib/stock";

const lineSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1),
  stockUnit: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)),
  lowStockAt: z.number().int().min(0),
  sizes: z
    .array(
      z.object({
        id: z.number().int().positive().optional(),
        name: z.string().trim().min(1),
        note: z.string().trim(),
        isActive: z.boolean(),
        openingStock: z.number().int().min(0),
        packs: z.array(
          z.object({
            id: z.number().int().positive().optional(),
            label: z.string().trim().min(1),
            unitsPerPack: z.number().int().positive(),
            price: z.number().int().min(0),
            costPrice: z.number().int().min(0),
          })
        ),
      })
    )
    .min(1),
});

export type ProductLineInput = z.infer<typeof lineSchema>;

function refreshCatalogPages() {
  revalidatePath("/products", "layout");
  revalidatePath("/sell");
  revalidatePath("/");
}

export async function saveProductLine(
  input: ProductLineInput
): Promise<FormResult & { lineId?: number }> {
  const { dict } = await getDictionary();

  const parsed = lineSchema.safeParse(input);
  if (!parsed.success) return { error: dict.products.errorIncomplete };
  const data = parsed.data;

  const sizeNames = data.sizes.map((size) => size.name.toLowerCase());
  if (new Set(sizeNames).size !== sizeNames.length) {
    return { error: dict.products.errorDuplicateSize };
  }

  const db = getDb();
  const sameName = await db.query.categories.findFirst({
    where: sql`lower(${categories.name}) = lower(${data.name})`,
  });
  if (sameName && sameName.id !== data.id) {
    return { fieldErrors: { name: dict.products.errorDuplicateName } };
  }

  const line = {
    name: data.name,
    stockUnit: data.stockUnit,
    options: data.options.join(", ") || null,
    lowStockAt: data.lowStockAt,
  };

  const lineId = await db.transaction(async (tx) => {
    let id = data.id;
    if (id) {
      await tx.update(categories).set(line).where(eq(categories.id, id));
    } else {
      const [{ last }] = await tx.select({ last: max(categories.sortOrder) }).from(categories);
      const [created] = await tx
        .insert(categories)
        .values({ ...line, sortOrder: (last ?? 0) + 1 })
        .returning({ id: categories.id });
      id = created.id;
    }

    const savedPackIds: number[] = [];
    const sizeIds: number[] = [];

    for (const [index, size] of data.sizes.entries()) {
      const firstPack = size.packs[0];
      const values = {
        name: size.name,
        variant: size.note || null,
        isActive: size.isActive,
        sortOrder: index,
        price: firstPack?.price ?? 0,
        costPrice: firstPack?.costPrice ?? 0,
      };

      let sizeId = size.id;
      if (sizeId) {
        await tx
          .update(products)
          .set(values)
          .where(and(eq(products.id, sizeId), eq(products.categoryId, id)));
      } else {
        const [created] = await tx
          .insert(products)
          .values({ ...values, categoryId: id })
          .returning({ id: products.id });
        sizeId = created.id;
        if (size.openingStock > 0) {
          await applyStockChange(tx, sizeId, size.openingStock, dict.stock.reasonOpening);
        }
      }
      sizeIds.push(sizeId);

      for (const [packIndex, pack] of size.packs.entries()) {
        const packValues = {
          label: pack.label,
          unitsPerPack: pack.unitsPerPack,
          price: pack.price,
          costPrice: pack.costPrice,
          sortOrder: packIndex,
        };
        if (pack.id) {
          await tx.update(productPacks).set(packValues).where(eq(productPacks.id, pack.id));
          savedPackIds.push(pack.id);
        } else {
          const [created] = await tx
            .insert(productPacks)
            .values({ ...packValues, productId: sizeId })
            .returning({ id: productPacks.id });
          savedPackIds.push(created.id);
        }
      }
    }

    const existingPacks = await tx
      .select({ id: productPacks.id })
      .from(productPacks)
      .where(inArray(productPacks.productId, sizeIds));
    const removed = existingPacks.map((pack) => pack.id).filter((p) => !savedPackIds.includes(p));
    if (removed.length > 0) {
      await tx.delete(productPacks).where(inArray(productPacks.id, removed));
    }

    return id;
  });

  refreshCatalogPages();
  return { lineId };
}

const adjustStockSchema = z.object({
  mode: z.enum(["receive", "remove", "count"]),
  note: z.string().trim(),
  lines: z
    .array(z.object({ productId: z.number().int().positive(), amount: z.number().int().min(0) }))
    .min(1),
});

export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

class NotEnoughStockError extends Error {
  constructor(readonly fieldErrors: FieldErrors) {
    super("Not enough stock");
  }
}

export async function adjustStock(input: AdjustStockInput): Promise<FormResult> {
  const { dict } = await getDictionary();

  const parsed = adjustStockSchema.safeParse(input);
  if (!parsed.success) return { error: dict.stock.errorNothing };
  const { mode, note, lines } = parsed.data;

  const label = {
    receive: dict.stock.reasonReceive,
    remove: dict.stock.reasonRemove,
    count: dict.stock.reasonCount,
  }[mode];
  const reason = note ? `${label} — ${note}` : label;

  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const current = await tx
        .select({ id: products.id, stock: products.stock })
        .from(products)
        .where(
          inArray(
            products.id,
            lines.map((line) => line.productId)
          )
        );

      for (const line of lines) {
        const size = current.find((row) => row.id === line.productId);
        if (!size) continue;

        const change =
          mode === "receive"
            ? line.amount
            : mode === "remove"
              ? -line.amount
              : line.amount - size.stock;
        if (size.stock + change < 0) {
          throw new NotEnoughStockError({ [`stock-${size.id}`]: dict.stock.errorTooMany });
        }
        if (change !== 0) await applyStockChange(tx, size.id, change, reason);
      }
    });
  } catch (error) {
    if (error instanceof NotEnoughStockError) return { fieldErrors: error.fieldErrors };
    throw error;
  }

  refreshCatalogPages();
  return {};
}
