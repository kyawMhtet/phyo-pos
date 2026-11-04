import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { paymentState, paymentStateLabels, statusLabels } from "@/lib/orders";
import { getDictionary } from "@/lib/i18n";
import { BagIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PaymentBadge, StatusBadge } from "@/components/ui/order-badges";
import { PageHelp } from "@/components/page-help";
import { Empty, Page, PageHeader, SectionTitle, Stat } from "@/components/ui/page";
import { CustomerButton } from "../customer-sheet";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const customerId = Number(id);
  if (!Number.isInteger(customerId)) notFound();

  const db = getDb();
  const [customer, history] = await Promise.all([
    db.query.customers.findFirst({ where: eq(customers.id, customerId) }),
    db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt), desc(orders.id)),
  ]);
  if (!customer) notFound();

  const live = history.filter((order) => order.status !== "cancelled");
  const spent = live.reduce((sum, order) => sum + order.total, 0);
  const owing = live.reduce((sum, order) => sum + order.total - order.paidAmount, 0);
  const statuses = statusLabels(dict);
  const payments = paymentStateLabels(dict);

  return (
    <Page>
      <PageHeader
        title={customer.name}
        help={<PageHelp topic="customers" dict={dict} />}
        backHref="/customers"
        backLabel={dict.common.back}
        actions={<CustomerButton customer={customer} dict={dict} />}
      />

      {(customer.phone || customer.address) && (
        <Card className="space-y-1 text-sm">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="block font-medium text-accent">
              {customer.phone}
            </a>
          )}
          {customer.address && <p className="whitespace-pre-line text-muted">{customer.address}</p>}
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Stat label={dict.customers.ordersCount} value={String(live.length)} />
        <Stat label={dict.customers.totalSpent} value={formatMoney(spent)} />
        <Stat label={dict.orders.balance} value={formatMoney(owing)} />
      </div>

      <section className="space-y-3">
        <SectionTitle>{dict.orders.title}</SectionTitle>
        {history.length === 0 ? (
          <Empty icon={<BagIcon />} title={dict.orders.noOrders} />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {history.map((order) => {
              const state = paymentState(order);
              return (
                <li key={order.id}>
                  <Link
                    href={`/orders/${order.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-sunken/60"
                  >
                    <div className="min-w-0">
                      <p className="money font-medium">#{order.id}</p>
                      <p className="text-sm text-muted">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
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
    </Page>
  );
}
