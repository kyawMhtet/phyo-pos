import Link from "next/link";
import { and, eq, gte, ne } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses, orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";

type Range = "today" | "7d" | "30d" | "all";

function rangeStart(range: Range): Date | undefined {
  const start = new Date();
  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    return start;
  }
  if (range === "7d") {
    start.setDate(start.getDate() - 7);
    return start;
  }
  if (range === "30d") {
    start.setDate(start.getDate() - 30);
    return start;
  }
  return undefined;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { dict } = await getDictionary();
  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "7d" || rawRange === "30d" || rawRange === "all" ? rawRange : "today";

  const start = rangeStart(range);
  const db = getDb();

  const orderWhere = start
    ? and(gte(orders.createdAt, start), ne(orders.status, "cancelled"))
    : ne(orders.status, "cancelled");

  const [items, rangeOrders, rangeExpenses] = await Promise.all([
    db
      .select({
        productName: orderItems.productName,
        quantity: orderItems.quantity,
        unitCost: orderItems.unitCost,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderWhere),
    db.select({ total: orders.total }).from(orders).where(orderWhere),
    db
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(start ? gte(expenses.createdAt, start) : undefined),
  ]);

  const revenue = rangeOrders.reduce((sum, o) => sum + o.total, 0);
  const cogs = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const grossProfit = revenue - cogs;
  const expensesTotal = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - expensesTotal;

  const breakdown = new Map<
    string,
    { units: number; revenue: number; cost: number }
  >();
  for (const item of items) {
    const entry = breakdown.get(item.productName) ?? { units: 0, revenue: 0, cost: 0 };
    entry.units += item.quantity;
    entry.revenue += item.subtotal;
    entry.cost += item.unitCost * item.quantity;
    breakdown.set(item.productName, entry);
  }
  const breakdownRows = Array.from(breakdown.entries()).sort(
    (a, b) => b[1].revenue - a[1].revenue
  );

  const ranges: { value: Range; label: string }[] = [
    { value: "today", label: dict.reports.today },
    { value: "7d", label: dict.reports.last7 },
    { value: "30d", label: dict.reports.last30 },
    { value: "all", label: dict.reports.allTime },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg text-accent">{dict.reports.title}</h1>

      <div className="flex gap-1 overflow-x-auto">
        {ranges.map((r) => (
          <Link
            key={r.value}
            href={`/reports?range=${r.value}`}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors ${
              range === r.value
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border text-muted hover:text-foreground"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted">{dict.reports.revenue}</p>
          <p className="text-lg font-semibold">
            {formatMoney(revenue)} {dict.common.currency}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">{dict.reports.cogs}</p>
          <p className="text-lg font-semibold">
            {formatMoney(cogs)} {dict.common.currency}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">{dict.reports.grossProfit}</p>
          <p className="text-lg font-semibold">
            {formatMoney(grossProfit)} {dict.common.currency}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">{dict.reports.expenses}</p>
          <p className="text-lg font-semibold text-red-600">
            {formatMoney(expensesTotal)} {dict.common.currency}
          </p>
        </Card>
      </div>

      <Card className="border-accent">
        <p className="text-xs text-muted">{dict.reports.netProfit}</p>
        <p className="text-2xl font-semibold text-accent">
          {formatMoney(netProfit)} {dict.common.currency}
        </p>
      </Card>

      <div className="space-y-3">
        <p className="text-sm font-medium">{dict.reports.breakdown}</p>
        {breakdownRows.length === 0 && (
          <p className="text-sm text-muted">{dict.reports.noData}</p>
        )}
        {breakdownRows.map(([name, entry]) => (
          <Card key={name} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{name}</p>
              <p className="text-xs text-muted">
                {entry.units} {dict.reports.unitsSold.toLowerCase()}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatMoney(entry.revenue)}</p>
              <p className="text-xs text-muted">
                +{formatMoney(entry.revenue - entry.cost)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
