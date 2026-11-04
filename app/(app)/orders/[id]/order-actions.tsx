"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import {
  PAYMENT_METHODS,
  paymentMethodLabels,
  type OrderStatus,
  type PaymentMethod,
} from "@/lib/orders";
import type { Dictionary } from "@/lib/i18n";
import { CheckIcon, CoinIcon, PrinterIcon, TruckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Hint, Label, NumberInput } from "@/components/ui/input";
import { Chips } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useSubmit } from "@/components/ui/use-submit";
import { cancelOrder, recordPayment, setOrderStatus } from "../actions";

export function OrderActions({
  orderId,
  status,
  balance,
  paymentMethod,
  dict,
}: {
  orderId: number;
  status: OrderStatus;
  balance: number;
  paymentMethod: PaymentMethod;
  dict: Dictionary;
}) {
  const { pending, submit } = useSubmit(dict.common.errorGeneric);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const cancelled = status === "cancelled";
  const next =
    status === "pending"
      ? ({ status: "packed", label: dict.orders.markPacked, Icon: CheckIcon } as const)
      : status === "packed"
        ? ({ status: "delivered", label: dict.orders.markDelivered, Icon: TruckIcon } as const)
        : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            disabled={pending}
            className="flex-1 sm:flex-none"
            onClick={() => submit(() => setOrderStatus(orderId, next.status))}
          >
            <next.Icon className="h-4 w-4" />
            {next.label}
          </Button>
        )}
        {balance > 0 && !cancelled && (
          <Button
            variant={next ? "secondary" : "primary"}
            className="flex-1 sm:flex-none"
            onClick={() => setPaymentOpen(true)}
          >
            <CoinIcon className="h-4 w-4" />
            {dict.orders.recordPayment}
          </Button>
        )}
        <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => window.print()}>
          <PrinterIcon className="h-4 w-4" />
          {dict.orders.printReceipt}
        </Button>
        {!cancelled && (
          <Button
            variant="ghost"
            className="text-bad hover:text-bad sm:ml-auto"
            onClick={() => setCancelOpen(true)}
          >
            {dict.orders.cancelOrder}
          </Button>
        )}
      </div>
      {next && (
        <Hint>{status === "pending" ? dict.orders.nextPending : dict.orders.nextPacked}</Hint>
      )}

      <Sheet
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title={dict.orders.recordPayment}
        closeLabel={dict.common.close}
      >
        <PaymentForm
          orderId={orderId}
          balance={balance}
          paymentMethod={paymentMethod}
          dict={dict}
          onDone={() => setPaymentOpen(false)}
        />
      </Sheet>

      <Sheet
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title={dict.orders.cancelOrder}
        closeLabel={dict.common.close}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">{dict.orders.cancelWarning}</p>
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => submit(() => cancelOrder(orderId), () => setCancelOpen(false))}
          >
            {dict.orders.cancelConfirm}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function PaymentForm({
  orderId,
  balance,
  paymentMethod,
  dict,
  onDone,
}: {
  orderId: number;
  balance: number;
  paymentMethod: PaymentMethod;
  dict: Dictionary;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState<number | null>(balance);
  const [method, setMethod] = useState(paymentMethod);
  const { pending, fieldErrors, submit, clearError } = useSubmit(dict.common.errorGeneric);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="amount">
          {dict.orders.amountReceived} ({dict.orders.balance} {formatMoney(balance)})
        </Label>
        <NumberInput
          id="amount"
          value={amount}
          error={fieldErrors.amount}
          onValueChange={(value) => {
            setAmount(value);
            clearError("amount");
          }}
        />
      </div>
      <Chips
        value={method}
        onChange={setMethod}
        options={PAYMENT_METHODS.map((value) => ({
          value,
          label: paymentMethodLabels(dict)[value],
        }))}
      />
      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() => submit(() => recordPayment(orderId, { amount: amount ?? 0, method }), onDone)}
      >
        {pending ? dict.orders.saving : dict.common.save}
      </Button>
    </div>
  );
}
