import Link from "next/link";
import { and, count, desc, eq, like, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { paymentState, paymentStateLabels, statusLabels } from "@/lib/orders";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { BagIcon, ChevronIcon, TagIcon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { PaymentBadge, StatusBadge } from "@/components/ui/order-badges";
import { PageHelp } from "@/components/page-help";
import { Empty, FilterTabs, Page, PageHeader } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchBox } from "@/components/ui/search-box";

const filterWhere: Record<string, SQL | undefined> = {
  pending: eq(orders.status, "pending"),
  packed: eq(orders.status, "packed"),
  delivered: eq(orders.status, "delivered"),
  unpaid: and(ne(orders.status, "cancelled"), lt(orders.paidAmount, orders.total)),
  cancelled: eq(orders.status, "cancelled"),
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; filter?: string }>;
}) {
  const { dict } = await getDictionary();
  const { page: pageParam, q, filter: rawFilter } = await searchParams;
  const page = parsePage(pageParam);
  const query = q?.trim();
  const filter = rawFilter && rawFilter in filterWhere ? rawFilter : undefined;
  const db = getDb();

  const searchWhere = query
    ? or(
        like(orders.customerName, `%${query}%`),
        like(orders.customerPhone, `%${query}%`),
        eq(orders.id, Number(query.replace("#", "")) || 0)
      )
    : undefined;

  const [orderRows, statusCounts, [unpaid]] = await Promise.all([
    db
      .select()
      .from(orders)
      .where(and(searchWhere, filter ? filterWhere[filter] : undefined))
      .orderBy(desc(orders.createdAt), desc(orders.id))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ status: orders.status, n: count() }).from(orders).groupBy(orders.status),
    db
      .select({ n: sql<number>`count(*)` })
      .from(orders)
      .where(filterWhere.unpaid),
  ]);
  const hasMore = orderRows.length > PAGE_SIZE;
  const allOrders = orderRows.slice(0, PAGE_SIZE);

  const countOf = (status: string) => statusCounts.find((row) => row.status === status)?.n ?? 0;
  const statuses = statusLabels(dict);
  const payments = paymentStateLabels(dict);

  function tabHref(value?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (value) params.set("filter", value);
    const qs = params.toString();
    return qs ? `/orders?${qs}` : "/orders";
  }

  const tabs = [
    { href: tabHref(), label: dict.orders.filterAll, active: !filter },
    {
      href: tabHref("pending"),
      label: statuses.pending,
      active: filter === "pending",
      count: countOf("pending"),
    },
    {
      href: tabHref("packed"),
      label: statuses.packed,
      active: filter === "packed",
      count: countOf("packed"),
    },
    {
      href: tabHref("unpaid"),
      label: dict.orders.filterUnpaid,
      active: filter === "unpaid",
      count: unpaid.n,
    },
    { href: tabHref("delivered"), label: statuses.delivered, active: filter === "delivered" },
    { href: tabHref("cancelled"), label: statuses.cancelled, active: filter === "cancelled" },
  ];

  return (
    <Page wide>
      <PageHeader
        title={dict.orders.title}
        help={<PageHelp topic="orders" dict={dict} />}
        actions={
          <Link href="/sell" className={buttonClass()}>
            <TagIcon className="h-4 w-4" />
            {dict.orders.newSale}
          </Link>
        }
      />

      <SearchBox placeholder={dict.orders.search} />
      <FilterTabs tabs={tabs} />

      {allOrders.length === 0 ? (
        <Empty
          icon={<BagIcon />}
          title={query ? `${dict.common.noResults} "${query}"` : dict.orders.noOrders}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {allOrders.map((order) => {
            const state = paymentState(order);
            return (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken/60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-2">
                      <span className="money shrink-0 text-sm text-muted">#{order.id}</span>
                      <span className="truncate font-semibold">{order.customerName}</span>
                    </p>
                    <p className="truncate text-sm text-muted">
                      {[order.customerPhone, formatDateTime(order.createdAt)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <span className="money font-semibold sm:order-last sm:w-24 sm:text-right">
                      {formatMoney(order.total)}
                    </span>
                    <span className="flex gap-1">
                      {order.status !== "cancelled" && (
                        <PaymentBadge state={state} label={payments[state]} />
                      )}
                      <StatusBadge status={order.status} label={statuses[order.status]} />
                    </span>
                  </div>
                  <ChevronIcon className="hidden h-4 w-4 shrink-0 text-muted sm:block" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination
        basePath="/orders"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
        params={{ q: query, filter }}
      />
    </Page>
  );
}
