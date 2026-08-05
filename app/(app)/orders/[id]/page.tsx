import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { PrintButton } from "@/components/print-button";
import { updateOrderStatus } from "../actions";

const statuses = ["pending", "paid", "delivered", "cancelled"] as const;

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const orderId = Number(id);
  if (!Number.isInteger(orderId)) notFound();

  const db = getDb();
  const [order, items] = await Promise.all([
    db.query.orders.findFirst({ where: eq(orders.id, orderId) }),
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
  ]);

  if (!order) notFound();

  const updateStatusWithId = updateOrderStatus.bind(null, orderId);
  const paymentLabel: Record<string, string> = {
    cash: dict.orders.cash,
    transfer: dict.orders.transfer,
    other: dict.orders.other,
  };
  const statusLabel: Record<string, string> = {
    pending: dict.orders.statusPending,
    paid: dict.orders.statusPaid,
    delivered: dict.orders.statusDelivered,
    cancelled: dict.orders.statusCancelled,
  };

  return (
    <div>
      {/* Screen view */}
      <div className="space-y-6 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="font-display text-lg text-accent">
              {dict.orders.order} #{order.id}
            </h1>
            <p className="text-sm text-muted">{order.createdAt.toLocaleString()}</p>
          </div>
          <PrintButton label={dict.orders.printReceipt} />
        </div>

        <Card className="space-y-1">
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted">
            {[order.customerPhone, order.address].filter(Boolean).join(" · ") || "—"}
          </p>
          {order.note && (
            <p className="text-sm text-muted">
              {dict.orders.note}: {order.note}
            </p>
          )}
          <p className="text-xs text-muted">
            {paymentLabel[order.paymentMethod]}
            {order.handledBy ? ` · ${order.handledBy}` : ""}
          </p>
        </Card>

        <Card className="space-y-2">
          <p className="text-sm font-medium">{dict.orders.items}</p>
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatMoney(item.subtotal)}</span>
            </div>
          ))}
          <div className="space-y-1 border-t border-border pt-2 text-sm">
            <div className="flex justify-between text-muted">
              <span>{dict.orders.subtotal}</span>
              <span>{formatMoney(order.itemsSubtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{dict.orders.deliveryFee}</span>
              <span>{formatMoney(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>{dict.orders.discount}</span>
              <span>-{formatMoney(order.discount)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{dict.orders.total}</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="space-y-3">
          <p className="text-sm font-medium">{dict.orders.status}</p>
          <form action={updateStatusWithId} className="flex gap-2">
            <Select name="status" defaultValue={order.status} className="flex-1">
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabel[status]}
                </option>
              ))}
            </Select>
            <Button type="submit">{dict.orders.update}</Button>
          </form>
        </Card>
      </div>

      {/* Print-only receipt */}
      <div className="hidden text-black print:block">
        <div className="flex items-start justify-between gap-4 border-b-2 border-black pb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={dict.common.appName} className="h-16 w-auto" />
          <div className="text-right text-sm">
            <p className="text-base font-bold">
              {dict.orders.order} #{order.id}
            </p>
            <p className="text-gray-500">{order.createdAt.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
              {dict.orders.customer}
            </p>
            <p className="font-semibold">{order.customerName}</p>
            {order.customerPhone && <p>{order.customerPhone}</p>}
            {order.address && <p>{order.address}</p>}
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs tracking-wide text-gray-500 uppercase">
              {dict.orders.paymentMethod}
            </p>
            <p className="font-semibold">{paymentLabel[order.paymentMethod]}</p>
            {order.handledBy && <p className="text-gray-500">{order.handledBy}</p>}
          </div>
        </div>

        {order.note && (
          <p className="mt-3 text-sm text-gray-600">
            {dict.orders.note}: {order.note}
          </p>
        )}

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-2 font-semibold">{dict.orders.items}</th>
              <th className="py-2 text-right font-semibold">{dict.orders.qty}</th>
              <th className="py-2 text-right font-semibold">{dict.orders.subtotal}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-gray-200">
                <td className="py-2">{item.productName}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">{formatMoney(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-56 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{dict.orders.subtotal}</span>
            <span>{formatMoney(order.itemsSubtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{dict.orders.deliveryFee}</span>
            <span>{formatMoney(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{dict.orders.discount}</span>
            <span>-{formatMoney(order.discount)}</span>
          </div>
          <div className="flex justify-between border-t-2 border-black pt-1 text-base font-bold">
            <span>{dict.orders.total}</span>
            <span>
              {formatMoney(order.total)} {dict.common.currency}
            </span>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">{dict.orders.thankYou}</p>
      </div>
    </div>
  );
}
