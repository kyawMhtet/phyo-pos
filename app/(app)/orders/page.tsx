import Link from "next/link";
import { desc, like, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stamp } from "@/components/ui/stamp";
import { Pagination } from "@/components/ui/pagination";
import { SearchBox } from "@/components/ui/search-box";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { dict } = await getDictionary();
  const { page: pageParam, q } = await searchParams;
  const page = parsePage(pageParam);
  const query = q?.trim();
  const db = getDb();

  const searchWhere = query
    ? or(like(orders.customerName, `%${query}%`), like(orders.customerPhone, `%${query}%`))
    : undefined;

  const orderRows = await db
    .select()
    .from(orders)
    .where(searchWhere)
    .orderBy(desc(orders.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
  const hasMore = orderRows.length > PAGE_SIZE;
  const allOrders = orderRows.slice(0, PAGE_SIZE);

  const statusLabel: Record<string, string> = {
    pending: dict.orders.statusPending,
    paid: dict.orders.statusPaid,
    delivered: dict.orders.statusDelivered,
    cancelled: dict.orders.statusCancelled,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg text-accent">{dict.orders.title}</h1>
        <Link href="/orders/new">
          <Button>{dict.orders.newSale}</Button>
        </Link>
      </div>

      <SearchBox placeholder={dict.orders.search} />

      <div className="space-y-3">
        {allOrders.length === 0 && (
          <p className="text-sm text-muted">
            {query ? `${dict.common.noResults} "${query}"` : dict.orders.noOrders}
          </p>
        )}
        {allOrders.map((order, i) => (
          <Link key={order.id} href={`/orders/${order.id}`}>
            <Card
              className="rise-in flex items-center justify-between hover:border-accent"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-xs text-muted">{order.createdAt.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatMoney(order.total)}</p>
                <Stamp
                  status={order.status as "pending" | "paid" | "delivered" | "cancelled"}
                  label={statusLabel[order.status]}
                />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Pagination
        basePath="/orders"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
        query={query}
      />
    </div>
  );
}
