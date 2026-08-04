import { desc, like, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SearchBox } from "@/components/ui/search-box";
import { createCustomer } from "./actions";

export default async function CustomersPage({
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
    ? or(like(customers.name, `%${query}%`), like(customers.phone, `%${query}%`))
    : undefined;

  const customerRows = await db
    .select()
    .from(customers)
    .where(searchWhere)
    .orderBy(desc(customers.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
  const hasMore = customerRows.length > PAGE_SIZE;
  const allCustomers = customerRows.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg text-accent">{dict.customers.title}</h1>

      <SearchBox placeholder={dict.customers.search} />

      <div className="space-y-3">
        {allCustomers.length === 0 && (
          <p className="text-sm text-muted">
            {query
              ? `${dict.common.noResults} "${query}"`
              : dict.customers.noCustomers}
          </p>
        )}
        {allCustomers.map((customer, i) => (
          <Card key={customer.id} className="rise-in" style={{ animationDelay: `${i * 40}ms` }}>
            <p className="font-medium">{customer.name}</p>
            <p className="text-xs text-muted">
              {[customer.phone, customer.address].filter(Boolean).join(" · ") || "—"}
            </p>
          </Card>
        ))}
      </div>

      <Pagination
        basePath="/customers"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
        query={query}
      />

      <details className="rounded-lg border border-dashed border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          {dict.customers.addCustomer}
        </summary>
        <form action={createCustomer} className="space-y-3 px-4 pb-4">
          <div>
            <Label htmlFor="name">{dict.customers.name}</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="phone">{dict.customers.phone}</Label>
            <Input id="phone" name="phone" />
          </div>
          <div>
            <Label htmlFor="address">{dict.customers.address}</Label>
            <Input id="address" name="address" />
          </div>
          <Button type="submit">{dict.customers.addCustomer}</Button>
        </form>
      </details>
    </div>
  );
}
