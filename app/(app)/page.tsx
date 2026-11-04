import Link from "next/link";
import { and, desc, eq, gte, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses, orderItems, orders } from "@/lib/db/schema";
import { getProductLines } from "@/lib/db/queries";
import { formatMoney } from "@/lib/money";
import { addDays, formatDate, formatDateTime, formatShortDate, startOfDay } from "@/lib/time";
import { stockLevel } from "@/lib/catalog";
import { paymentState, paymentStateLabels, statusLabels } from "@/lib/orders";
import { getDictionary } from "@/lib/i18n";
import { BagIcon, CheckIcon, CoinIcon, TagIcon, TruckIcon, WarningIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DailyBars } from "@/components/ui/daily-bars";
import { PaymentBadge, StatusBadge } from "@/components/ui/order-badges";
import { Empty, Page, SectionTitle } from "@/components/ui/page";

const LOW_STOCK_PREVIEW = 6;

export default async function DashboardPage() {
  const { dict } = await getDictionary();
  const db = getDb();

  const today = startOfDay();
  const weekStart = addDays(today, -6);
  const notCancelled = ne(orders.status, "cancelled");

  const [weekOrders, todaysItems, [expenseSum], queue, [unpaid], recentOrders, lines] =
    await Promise.all([
      db
        .select({ total: orders.total, createdAt: orders.createdAt })
        .from(orders)
        .where(and(gte(orders.createdAt, weekStart), notCancelled)),
      db
        .select({ quantity: orderItems.quantity, unitCost: orderItems.unitCost })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(gte(orders.createdAt, today), notCancelled)),
      db
        .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
        .from(expenses)
        .where(gte(expenses.createdAt, today)),
      db
        .select({ status: orders.status, n: sql<number>`count(*)` })
        .from(orders)
        .groupBy(orders.status),
      db
        .select({ amount: sql<number>`coalesce(sum(${orders.total} - ${orders.paidAmount}), 0)` })
        .from(orders)
        .where(and(notCancelled, lt(orders.paidAmount, orders.total))),
      db.select().from(orders).orderBy(desc(orders.createdAt), desc(orders.id)).limit(5),
      getProductLines(),
    ]);

  const todaysOrders = weekOrders.filter((order) => order.createdAt >= today);
  const todaysSales = todaysOrders.reduce((sum, order) => sum + order.total, 0);
  const todaysCogs = todaysItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const profit = todaysSales - todaysCogs - expenseSum.total;

  const countOf = (status: string) => queue.find((row) => row.status === status)?.n ?? 0;

  const week = Array.from({ length: 7 }, (_, index) => {
    const dayStart = addDays(weekStart, index);
    const dayEnd = addDays(dayStart, 1);
    return {
      label: formatShortDate(dayStart),
      value: weekOrders
        .filter((order) => order.createdAt >= dayStart && order.createdAt < dayEnd)
        .reduce((sum, order) => sum + order.total, 0),
    };
  });

  const lowStock = lines
    .flatMap((line) =>
      line.sizes
        .filter((size) => size.isActive && size.packs.length > 0)
        .map((size) => ({ line, size, level: stockLevel(size.stock, line.lowStockAt) }))
    )
    .filter((entry) => entry.level !== "ok")
    .sort((a, b) => a.size.stock - b.size.stock);

  const statuses = statusLabels(dict);
  const payments = paymentStateLabels(dict);

  const queueTiles = [
    {
      href: "/orders?filter=pending",
      label: dict.dashboard.toPack,
      value: String(countOf("pending")),
      Icon: CheckIcon,
    },
    {
      href: "/orders?filter=packed",
      label: dict.dashboard.toDeliver,
      value: String(countOf("packed")),
      Icon: TruckIcon,
    },
    {
      href: "/orders?filter=unpaid",
      label: dict.dashboard.unpaid,
      value: formatMoney(unpaid.amount),
      Icon: CoinIcon,
    },
  ];

  return (
    <Page wide>
      <div className="flex items-center justify-between gap-3">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-wordmark.png"
            alt={dict.common.appName}
            className="h-6 w-auto lg:hidden dark:invert"
          />
          <h1 className="hidden font-display text-2xl font-semibold tracking-tight lg:block">
            {dict.dashboard.title}
          </h1>
          <p className="text-sm text-muted">{formatDate(new Date())}</p>
        </div>
        <Link href="/sell" className={`${buttonClass()} lg:hidden`}>
          <TagIcon className="h-4 w-4" />
          {dict.dashboard.newSale}
        </Link>
      </div>

      <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
        <p className="text-sm text-ink-muted">{dict.dashboard.todaySales}</p>
        <p className="money mt-1 font-display text-4xl font-semibold tracking-tight">
          {formatMoney(todaysSales)}
          <span className="ml-1.5 text-base font-medium text-ink-muted">
            {dict.common.currency}
          </span>
        </p>
        <dl className="money mt-4 grid grid-cols-3 gap-3 border-t border-ink-line pt-3 text-sm">
          <div>
            <dt className="text-ink-muted">{dict.dashboard.ordersToday}</dt>
            <dd className="font-semibold">{todaysOrders.length}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.dashboard.todayExpenses}</dt>
            <dd className="font-semibold">{formatMoney(expenseSum.total)}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">{dict.dashboard.profit}</dt>
            <dd className="font-semibold text-gold">{formatMoney(profit)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {queueTiles.map(({ href, label, value, Icon }) => (
          <Link
            key={href}
            href={href}
            className="rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-accent/60 sm:p-4"
          >
            <Icon className="h-5 w-5 text-accent" />
            <p className="money mt-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {value}
            </p>
            <p className="text-xs text-muted sm:text-sm">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        <div className="space-y-5">
          <Card className="space-y-3">
            <SectionTitle>{dict.dashboard.last7}</SectionTitle>
            <DailyBars data={week} unit={dict.common.currency} />
          </Card>

          {lowStock.length > 0 && (
            <section className="space-y-3">
              <SectionTitle
                action={
                  <Link href="/products" className="text-sm font-medium text-accent">
                    {dict.dashboard.viewAll}
                  </Link>
                }
              >
                <span className="flex items-center gap-2">
                  <WarningIcon className="h-4 w-4 text-warn" />
                  {dict.dashboard.lowStock}
                  <span className="money text-sm font-medium text-muted">{lowStock.length}</span>
                </span>
              </SectionTitle>
              <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
                {lowStock.slice(0, LOW_STOCK_PREVIEW).map(({ line, size, level }) => (
                  <li key={size.id}>
                    <Link
                      href={`/products/${line.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-sunken/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{size.name}</p>
                        <p className="truncate text-xs text-muted">{line.name}</p>
                      </div>
                      <Badge tone={level === "out" ? "bad" : "warn"} className="money">
                        {formatMoney(size.stock)} {line.stockUnit}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <section className="space-y-3">
          <SectionTitle
            action={
              <Link href="/orders" className="text-sm font-medium text-accent">
                {dict.dashboard.viewAll}
              </Link>
            }
          >
            {dict.dashboard.recentOrders}
          </SectionTitle>
          {recentOrders.length === 0 ? (
            <Empty icon={<BagIcon />} title={dict.dashboard.noOrders} />
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
              {recentOrders.map((order) => {
                const state = paymentState(order);
                return (
                  <li key={order.id}>
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-sunken/60"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{order.customerName}</p>
                        <p className="truncate text-sm text-muted">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span className="money font-semibold">{formatMoney(order.total)}</span>
                        <span className="flex gap-1">
                          {order.status !== "cancelled" && (
                            <PaymentBadge state={state} label={payments[state]} />
                          )}
                          <StatusBadge status={order.status} label={statuses[order.status]} />
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Page>
  );
}
