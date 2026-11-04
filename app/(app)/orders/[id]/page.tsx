import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import {
  paymentMethodLabels,
  paymentState,
  paymentStateLabels,
  statusLabels,
} from "@/lib/orders";
import { getDictionary } from "@/lib/i18n";
import { CheckIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaymentBadge, StatusBadge } from "@/components/ui/order-badges";
import { PageHelp } from "@/components/page-help";
import { Page, PageHeader } from "@/components/ui/page";
import { OrderActions } from "./order-actions";
import { Voucher } from "./voucher";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ done?: string }>;
}) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const { done } = await searchParams;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const db = getDb();
  const [order, items] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.id, orderId) }),
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
  ]);

  if (!order) notFound();

  const state = paymentState(order);
  const balance = order.total - order.paidAmount;
  const cancelled = order.status === "cancelled";

  return (
    <>
      <div className="print:hidden">
        <Page>
          <PageHeader
            title={`${dict.orders.order} #${order.id}`}
            help={<PageHelp topic="orderDetail" dict={dict} />}
            subtitle={formatDateTime(order.createdAt)}
            backHref="/orders"
            backLabel={dict.common.back}
            actions={
              <div className="flex gap-1">
                {!cancelled && (
                  <PaymentBadge state={state} label={paymentStateLabels(dict)[state]} />
                )}
                <StatusBadge status={order.status} label={statusLabels(dict)[order.status]} />
              </div>
            }
          />

          {done && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-good/12 px-4 py-3">
              <p className="flex items-center gap-2 font-semibold text-good">
                <CheckIcon className="h-5 w-5" />
                {dict.orders.saleComplete}
              </p>
              <Link href="/sell" className={buttonClass({ size: "sm" })}>
                {dict.orders.newSale}
              </Link>
            </div>
          )}

          <OrderActions
            orderId={order.id}
            status={order.status}
            balance={balance}
            paymentMethod={order.paymentMethod}
            dict={dict}
          />

          <div className="grid gap-4 md:grid-cols-[1fr_20rem] md:items-start">
            <Card flush>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium">{item.productName}</p>
                      <p className="money text-sm text-muted">
                        {[item.packLabel, item.optionLabel].filter(Boolean).join(" · ")}
                        {(item.packLabel || item.optionLabel) && " · "}
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </p>
                    </div>
                    <p className="money shrink-0 font-semibold">{formatMoney(item.subtotal)}</p>
                  </li>
                ))}
              </ul>
            </Card>

            <div className="space-y-4">
              <div className="receipt space-y-1.5 bg-surface p-4 text-sm">
                <Row label={dict.orders.subtotal} value={formatMoney(order.itemsSubtotal)} />
                {order.deliveryFee > 0 && (
                  <Row label={dict.orders.deliveryFee} value={formatMoney(order.deliveryFee)} />
                )}
                {order.discount > 0 && (
                  <Row label={dict.orders.discount} value={`-${formatMoney(order.discount)}`} />
                )}
                <div className="flex items-baseline justify-between border-t border-dashed border-border pt-2">
                  <span className="font-semibold">{dict.orders.total}</span>
                  <span className="money font-display text-2xl font-semibold tracking-tight">
                    {formatMoney(order.total)}
                  </span>
                </div>
                <Row label={dict.orders.advance} value={formatMoney(order.paidAmount)} />
                <div className="flex justify-between font-semibold">
                  <span>{dict.orders.balance}</span>
                  <span className={`money ${balance > 0 && !cancelled ? "text-bad" : ""}`}>
                    {formatMoney(balance)}
                  </span>
                </div>
                {order.paidAmount > 0 && (
                  <p className="pt-1 text-xs text-muted">
                    {paymentMethodLabels(dict)[order.paymentMethod]}
                  </p>
                )}
              </div>

              <Card className="space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  {order.customerId ? (
                    <Link
                      href={`/customers/${order.customerId}`}
                      className="font-semibold hover:text-accent"
                    >
                      {order.customerName}
                    </Link>
                  ) : (
                    <p className="font-semibold">{order.customerName}</p>
                  )}
                  <Badge>
                    {order.fulfillment === "delivery"
                      ? dict.checkout.delivery
                      : dict.checkout.pickup}
                  </Badge>
                </div>
                {order.customerPhone && (
                  <a href={`tel:${order.customerPhone}`} className="block text-accent">
                    {order.customerPhone}
                  </a>
                )}
                {order.address && <p className="whitespace-pre-line text-muted">{order.address}</p>}
                {order.note && (
                  <p className="text-muted">
                    {dict.orders.note}: {order.note}
                  </p>
                )}
                {order.handledBy && (
                  <p className="text-muted">
                    {dict.orders.handledBy}: {order.handledBy}
                  </p>
                )}
              </Card>
            </div>
          </div>
        </Page>
      </div>

      <Voucher order={order} items={items} dict={dict} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="money">{value}</span>
    </div>
  );
}
