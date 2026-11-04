import Link from "next/link";
import { asc, eq, like, ne, or, sql, and } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { ChevronIcon, PeopleIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Empty, Page, PageHeader } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { SearchBox } from "@/components/ui/search-box";
import { CustomerButton } from "./customer-sheet";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { dict } = await getDictionary();
  const { page: pageParam, q } = await searchParams;
  const page = parsePage(pageParam);
  const query = q?.trim();

  const customerRows = await getDb()
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      address: customers.address,
      orderCount: sql<number>`count(${orders.id})`,
      spent: sql<number>`coalesce(sum(${orders.total}), 0)`,
      owing: sql<number>`coalesce(sum(${orders.total} - ${orders.paidAmount}), 0)`,
    })
    .from(customers)
    .leftJoin(orders, and(eq(orders.customerId, customers.id), ne(orders.status, "cancelled")))
    .where(
      query
        ? or(like(customers.name, `%${query}%`), like(customers.phone, `%${query}%`))
        : undefined
    )
    .groupBy(customers.id)
    .orderBy(asc(customers.name))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
  const hasMore = customerRows.length > PAGE_SIZE;
  const allCustomers = customerRows.slice(0, PAGE_SIZE);

  return (
    <Page>
      <PageHeader
        title={dict.customers.title}
        actions={<CustomerButton dict={dict} />}
      />

      <SearchBox placeholder={dict.customers.search} />

      {allCustomers.length === 0 ? (
        <Empty
          icon={<PeopleIcon />}
          title={query ? `${dict.common.noResults} "${query}"` : dict.customers.noCustomers}
          hint={query ? undefined : dict.customers.noCustomersHint}
        />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {allCustomers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/customers/${customer.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sunken/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{customer.name}</p>
                  <p className="truncate text-sm text-muted">
                    {[customer.phone, customer.address].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="money font-semibold">{formatMoney(customer.spent)}</p>
                  {customer.owing > 0 ? (
                    <Badge tone="bad" className="money">
                      {dict.orders.balance} {formatMoney(customer.owing)}
                    </Badge>
                  ) : (
                    <p className="money text-xs text-muted">
                      {customer.orderCount} {dict.customers.ordersCount}
                    </p>
                  )}
                </div>
                <ChevronIcon className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/customers"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
        params={{ q: query }}
      />
    </Page>
  );
}
