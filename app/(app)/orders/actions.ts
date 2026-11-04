"use server";

import { z } from "zod";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { categories, customers, orderItems, orders, productPacks, products } from "@/lib/db/schema";
import { getDictionary } from "@/lib/i18n";
import { parseOptions, sizeLabel } from "@/lib/catalog";
import { PAYMENT_METHODS } from "@/lib/orders";
import { applyStockChange } from "@/lib/stock";

export type OrderResult = { error: string } | { orderId: number };

const orderSchema = z.object({
  lines: z
    .array(
      z.object({
        packId: z.number().int().positive(),
        quantity: z.number().int().positive(),
        option: z.string().nullable(),
      })
    )
    .min(1),
  fulfillment: z.enum(["delivery", "pickup"]),
  customerId: z.number().int().positive().nullable(),
  customerName: z.string().trim(),
  customerPhone: z.string().trim(),
  address: z.string().trim(),
  note: z.string().trim(),
  handledBy: z.string().trim(),
  deliveryFee: z.number().int().min(0),
  discount: z.number().int().min(0),
  payment: z.enum(["full", "advance", "none"]),
  advance: z.number().int().min(0),
  paymentMethod: z.enum(PAYMENT_METHODS),
});

export type OrderInput = z.infer<typeof orderSchema>;

class OutOfStockError extends Error {}

function refreshSalesPages() {
  revalidatePath("/orders");
  revalidatePath("/products", "layout");
  revalidatePath("/sell");
  revalidatePath("/customers", "layout");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function createOrder(input: OrderInput): Promise<OrderResult> {
  const { dict } = await getDictionary();

  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) return { error: dict.orders.errorAddProduct };
  const data = parsed.data;

  const isDelivery = data.fulfillment === "delivery";
  if (isDelivery && !data.customerName) return { error: dict.orders.errorCustomerName };

  const db = getDb();

  // Prices, costs and names always come from the DB — only ids and quantities are
  // taken from the client.
  const packRows = await db
    .select({
      packId: productPacks.id,
      packLabel: productPacks.label,
      unitsPerPack: productPacks.unitsPerPack,
      price: productPacks.price,
      costPrice: productPacks.costPrice,
      productId: products.id,
      sizeName: products.name,
      stock: products.stock,
      isActive: products.isActive,
      lineName: categories.name,
      lineOptions: categories.options,
      stockUnit: categories.stockUnit,
    })
    .from(productPacks)
    .innerJoin(products, eq(productPacks.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(
      inArray(
        productPacks.id,
        data.lines.map((line) => line.packId)
      )
    );
  const packsById = new Map(packRows.map((row) => [row.packId, row]));

  const unitsByProduct = new Map<number, number>();
  const items: Omit<typeof orderItems.$inferInsert, "orderId">[] = [];
  for (const line of data.lines) {
    const pack = packsById.get(line.packId);
    if (!pack || !pack.isActive) return { error: dict.orders.errorProductUnavailable };

    const units = line.quantity * pack.unitsPerPack;
    unitsByProduct.set(pack.productId, (unitsByProduct.get(pack.productId) ?? 0) + units);

    items.push({
      productId: pack.productId,
      productName: sizeLabel(pack.lineName, pack.sizeName),
      packId: pack.packId,
      packLabel: pack.packLabel,
      unitsPerPack: pack.unitsPerPack,
      optionLabel:
        line.option && parseOptions(pack.lineOptions).includes(line.option) ? line.option : null,
      unitPrice: pack.price,
      unitCost: pack.costPrice,
      quantity: line.quantity,
      subtotal: pack.price * line.quantity,
    });
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryFee = isDelivery ? data.deliveryFee : 0;
  const discount = Math.min(data.discount, itemsSubtotal);
  const total = itemsSubtotal + deliveryFee - discount;
  const paidAmount =
    data.payment === "full" ? total : data.payment === "advance" ? Math.min(data.advance, total) : 0;

  const customerPhone = data.customerPhone || undefined;
  const address = data.address || undefined;

  try {
    const orderId = await db.transaction(async (tx) => {
      let customerId = data.customerId ?? undefined;
      if (customerId) {
        await tx
          .update(customers)
          .set({ name: data.customerName, phone: customerPhone, address })
          .where(eq(customers.id, customerId));
      } else if (data.customerName) {
        const existing = customerPhone
          ? await tx.query.customers.findFirst({ where: eq(customers.phone, customerPhone) })
          : undefined;
        if (existing) {
          customerId = existing.id;
        } else {
          const [created] = await tx
            .insert(customers)
            .values({ name: data.customerName, phone: customerPhone, address })
            .returning({ id: customers.id });
          customerId = created.id;
        }
      }

      const [order] = await tx
        .insert(orders)
        .values({
          customerId,
          customerName: data.customerName || dict.checkout.walkIn,
          customerPhone,
          address,
          note: data.note || undefined,
          status: isDelivery ? "pending" : "delivered",
          fulfillment: data.fulfillment,
          paymentMethod: data.paymentMethod,
          paidAmount,
          handledBy: data.handledBy || undefined,
          itemsSubtotal,
          deliveryFee,
          discount,
          total,
        })
        .returning({ id: orders.id });

      await tx.insert(orderItems).values(items.map((item) => ({ orderId: order.id, ...item })));

      for (const [productId, units] of unitsByProduct) {
        const updated = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${units}` })
          .where(and(eq(products.id, productId), gte(products.stock, units)))
          .returning({ id: products.id });
        if (updated.length === 0) {
          const pack = packRows.find((row) => row.productId === productId)!;
          throw new OutOfStockError(
            `${dict.orders.errorNotEnoughStock}: ${sizeLabel(pack.lineName, pack.sizeName)} (${pack.stock} ${pack.stockUnit})`
          );
        }
      }

      return order.id;
    });

    refreshSalesPages();
    return { orderId };
  } catch (error) {
    if (error instanceof OutOfStockError) return { error: error.message };
    throw error;
  }
}

export async function setOrderStatus(orderId: number, status: "packed" | "delivered") {
  const db = getDb();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.status === "cancelled") return;

  await db.update(orders).set({ status }).where(eq(orders.id, orderId));
  revalidatePath(`/orders/${orderId}`);
  refreshSalesPages();
}

const paymentSchema = z.object({
  amount: z.number().int().positive(),
  method: z.enum(PAYMENT_METHODS),
});

export async function recordPayment(
  orderId: number,
  input: z.infer<typeof paymentSchema>
): Promise<{ error?: string }> {
  const { dict } = await getDictionary();
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { error: dict.orders.errorPaymentAmount };

  const db = getDb();
  const order = await db.query.orders.findFirst({ where: eq(orders.id, orderId) });
  if (!order || order.status === "cancelled") return { error: dict.orders.errorPaymentAmount };

  await db
    .update(orders)
    .set({
      paidAmount: Math.min(order.paidAmount + parsed.data.amount, order.total),
      paymentMethod: parsed.data.method,
    })
    .where(eq(orders.id, orderId));

  revalidatePath(`/orders/${orderId}`);
  refreshSalesPages();
  return {};
}

// Cancelling is final and puts the goods back on the shelf, logged like any other
// stock change. To change an order, cancel it and ring it up again.
export async function cancelOrder(orderId: number) {
  const { dict } = await getDictionary();
  const db = getDb();

  await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, orderId), sql`${orders.status} != 'cancelled'`))
      .returning({ id: orders.id });
    if (!order) return;

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      await applyStockChange(
        tx,
        item.productId,
        item.quantity * item.unitsPerPack,
        `${dict.stock.reasonCancelled} #${orderId}`
      );
    }
  });

  revalidatePath(`/orders/${orderId}`);
  refreshSalesPages();
}
