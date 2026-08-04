"use server";

import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { orderItems, orders, products } from "@/lib/db/schema";
import { getDictionary } from "@/lib/i18n";

export type OrderState = { error?: string };

const paymentMethods = ["cash", "transfer", "other"] as const;
const orderStatuses = ["pending", "paid", "delivered", "cancelled"] as const;

export async function createOrder(
  _prevState: OrderState,
  formData: FormData
): Promise<OrderState> {
  const { dict } = await getDictionary();

  const customerName = String(formData.get("customerName") ?? "").trim();
  if (!customerName) return { error: dict.orders.errorCustomerName };

  const customerIdRaw = formData.get("customerId");
  const customerId =
    customerIdRaw && String(customerIdRaw).length > 0
      ? Number(customerIdRaw)
      : undefined;
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || undefined;
  const address = String(formData.get("address") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const handledBy = String(formData.get("handledBy") ?? "").trim() || undefined;

  const paymentMethodRaw = String(formData.get("paymentMethod") ?? "cash");
  const paymentMethod = paymentMethods.includes(
    paymentMethodRaw as (typeof paymentMethods)[number]
  )
    ? (paymentMethodRaw as (typeof paymentMethods)[number])
    : "cash";

  const deliveryFee = Math.max(0, Math.trunc(Number(formData.get("deliveryFee") ?? 0)) || 0);
  const discount = Math.max(0, Math.trunc(Number(formData.get("discount") ?? 0)) || 0);

  const productIds = formData.getAll("productId").map((v) => Number(v));
  const quantities = formData.getAll("quantity").map((v) => Number(v));

  const requestedLines: { productId: number; quantity: number }[] = [];
  for (let i = 0; i < productIds.length; i++) {
    if (productIds[i] && quantities[i] > 0) {
      requestedLines.push({ productId: productIds[i], quantity: quantities[i] });
    }
  }
  if (requestedLines.length === 0) return { error: dict.orders.errorAddProduct };

  const db = getDb();

  const items: {
    productId: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    unitCost: number;
    subtotal: number;
  }[] = [];

  for (const line of requestedLines) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, line.productId),
    });
    if (!product || !product.isActive) {
      return { error: dict.orders.errorProductUnavailable };
    }
    if (product.stock < line.quantity) {
      return {
        error: `${dict.orders.errorNotEnoughStock}: "${product.name}" (${product.stock} ${dict.orders.left})`,
      };
    }
    const label = product.variant ? `${product.name} — ${product.variant}` : product.name;
    items.push({
      productId: product.id,
      productName: label,
      unitPrice: product.price,
      unitCost: product.costPrice,
      quantity: line.quantity,
      subtotal: product.price * line.quantity,
    });
  }

  const itemsSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = itemsSubtotal + deliveryFee - discount;

  const [order] = await db
    .insert(orders)
    .values({
      customerId,
      customerName,
      customerPhone,
      address,
      note,
      paymentMethod,
      handledBy,
      itemsSubtotal,
      deliveryFee,
      discount,
      total,
    })
    .returning({ id: orders.id });

  for (const item of items) {
    await db.insert(orderItems).values({ orderId: order.id, ...item });
    await db
      .update(products)
      .set({ stock: sql`${products.stock} - ${item.quantity}` })
      .where(eq(products.id, item.productId));
  }

  revalidatePath("/orders");
  revalidatePath("/products");
  revalidatePath("/");
  redirect(`/orders/${order.id}`);
}

const statusSchema = z.enum(orderStatuses);

export async function updateOrderStatus(orderId: number, formData: FormData) {
  const parsed = statusSchema.safeParse(formData.get("status"));
  if (!parsed.success) return;

  const db = getDb();
  await db.update(orders).set({ status: parsed.data }).where(eq(orders.id, orderId));
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/");
}
