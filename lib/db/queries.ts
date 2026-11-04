import "server-only";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, productPacks, products } from "@/lib/db/schema";
import { parseOptions, type Pack, type ProductLine, type Size } from "@/lib/catalog";

export async function getProductLines(): Promise<ProductLine[]> {
  const db = getDb();
  const [lineRows, sizeRows, packRows] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
    db.select().from(products).orderBy(asc(products.sortOrder), asc(products.id)),
    db.select().from(productPacks).orderBy(asc(productPacks.sortOrder), asc(productPacks.id)),
  ]);

  const packsBySize = new Map<number, Pack[]>();
  for (const pack of packRows) {
    const list = packsBySize.get(pack.productId) ?? [];
    list.push({
      id: pack.id,
      label: pack.label,
      unitsPerPack: pack.unitsPerPack,
      price: pack.price,
      costPrice: pack.costPrice,
    });
    packsBySize.set(pack.productId, list);
  }

  const sizesByLine = new Map<number, Size[]>();
  for (const size of sizeRows) {
    if (size.categoryId === null) continue;
    const list = sizesByLine.get(size.categoryId) ?? [];
    list.push({
      id: size.id,
      name: size.name,
      note: size.variant,
      stock: size.stock,
      isActive: size.isActive,
      packs: packsBySize.get(size.id) ?? [],
    });
    sizesByLine.set(size.categoryId, list);
  }

  return lineRows.map((line) => ({
    id: line.id,
    name: line.name,
    stockUnit: line.stockUnit,
    options: parseOptions(line.options),
    lowStockAt: line.lowStockAt,
    sizes: sizesByLine.get(line.id) ?? [],
  }));
}
