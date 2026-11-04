import { and, eq, gte, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses, orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { addDays, formatShortDate, startOfDay } from "@/lib/time";
import { getDictionary } from "@/lib/i18n";
import { ChartIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { DailyBars } from "@/components/ui/daily-bars";
import { Empty, FilterTabs, Page, PageHeader, SectionTitle, Stat } from "@/components/ui/page";

type Range = "today" | "7d" | "30d" | "all";

function rangeStart(range: Range): Date | undefined {
  if (range === "today") return startOfDay();
  if (range === "7d") return addDays(startOfDay(), -6);
  if (range === "30d") return addDays(startOfDay(), -29);
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

  const [items, rangeOrders, rangeExpenses, [outstanding]] = await Promise.all([
    db
      .select({
        productName: orderItems.productName,
        packLabel: orderItems.packLabel,
        quantity: orderItems.quantity,
        unitCost: orderItems.unitCost,
        subtotal: orderItems.subtotal,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(orderWhere),
    db
      .select({ total: orders.total, createdAt: orders.createdAt })
      .from(orders)
      .where(orderWhere),
    db
      .select({ amount: expenses.amount })
      .from(expenses)
      .where(start ? gte(expenses.createdAt, start) : undefined),
    db
      .select({ amount: sql<number>`coalesce(sum(${orders.total} - ${orders.paidAmount}), 0)` })
      .from(orders)
      .where(ne(orders.status, "cancelled")),
  ]);

  const revenue = rangeOrders.reduce((sum, o) => sum + o.total, 0);
  const cogs = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
  const grossProfit = revenue - cogs;
  const expensesTotal = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - expensesTotal;

  const breakdown = new Map<
    string,
    { name: string; pack: string | null; units: number; revenue: number; cost: number }
  >();
  for (const item of items) {
    const key = `${item.productName}|${item.packLabel ?? ""}`;
    const entry = breakdown.get(key) ?? {
      name: item.productName,
      pack: item.packLabel,
      units: 0,
      revenue: 0,
      cost: 0,
    };
    entry.units += item.quantity;
    entry.revenue += item.subtotal;
    entry.cost += item.unitCost * item.quantity;
    breakdown.set(key, entry);
  }
  const breakdownRows = Array.from(breakdown.values()).sort((a, b) => b.revenue - a.revenue);

  const chartDays = range === "7d" ? 7 : range === "30d" ? 30 : 0;
  const daily = Array.from({ length: chartDays }, (_, index) => {
    const dayStart = addDays(startOfDay(), index - chartDays + 1);
    const dayEnd = addDays(dayStart, 1);
    return {
      label: formatShortDate(dayStart),
      value: rangeOrders
        .filter((o) => o.createdAt >= dayStart && o.createdAt < dayEnd)
        .reduce((sum, o) => sum + o.total, 0),
    };
  });

  const ranges: { value: Range; label: string }[] = [
    { value: "today", label: dict.reports.today },
    { value: "7d", label: dict.reports.last7 },
    { value: "30d", label: dict.reports.last30 },
    { value: "all", label: dict.reports.allTime },
  ];
  const currency = dict.common.currency;

  return (
    <Page>
      <PageHeader title={dict.reports.title} />

      <FilterTabs
        tabs={ranges.map((r) => ({
          href: `/reports?range=${r.value}`,
          label: r.label,
          active: range === r.value,
        }))}
      />

      <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
        <p className="text-sm text-ink-muted">{dict.reports.netProfit}</p>
        <p className="money mt-1 font-display text-4xl font-semibold tracking-tight">
          {formatMoney(netProfit)}
          <span className="ml-1.5 text-base font-medium text-ink-muted">{currency}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={dict.reports.revenue} value={formatMoney(revenue)} />
        <Stat label={dict.reports.cogs} value={formatMoney(cogs)} />
        <Stat label={dict.reports.expenses} value={formatMoney(expensesTotal)} />
        <Stat label={dict.reports.outstanding} value={formatMoney(outstanding.amount)} />
      </div>

      {chartDays > 0 && (
        <Card className="space-y-3">
          <SectionTitle>{dict.reports.dailySales}</SectionTitle>
          <DailyBars data={daily} unit={currency} />
        </Card>
      )}

      <section className="space-y-3">
        <SectionTitle>{dict.reports.breakdown}</SectionTitle>
        {breakdownRows.length === 0 ? (
          <Empty icon={<ChartIcon />} title={dict.reports.noData} />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {breakdownRows.map((row) => (
              <li
                key={`${row.name}|${row.pack}`}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{row.name}</p>
                  <p className="money text-sm text-muted">
                    {row.pack ? `${row.pack} · ` : ""}
                    {row.units} {dict.reports.unitsSold}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="money font-semibold">{formatMoney(row.revenue)}</p>
                  <p className="money text-sm text-good">+{formatMoney(row.revenue - row.cost)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
