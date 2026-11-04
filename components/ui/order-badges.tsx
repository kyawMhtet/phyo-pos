import type { OrderStatus, PaymentState } from "@/lib/orders";
import { Badge, type BadgeTone } from "./badge";

const statusTones: Record<OrderStatus, BadgeTone> = {
  pending: "warn",
  packed: "info",
  delivered: "good",
  cancelled: "neutral",
};

const paymentTones: Record<PaymentState, BadgeTone> = {
  paid: "good",
  partial: "warn",
  unpaid: "bad",
};

export function StatusBadge({ status, label }: { status: OrderStatus; label: string }) {
  return <Badge tone={statusTones[status]}>{label}</Badge>;
}

export function PaymentBadge({ state, label }: { state: PaymentState; label: string }) {
  return <Badge tone={paymentTones[state]}>{label}</Badge>;
}
