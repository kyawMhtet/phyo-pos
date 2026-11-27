import { formatMoney } from "@/lib/money";

export type Pack = {
  id: number;
  label: string;
  unitsPerPack: number;
  price: number;
  costPrice: number;
  wholesalePrice: number | null;
};

type PackSize = Pick<Pack, "label" | "unitsPerPack">;

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

// The colours bags come in, offered as chips when setting up a product.
export const COLOUR_PRESETS = [
  "ခဲဖြူ",
  "လိမ္မော်",
  "အသား",
  "ပြာနု",
  "ပန်းဆီ",
  "ပန်းနု",
  "ကြေးဉစိမ်း",
];

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

// The pack stock is entered in: the supplier's if it's set, else the biggest one sold.
export function stockPackSize(size: { supplierPackSize: number | null; packs: PackSize[] }): number {
  return size.supplierPackSize || Math.max(1, ...size.packs.map((pack) => pack.unitsPerPack));
}

// Stock the way people think of it: "18 × 100 + 1 × 50", biggest pack first, then
// whatever is too few for a pack. Sizes sold singly just show the count.
export function stockAsPacks(units: number, packs: PackSize[], unit: string): string {
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

// What a size's stock cost to buy: stock × cost of one unit, taken from the biggest
// pack with a cost (closest to the supplier price). Null when stock has no cost to use.
export function stockCostValue(size: { stock: number; packs: Pack[] }): number | null {
  if (size.stock <= 0) return 0;
  const costed = size.packs.filter((pack) => pack.costPrice > 0);
  if (costed.length === 0) return null;
  const pack = costed.reduce((a, b) => (b.unitsPerPack > a.unitsPerPack ? b : a));
  return Math.round((size.stock * pack.costPrice) / pack.unitsPerPack);
}

// Stock value of a set of sizes, plus how many in-stock sizes had no cost to count.
export function stockValueOf(sizes: { stock: number; packs: Pack[] }[]) {
  let value = 0;
  let missingCost = 0;
  for (const size of sizes) {
    const sizeValue = stockCostValue(size);
    if (sizeValue === null) missingCost += 1;
    else value += sizeValue;
  }
  return { value, missingCost };
}

// What gets snapshotted onto order_items.productName.
export function sizeLabel(lineName: string, sizeName: string): string {
  return `${lineName} — ${sizeName}`;
}
