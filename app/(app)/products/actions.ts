"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { categories, products, stockAdjustments } from "@/lib/db/schema";

const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  variant: z.string().trim().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().int().min(0),
  costPrice: z.coerce.number().int().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
});

export async function createCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const db = getDb();
  await db.insert(categories).values({ name });
  revalidatePath("/products");
}

export async function createProduct(formData: FormData) {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    variant: formData.get("variant") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    price: formData.get("price"),
    costPrice: formData.get("costPrice") || 0,
    stock: formData.get("stock") || 0,
  });
  if (!parsed.success) return;

  const db = getDb();
  await db.insert(products).values(parsed.data);
  revalidatePath("/products");
}

const updateProductSchema = productSchema.omit({ stock: true }).extend({
  isActive: z.coerce.boolean(),
});

export async function updateProduct(productId: number, formData: FormData) {
  const parsed = updateProductSchema.safeParse({
    name: formData.get("name"),
    variant: formData.get("variant") || undefined,
    categoryId: formData.get("categoryId") || undefined,
    price: formData.get("price"),
    costPrice: formData.get("costPrice") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return;

  const db = getDb();
  await db.update(products).set(parsed.data).where(eq(products.id, productId));
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

const adjustStockSchema = z.object({
  change: z.coerce.number().int().refine((n) => n !== 0, "Change cannot be 0"),
  reason: z.string().trim().min(1, "Reason is required"),
});

export async function adjustStock(productId: number, formData: FormData) {
  const parsed = adjustStockSchema.safeParse({
    change: formData.get("change"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return;

  const db = getDb();
  const { change, reason } = parsed.data;
  await db.insert(stockAdjustments).values({ productId, change, reason });
  await db
    .update(products)
    .set({ stock: sql`${products.stock} + ${change}` })
    .where(eq(products.id, productId));

  revalidatePath(`/products/${productId}`);
  revalidatePath("/products");
  revalidatePath("/");
}
