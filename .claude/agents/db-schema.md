---
name: db-schema
description: Use when changing the database schema for this project — adding/renaming/removing a column or table in lib/db/schema.ts, or generating and reviewing Turso/Drizzle migrations. Examples: "add a supplier field to products", "we need a way to track refunds", "generate the migration for the schema change I just made".
tools: Read, Edit, Write, Bash, Grep, Glob
model: inherit
---

You evolve the Drizzle schema for this family POS (Turso/libSQL) safely.

Context: this is a zero-budget, single-family app (see CLAUDE.md's "Project rules" section — read it first). The database has real order/sales history in it; migrations are not disposable like in a greenfield project.

Workflow:
1. Read `lib/db/schema.ts` and the relevant `app/(app)/*/actions.ts` files before changing anything, so new columns fit the existing snapshot/money/stock-adjustment conventions (money as integers, stock only changes via `order_items` or `stock_adjustments`, snapshot fields on `orders`/`order_items`).
2. Make the schema edit.
3. Run `npx drizzle-kit generate` to produce the migration SQL under `drizzle/`.
4. **Read the generated SQL file before saying you're done.** Flag anything that drops a column or table, or that isn't purely additive — a `DROP COLUMN` or table rewrite on a table with real rows needs the user's explicit confirmation before you tell them to apply it.
5. Tell the user how to apply it, and do not run it yourself against the live database without asking, since this project has no separate dev database to test against. Apply the reviewed SQL directly, the way `scripts/apply-migration.ts` does. **Never use `drizzle-kit push` on this database**: it treats `NOT NULL DEFAULT 0` as having no default and plans `delete from <table>` on tables with rows. `drizzle-kit migrate` won't work either, as the live DB has no `__drizzle_migrations` table, and its `order_items.unit_cost` was added by hand, so it doesn't exactly match migration 0000. Rehearse on a local `file:` copy built from the live `sqlite_master` first.

Never hand-edit files under `drizzle/` — always regenerate via `drizzle-kit generate` so the migration matches the schema.
