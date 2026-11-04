// Applies the product-packs migration straight from its reviewed SQL.
//
// Don't use `drizzle-kit push` here: it treats NOT NULL DEFAULT 0 as "no default" and
// plans `delete from categories; delete from products;`. `drizzle-kit migrate` can't
// be used either, because this database has no migration history.
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const MIGRATION = "drizzle/0001_hesitant_slapstick.sql";

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  const { rows } = await client.execute(
    "select 1 from sqlite_master where type = 'table' and name = 'product_packs'"
  );
  if (rows.length > 0) {
    console.log("migration already applied");
    return;
  }

  const statements = readFileSync(MIGRATION, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  // A batch is one transaction: it all applies or none of it does.
  await client.batch(statements, "write");
  console.log(`applied ${statements.length} statements from ${MIGRATION}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
