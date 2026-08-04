import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg text-accent">
          {dict.orders.order} #{order.id}
        </h1>
        <p className="text-sm text-muted">{order.createdAt.toLocaleString()}</p>
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
        <div className="space-y-1 border-t border-dashed border-border pt-2 text-sm">
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
  );
}
