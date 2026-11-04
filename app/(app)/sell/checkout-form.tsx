"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/money";
import { PAYMENT_METHODS, paymentMethodLabels, type PaymentMethod } from "@/lib/orders";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input, Label, NumberInput, Textarea } from "@/components/ui/input";
import { Chips, Segmented } from "@/components/ui/segmented";
import { createOrder } from "../orders/actions";
import type { useCart } from "./use-cart";

export type CustomerOption = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
};

const HANDLED_BY_KEY = "diva-handled-by";

function rememberedHandledBy() {
  try {
    return localStorage.getItem(HANDLED_BY_KEY) ?? "";
  } catch {
    return "";
  }
}

export function CheckoutForm({
  cart,
  customers,
  dict,
}: {
  cart: ReturnType<typeof useCart>;
  customers: CustomerOption[];
  dict: Dictionary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [discount, setDiscount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<"full" | "advance" | "none">("full");
  const [advance, setAdvance] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [handledBy, setHandledBy] = useState(rememberedHandledBy);

  const isDelivery = fulfillment === "delivery";
  const fee = isDelivery ? (deliveryFee ?? 0) : 0;
  const appliedDiscount = Math.min(discount ?? 0, cart.subtotal);
  const total = cart.subtotal + fee - appliedDiscount;
  const paid = payment === "full" ? total : payment === "advance" ? Math.min(advance ?? 0, total) : 0;
  const balance = total - paid;

  const matches = useMemo(() => {
    const query = name.trim().toLowerCase();
    if (!query || customerId !== null) return [];
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) || customer.phone?.includes(query)
      )
      .slice(0, 4);
  }, [customers, name, customerId]);

  function pickCustomer(customer: CustomerOption) {
    setCustomerId(customer.id);
    setName(customer.name);
    setPhone(customer.phone ?? "");
    setAddress(customer.address ?? "");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await createOrder({
        lines: cart.lines.map((line) => ({
          packId: line.packId,
          quantity: line.quantity,
          option: line.option,
        })),
        fulfillment,
        customerId,
        customerName: name,
        customerPhone: phone,
        address: isDelivery ? address : "",
        note,
        handledBy,
        deliveryFee: fee,
        discount: appliedDiscount,
        payment,
        advance: advance ?? 0,
        paymentMethod: method,
      });

      if ("error" in result) {
        setError(result.error);
        return;
      }
      try {
        localStorage.setItem(HANDLED_BY_KEY, handledBy);
      } catch {
        // Only a convenience; nothing to do if storage is blocked.
      }
      router.push(`/orders/${result.orderId}?done=1`);
      cart.clear();
    });
  }

  return (
    <div className="space-y-5">
      <Segmented
        value={fulfillment}
        onChange={setFulfillment}
        options={[
          { value: "delivery", label: dict.checkout.delivery },
          { value: "pickup", label: dict.checkout.pickup },
        ]}
      />

      <div className="space-y-3">
        <div>
          <Label htmlFor="customerName">
            {dict.checkout.customer}
            {!isDelivery && ` (${dict.common.optional})`}
          </Label>
          <Input
            id="customerName"
            value={name}
            autoComplete="off"
            placeholder={dict.checkout.customerPlaceholder}
            onChange={(e) => {
              setName(e.target.value);
              setCustomerId(null);
            }}
          />
          {matches.length > 0 && (
            <ul className="mt-1 divide-y divide-border overflow-hidden rounded-xl border border-border">
              {matches.map((customer) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() => pickCustomer(customer)}
                    className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-left text-sm hover:bg-sunken"
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-muted">{customer.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <Label htmlFor="customerPhone">{dict.customers.phone}</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        {isDelivery && (
          <div>
            <Label htmlFor="address">{dict.customers.address}</Label>
            <Textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isDelivery && (
          <div>
            <Label htmlFor="deliveryFee">{dict.orders.deliveryFee}</Label>
            <NumberInput
              id="deliveryFee"
              value={deliveryFee}
              onValueChange={setDeliveryFee}
              placeholder="0"
            />
          </div>
        )}
        <div>
          <Label htmlFor="discount">{dict.orders.discount}</Label>
          <NumberInput
            id="discount"
            value={discount}
            onValueChange={setDiscount}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>{dict.checkout.payment}</Label>
          <Segmented
            value={payment}
            onChange={setPayment}
            options={[
              { value: "full", label: dict.checkout.paidFull },
              { value: "advance", label: dict.checkout.advance },
              { value: "none", label: dict.checkout.unpaid },
            ]}
          />
        </div>
        {payment === "advance" && (
          <div>
            <Label htmlFor="advance">{dict.checkout.advanceAmount}</Label>
            <NumberInput id="advance" value={advance} onValueChange={setAdvance} placeholder="0" />
          </div>
        )}
        {payment !== "none" && (
          <Chips
            value={method}
            onChange={setMethod}
            options={PAYMENT_METHODS.map((value) => ({
              value,
              label: paymentMethodLabels(dict)[value],
            }))}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="note">{dict.orders.note}</Label>
          <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="handledBy">{dict.orders.handledBy}</Label>
          <Input
            id="handledBy"
            value={handledBy}
            placeholder={dict.orders.handledByPlaceholder}
            onChange={(e) => setHandledBy(e.target.value)}
          />
        </div>
      </div>

      <div className="receipt space-y-1.5 bg-sunken p-4 text-sm">
        <Row label={`${dict.orders.subtotal} (${cart.count})`} value={formatMoney(cart.subtotal)} />
        {fee > 0 && <Row label={dict.orders.deliveryFee} value={formatMoney(fee)} />}
        {appliedDiscount > 0 && (
          <Row label={dict.orders.discount} value={`-${formatMoney(appliedDiscount)}`} />
        )}
        <div className="flex items-baseline justify-between border-t border-dashed border-muted/40 pt-2">
          <span className="font-semibold">{dict.orders.total}</span>
          <span className="money font-display text-2xl font-semibold tracking-tight">
            {formatMoney(total)}
          </span>
        </div>
        {payment !== "full" && (
          <>
            <Row label={dict.orders.advance} value={formatMoney(paid)} />
            <Row label={dict.orders.balance} value={formatMoney(balance)} strong />
          </>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-bad/10 px-3 py-2 text-sm font-medium text-bad">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={pending || cart.count === 0 || (isDelivery && !name.trim())}
        onClick={submit}
      >
        {pending ? dict.orders.saving : dict.checkout.complete}
      </Button>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-muted"}`}>
      <span>{label}</span>
      <span className="money">{value}</span>
    </div>
  );
}
