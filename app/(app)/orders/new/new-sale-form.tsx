"use client";

import { useActionState, useState } from "react";
import { createOrder, type OrderState } from "../actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { Dictionary } from "@/lib/i18n";

type ProductOption = {
  id: number;
  name: string;
  variant: string | null;
  price: number;
  stock: number;
};

type CustomerOption = {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
};

const initialState: OrderState = {};
let lineKeySeq = 1;

export function NewSaleForm({
  products,
  customers,
  dict,
}: {
  products: ProductOption[];
  customers: CustomerOption[];
  dict: Dictionary;
}) {
  const [state, formAction, pending] = useActionState(createOrder, initialState);
  const [lines, setLines] = useState([{ key: 0, productId: 0, quantity: "1" }]);
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");

  function addLine() {
    setLines((prev) => [...prev, { key: lineKeySeq++, productId: 0, quantity: "1" }]);
  }

  function removeLine(key: number) {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }

  function updateLine(
    key: number,
    patch: Partial<{ productId: number; quantity: string }>
  ) {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line))
    );
  }

  function normalizeQuantity(key: number, value: string) {
    const n = Math.trunc(Number(value));
    updateLine(key, { quantity: n >= 1 ? String(n) : "1" });
  }

  function handleCustomerSelect(value: string) {
    setCustomerId(value);
    const found = customers.find((c) => String(c.id) === value);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone ?? "");
      setAddress(found.address ?? "");
    }
  }

  const itemsSubtotal = lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + (product ? product.price * (Number(line.quantity) || 0) : 0);
  }, 0);

  const hasStockError = lines.some((line) => {
    const product = products.find((p) => p.id === line.productId);
    return product ? (Number(line.quantity) || 0) > product.stock : false;
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="customerId" value={customerId} />

      <Card className="space-y-3">
        <p className="text-sm font-medium">{dict.orders.customer}</p>
        {customers.length > 0 && (
          <Select
            value={customerId}
            onChange={(e) => handleCustomerSelect(e.target.value)}
          >
            <option value="">{dict.orders.newCustomer}</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
                {customer.phone ? ` (${customer.phone})` : ""}
              </option>
            ))}
          </Select>
        )}
        <div>
          <Label htmlFor="customerName">{dict.customers.name}</Label>
          <Input
            id="customerName"
            name="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="customerPhone">{dict.customers.phone}</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">{dict.customers.address}</Label>
            <Input
              id="address"
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium">{dict.orders.items}</p>
        {lines.map((line) => {
          const product = products.find((p) => p.id === line.productId);
          const quantity = Number(line.quantity) || 0;
          const exceedsStock = Boolean(product) && quantity > (product?.stock ?? 0);
          return (
            <div key={line.key} className="space-y-1">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Select
                    name="productId"
                    value={line.productId}
                    onChange={(e) =>
                      updateLine(line.key, { productId: Number(e.target.value) })
                    }
                  >
                    <option value={0}>{dict.orders.selectProduct}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.variant ? ` — ${p.variant}` : ""} · {formatMoney(p.price)}
                        {p.stock <= 0
                          ? ` (${dict.orders.outOfStock})`
                          : ` (${p.stock} ${dict.orders.left})`}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-20">
                  <Input
                    name="quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    aria-invalid={exceedsStock}
                    className={exceedsStock ? "border-red-600 focus:border-red-600" : ""}
                    value={line.quantity}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                      updateLine(line.key, { quantity: digitsOnly });
                    }}
                    onBlur={(e) => normalizeQuantity(line.key, e.target.value)}
                  />
                </div>
                {lines.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeLine(line.key)}
                  >
                    ✕
                  </Button>
                )}
              </div>
              {exceedsStock && product && (
                <p className="text-xs text-red-600">
                  {dict.orders.errorNotEnoughStock} — {product.stock} {dict.orders.left}
                </p>
              )}
            </div>
          );
        })}
        <Button type="button" variant="secondary" onClick={addLine}>
          {dict.orders.addProductRow}
        </Button>
        <p className="text-right text-sm text-muted">
          {dict.orders.itemsSubtotal}: {formatMoney(itemsSubtotal)}
        </p>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium">{dict.orders.paymentDelivery}</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="paymentMethod">{dict.orders.paymentMethod}</Label>
            <Select id="paymentMethod" name="paymentMethod" defaultValue="cash">
              <option value="cash">{dict.orders.cash}</option>
              <option value="transfer">{dict.orders.transfer}</option>
              <option value="other">{dict.orders.other}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="handledBy">{dict.orders.handledBy}</Label>
            <Input
              id="handledBy"
              name="handledBy"
              placeholder={dict.orders.handledByPlaceholder}
            />
          </div>
          <div>
            <Label htmlFor="deliveryFee">{dict.orders.deliveryFee}</Label>
            <Input id="deliveryFee" name="deliveryFee" type="number" min={0} defaultValue={0} />
          </div>
          <div>
            <Label htmlFor="discount">{dict.orders.discount}</Label>
            <Input id="discount" name="discount" type="number" min={0} defaultValue={0} />
          </div>
        </div>
        <div>
          <Label htmlFor="note">{dict.orders.note}</Label>
          <Textarea id="note" name="note" rows={2} />
        </div>
      </Card>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending || hasStockError} className="w-full">
        {pending ? dict.orders.saving : dict.orders.completeSale}
      </Button>
    </form>
  );
}
