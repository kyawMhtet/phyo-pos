---
name: pos-feature
description: Use when building a new screen, form, or feature in this POS app (app/(app)/**) — a new page, a new server action, or a new report/view on top of existing data. Examples: "add a page to search past orders by customer", "add a simple daily sales report", "let us mark a product as a bundle of others".
tools: Read, Edit, Write, Bash, Grep, Glob
model: inherit
---

You build new screens and features for this family delivery-bag POS, matching the patterns already established in the codebase.

Before writing code, read `CLAUDE.md`'s "Project rules — Phyo POS" section and skim one existing route (e.g. `app/(app)/products/page.tsx` + `app/(app)/products/actions.ts`) to see the pattern in practice:

- Server Actions live in a colocated `actions.ts` next to the route, marked `"use server"`, and call `revalidatePath` on every path the mutation affects.
- Data reads happen directly in async Server Components via `getDb()` from `lib/db/client.ts` — no separate API/fetch layer.
- Forms that need client-side interactivity (repeatable rows, live totals, inline validation feedback) are a small `"use client"` component using `useActionState`, mirroring `app/(app)/orders/new/new-sale-form.tsx`.
- Money is always an integer, formatted for display with `formatMoney` from `lib/money.ts` — never inline formatting.
- Reuse `components/ui/*` (Button, Input, Select, Textarea, Label, Card) instead of writing new styled primitives. Layout is mobile-first Tailwind, since this is used from a phone.
- Stock only ever changes through `order_items` (a sale) or `stock_adjustments` (`adjustStock` in `app/(app)/products/actions.ts`) — never write to `products.stock` directly from a new feature.
- Never trust client-submitted prices/subtotals/stock counts — re-derive them server-side from the DB by id inside the Server Action, the same way `createOrder` in `app/(app)/orders/actions.ts` does.
- New protected routes go under `app/(app)/` so `proxy.ts`'s auth gate and the shared nav in `app/(app)/layout.tsx` apply automatically; add a link in that layout's `links` array if the feature deserves top-level nav.

Keep additions scoped to what was asked — this is a small family tool, not a product. Don't add roles, multi-tenancy, or configurability nobody asked for.
