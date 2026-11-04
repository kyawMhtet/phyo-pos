// Wipes the whole database and rebuilds it from drizzle/*.sql. This project has one
// database for dev and live, so run through `npm run db:fresh`, which then re-imports
// the catalog. Every order, customer, expense and stock record is lost for good.
import { readdirSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { createClient } from "@libsql/client";

// Children first, so foreign keys never block a drop.
const TABLES = [
  "order_items",
  "stock_adjustments",
  "product_packs",
  "orders",
  "expenses",
  "customers",
  "products",
  "categories",
];
const CONFIRMATION = "delete everything";

function ask(question: string): Promise<string> {
  const reader = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    reader.question(question, (answer) => {
      resolve(answer);
      reader.close();
    });
    // Closed stdin counts as "no".
    reader.once("close", () => resolve(""));
  });
}

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const existing = await client.execute("select name from sqlite_master where type = 'table'");
  const names = existing.rows.map((row) => String(row.name));

  console.log(`\nDatabase: ${url}\nThis will permanently delete:`);
  for (const table of TABLES.filter((name) => names.includes(name))) {
    const { rows } = await client.execute(`select count(*) as n from ${table}`);
    console.log(`  ${table}: ${rows[0].n} rows`);
  }

  const answer = await ask(`\nType "${CONFIRMATION}" to continue: `);
  if (answer.trim() !== CONFIRMATION) {
    console.log("Cancelled. Nothing was changed.");
    process.exit(1);
  }

  const migrations = readdirSync("drizzle")
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .flatMap((file) => readFileSync(`drizzle/${file}`, "utf8").split("--> statement-breakpoint"))
    .map((statement) => statement.trim())
    .filter(Boolean);

  // A batch is one transaction: if any of this fails, the old data is still there.
  await client.batch(
    [...TABLES.map((table) => `drop table if exists ${table}`), ...migrations],
    "write"
  );
  console.log("Database wiped and rebuilt.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
