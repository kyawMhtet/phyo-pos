import "server-only";
import { eq, sql } from "drizzle-orm";
import type { getDb } from "@/lib/db/client";
import { products, stockAdjustments } from "@/lib/db/schema";

type Writer = Pick<ReturnType<typeof getDb>, "insert" | "update">;

// Every non-sale stock change goes through here so the adjustment log stays complete.
export async function applyStockChange(
  db: Writer,
  productId: number,
  change: number,
  reason: string
) {
  await db.insert(stockAdjustments).values({ productId, change, reason });
  await db
    .update(products)
    .set({ stock: sql`${products.stock} + ${change}` })
    .where(eq(products.id, productId));
}
