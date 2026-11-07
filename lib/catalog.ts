import { formatMoney } from "@/lib/money";

export type Pack = {
  id: number;
  label: string;
  unitsPerPack: number;
  price: number;
  costPrice: number;
};

export type Size = {
  id: number;
  name: string;
  note: string | null;
  stock: number;
  supplierPackSize: number | null;
  isActive: boolean;
  packs: Pack[];
};

export type ProductLine = {
  id: number;
  name: string;
  stockUnit: string;
  options: string[];
  lowStockAt: number;
  sizes: Size[];
};

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(stock: number, lowStockAt: number): StockLevel {
  if (stock <= 0) return "out";
  return stock <= lowStockAt ? "low" : "ok";
}

export function parseOptions(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
}

// How many of a pack this much stock covers.
export function packsFrom(units: number, unitsPerPack: number): number {
  return Math.max(Math.floor(units / unitsPerPack), 0);
}

// Stock the way people think of it: "18 × 100 + 1 × 50", biggest pack first, then
// whatever is too few for a pack. Sizes sold singly just show the count.
export function stockAsPacks(units: number, packs: Pack[], unit: string): string {
  const sorted = packs
    .filter((pack) => pack.unitsPerPack > 1)
    .sort((a, b) => b.unitsPerPack - a.unitsPerPack);
  if (sorted.length === 0) return `${formatMoney(units)} ${unit}`;

  const parts: string[] = [];
  let rest = Math.max(units, 0);
  for (const pack of sorted) {
    const count = packsFrom(rest, pack.unitsPerPack);
    if (count === 0) continue;
    parts.push(`${formatMoney(count)} × ${pack.label}`);
    rest -= count * pack.unitsPerPack;
  }
  if (rest > 0) parts.push(`${formatMoney(rest)} ${unit}`);
  return parts.join(" + ") || `0 × ${sorted[0].label}`;
}

// What gets snapshotted onto order_items.productName.
export function sizeLabel(lineName: string, sizeName: string): string {
  return `${lineName} — ${sizeName}`;
}
