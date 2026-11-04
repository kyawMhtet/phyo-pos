// One-time import of the Diva price lists. Safe to re-run: a product that already has
// sizes is left alone. Anything in the database from before product packs existed is
// hidden from sale rather than deleted, so nothing is lost.
//
//   npm run db:upgrade
//
// Stock starts at 0 and buying prices are blank: count stock from each product's
// "Update stock" screen, and fill costs in from "Edit".
import { createClient } from "@libsql/client";
import { and, eq, gt, notInArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../lib/db/schema";

const { categories, productPacks, products } = schema;

type SeedSize = { name: string; note?: string; prices: Record<string, number> };
type SeedLine = {
  name: string;
  stockUnit: string;
  lowStockAt: number;
  options?: string;
  packs: Record<string, number>;
  sizes: SeedSize[];
};

function sized(pack: string, rows: [name: string, price: number, note?: string][]): SeedSize[] {
  return rows.map(([name, price, note]) => ({ name, note, prices: { [pack]: price } }));
}

const CATALOG: SeedLine[] = [
  {
    name: "China Made Deli Bag",
    stockUnit: "pcs",
    lowStockAt: 100,
    options: "ပန်းရောင်, အပြာနု, အဝါ, ခရမ်း, အဖြူ",
    packs: { "100 pcs": 100, "50 pcs": 50 },
    sizes: (
      [
        ["15 x 25 cm", '5.9"x9.8"', 16500, 9500],
        ["17 x 30 cm", '6"x12"', 18500, 10500],
        ["20 x 30 cm", '8"x12"', 21500, 12000],
        ["25 x 35 cm", '10"x14"', 29500, 16000],
        ["28 x 42 cm", '11"x16"', 38500, 20000],
        ["32 x 45 cm", '12.5"x18"', 46500, 24500],
        ["38 x 52 cm", '15"x20"', 62000, 32000],
        ["45 x 60 cm", '18"x24"', 85000, 43500],
      ] as const
    ).map(([name, note, hundred, fifty]) => ({
      name,
      note,
      prices: { "100 pcs": hundred, "50 pcs": fifty },
    })),
  },
  {
    name: "Local Made Deli Bag",
    stockUnit: "pcs",
    lowStockAt: 100,
    options: "ပန်းရောင်, မီးခိုး, အပြာ, အနီ, အပြာနု, အစိမ်း, ခရမ်း, အဝါ, လိမ္မော်, အဖြူ",
    packs: { "50 pcs": 50 },
    sizes: sized("50 pcs", [
      ["17 x 30 cm", 10500, '6"x12"'],
      ["20 x 30 cm", 11900, '8"x12"'],
      ["25 x 35 cm", 15900, '10"x14"'],
      ["28 x 42 cm", 20500, '11"x16"'],
      ["32 x 45 cm", 24500, '12.5"x18"'],
      ["38 x 52 cm", 32500, '15"x20"'],
      ["45 x 60 cm", 44500, '18"x24"'],
    ]),
  },
  {
    name: "ကပ်ခွာအိတ်",
    stockUnit: "pcs",
    lowStockAt: 200,
    packs: { "500 pcs": 500, "200 pcs": 200 },
    sizes: [
      ...sized("500 pcs", [
        ["5 x 5 in", 13500],
        ["5.5 x 7 in", 17500],
      ]),
      ...sized("200 pcs", [
        ["6.5 x 12 in", 12500],
        ["7 x 13 in", 14000],
        ["8 x 12 in", 14900],
        ["9 x 12 in", 16500],
        ["10 x 13 in", 18500],
        ["11.25 x 14.5 in", 21900],
        ["12 x 14.5 in", 22900],
        ["12 x 16 in", 24500],
        ["13.5 x 17.5 in", 28500],
      ]),
    ],
  },
  {
    name: "Zipper Bag (ဇစ်ဖိ အထူသား)",
    stockUnit: "kg",
    lowStockAt: 2,
    packs: { "1 kg": 1 },
    sizes: sized(
      "1 kg",
      (
        [
          ["4 x 6 cm", 2100],
          ["5 x 7 cm", 1700],
          ["6 x 8 cm", 1200],
          ["7 x 10 cm", 800],
          ["8 x 12 cm", 600],
          ["9 x 13 cm", 500],
          ["10 x 15 cm", 400],
          ["12 x 17 cm", 300],
          ["13 x 20 cm", 200],
          ["15 x 23 cm", 176],
          ["18 x 28 cm", 120],
          ["20 x 30 cm", 100],
          ["23 x 35 cm", 75],
          ["25 x 38 cm", 64],
          ["30 x 46 cm", 44],
        ] as const
      ).map(([name, perKg]) => [name, 28500, `≈${perKg} pcs/kg`])
    ),
  },
  {
    name: "Bubble bag",
    stockUnit: "pcs",
    lowStockAt: 20,
    options: "အဖြူ, ပန်းရောင်, စိမ်းပြာ",
    packs: { "1 pc": 1 },
    sizes: sized("1 pc", [
      ["11 x 13 cm", 580],
      ["13 x 18 cm", 790],
      ["15 x 20 cm", 980],
      ["18 x 23 cm", 1250],
      ["25 x 30 cm", 2400],
    ]),
  },
  {
    name: "Bubble wrap",
    stockUnit: "yard",
    lowStockAt: 20,
    // The price list doesn't say how long a roll is — 100 yards is a placeholder.
    packs: { "1 roll": 100, "1 yard": 1 },
    sizes: [
      { name: "2 ft x 1 in", prices: {} },
      { name: "4 ft x 2 in", prices: { "1 roll": 380000, "1 yard": 4700 } },
    ],
  },
  {
    name: "Delivery Sticker",
    stockUnit: "pack",
    lowStockAt: 5,
    packs: { "100 sheets": 1, "50 sheets": 1 },
    sizes: [
      { name: "ပုံပါ Delivery sticker", prices: { "100 sheets": 5500 } },
      { name: "အလျားရှည် Delivery sticker", prices: { "100 sheets": 5500 } },
      { name: "အနံရှည် Plain sticker", prices: { "100 sheets": 5500 } },
      { name: "ဘောက်ချာ စတစ်ကာ", prices: { "50 sheets": 5500 } },
    ],
  },
  {
    name: "Marker pen",
    stockUnit: "pcs",
    lowStockAt: 12,
    packs: { "1 pc": 1 },
    sizes: sized("1 pc", [
      ["Dual nib — အပြာ", 2500],
      ["Dual nib — အနက်", 2500],
    ]),
  },
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const db = drizzle({
    client: createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN }),
    schema,
  });

  await db.transaction(async (tx) => {
    // Rows from the old one-row-per-product model: no packs yet, but a real price.
    const withPacks = tx.selectDistinct({ id: productPacks.productId }).from(productPacks);
    const legacy = await tx
      .select()
      .from(products)
      .where(and(gt(products.price, 0), notInArray(products.id, withPacks)));

    for (const product of legacy) {
      await tx.insert(productPacks).values({
        productId: product.id,
        label: "1 pc",
        price: product.price,
        costPrice: product.costPrice,
      });
      await tx.update(products).set({ isActive: false }).where(eq(products.id, product.id));
      console.log(`hid old product: ${product.name} ${product.variant ?? ""} (stock ${product.stock})`);
    }

    for (const [sortOrder, line] of CATALOG.entries()) {
      const values = {
        name: line.name,
        stockUnit: line.stockUnit,
        lowStockAt: line.lowStockAt,
        options: line.options ?? null,
        sortOrder: sortOrder + 1,
      };

      const [existing] = await tx
        .select()
        .from(categories)
        .where(sql`lower(${categories.name}) = lower(${line.name})`);

      if (existing) {
        const [used] = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.categoryId, existing.id))
          .limit(1);
        if (used) {
          console.log(`skipped ${line.name}: already has sizes`);
          continue;
        }
        await tx.update(categories).set(values).where(eq(categories.id, existing.id));
      }

      const categoryId =
        existing?.id ??
        (await tx.insert(categories).values(values).returning({ id: categories.id }))[0].id;

      for (const [index, size] of line.sizes.entries()) {
        const packs = Object.entries(line.packs).filter(([label]) => label in size.prices);
        const firstPrice = packs.length > 0 ? size.prices[packs[0][0]] : 0;

        const [created] = await tx
          .insert(products)
          .values({
            categoryId,
            name: size.name,
            variant: size.note ?? null,
            price: firstPrice,
            sortOrder: index,
          })
          .returning({ id: products.id });

        for (const [packIndex, [label, unitsPerPack]] of packs.entries()) {
          await tx.insert(productPacks).values({
            productId: created.id,
            label,
            unitsPerPack,
            price: size.prices[label],
            sortOrder: packIndex,
          });
        }
      }
      console.log(`imported ${line.name}: ${line.sizes.length} sizes`);
    }
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
