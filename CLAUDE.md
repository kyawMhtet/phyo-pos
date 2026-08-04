@AGENTS.md

# Project rules — Phyo POS

Family-only, zero-budget delivery-bag POS. Single family, single shared login — no multi-tenant, no roles/permissions, no billing. Do not add complexity for hypothetical future users; this app scales to a handful of people, not customers.

## Stack
- **Database**: Turso (libSQL/SQLite), one database for both dev and prod. Access it only through `lib/db/client.ts` (`getDb()`) and `lib/db/schema.ts` (Drizzle). Never add another ORM or query builder.
- **Auth**: a single shared `POS_PASSWORD` gates the whole app via `proxy.ts` (Next.js 16 renamed `middleware.ts` → `proxy.ts` — always use `proxy.ts`) and an HMAC session cookie (`lib/auth.ts`). No NextAuth/Clerk/per-user accounts.
- **Styling**: Tailwind v4, mobile-first — this is mostly used from a phone while packing/delivering orders. Shared primitives live in `components/ui/`; reuse them instead of one-off styled elements.

## Data conventions
- **Money is always an integer** (whole currency unit — no floats, no cents-as-decimals). Format for display with `lib/money.ts#formatMoney`, never inline `toFixed`/`toLocaleString` calls.
- **Stock changes only ever go through `order_items` (sale) or `stock_adjustments` (manual restock/correction/damage)** via `app/(app)/products/actions.ts#adjustStock`. Never write to `products.stock` directly from anywhere else — the adjustment log is what makes stock history trustworthy.
- **Snapshot, don't reference-only**: `orders` stores `customerName`/`customerPhone`/`address` and `order_items` stores `productName`/`unitPrice` at time of sale, even though `customerId`/`productId` FKs also exist. Editing a customer or product later must never rewrite past order history.
- Server Actions must re-look-up price/stock/name from the DB by id — never trust a price or subtotal sent from the client.

## Next.js 16 specifics (this repo, not the Next.js you remember)
- Server Actions are colocated per route as `actions.ts` (e.g. `app/(app)/orders/actions.ts`), not in a global `actions/` folder. Mutate, then call `revalidatePath` for every affected route.
- `cacheComponents`/`use cache` is intentionally **off** — pages stay dynamic by default so stock and sales are always fresh. Don't add `"use cache"` to POS data reads.
- Auth/routing gate is `proxy.ts` (not `middleware.ts`), matching Next 16's rename. Re-check `node_modules/next/dist/docs` before relying on other APIs from training data — this Next version has real breaking changes.
