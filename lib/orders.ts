import type { Dictionary } from "@/lib/i18n";

export const PAYMENT_METHODS = ["cash", "kpay", "wave", "ayapay", "transfer", "other"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type OrderStatus = "pending" | "packed" | "delivered" | "cancelled";
export type PaymentState = "paid" | "partial" | "unpaid";

export function paymentState(order: { total: number; paidAmount: number }): PaymentState {
  if (order.paidAmount >= order.total) return "paid";
  return order.paidAmount > 0 ? "partial" : "unpaid";
}

export function statusLabels(dict: Dictionary): Record<OrderStatus, string> {
  return {
    pending: dict.orders.statusPending,
    packed: dict.orders.statusPacked,
    delivered: dict.orders.statusDelivered,
    cancelled: dict.orders.statusCancelled,
  };
}

export function paymentStateLabels(dict: Dictionary): Record<PaymentState, string> {
  return {
    paid: dict.orders.paymentPaid,
    partial: dict.orders.paymentPartial,
    unpaid: dict.orders.paymentUnpaid,
  };
}

export function paymentMethodLabels(dict: Dictionary): Record<PaymentMethod, string> {
  return {
    cash: dict.orders.cash,
    kpay: dict.orders.kpay,
    wave: dict.orders.wave,
    ayapay: dict.orders.ayapay,
    transfer: dict.orders.transfer,
    other: dict.orders.other,
  };
}
