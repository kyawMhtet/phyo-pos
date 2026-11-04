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

// What gets snapshotted onto order_items.productName.
export function sizeLabel(lineName: string, sizeName: string): string {
  return `${lineName} — ${sizeName}`;
}
