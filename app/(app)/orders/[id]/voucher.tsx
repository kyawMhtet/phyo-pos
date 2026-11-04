import type { orderItems, orders } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import type { Dictionary } from "@/lib/i18n";

// Print-only, laid out like the shop's paper voucher book.
export function Voucher({
  order,
  items,
  dict,
}: {
  order: typeof orders.$inferSelect;
  items: (typeof orderItems.$inferSelect)[];
  dict: Dictionary;
}) {
  return (
    <div className="hidden text-sm text-black print:block">
      <div className="flex items-end justify-between gap-4 border-b-2 border-black pb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-full.png" alt={dict.common.appName} className="h-16 w-auto" />
        <div className="text-right">
          <p className="text-base font-bold">
            {dict.orders.voucher} #{order.id}
          </p>
          <p>{formatDateTime(order.createdAt)}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-[5rem_1fr] gap-y-1">
        <dt className="text-gray-600">{dict.customers.name}</dt>
        <dd className="font-semibold">{order.customerName}</dd>
        <dt className="text-gray-600">{dict.customers.phone}</dt>
        <dd>{order.customerPhone ?? "—"}</dd>
        <dt className="text-gray-600">{dict.customers.address}</dt>
        <dd className="whitespace-pre-line">{order.address ?? "—"}</dd>
      </dl>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="w-7 py-1.5 font-semibold">{dict.orders.no}</th>
            <th className="py-1.5 font-semibold">{dict.orders.description}</th>
            <th className="py-1.5 text-right font-semibold">{dict.orders.qty}</th>
            <th className="py-1.5 text-right font-semibold">{dict.orders.price}</th>
            <th className="py-1.5 text-right font-semibold">{dict.orders.amount}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id} className="border-b border-gray-300 align-top">
              <td className="py-1.5">{index + 1}</td>
              <td className="py-1.5">
                {item.productName}
                {(item.packLabel || item.optionLabel) && (
                  <span className="block text-xs text-gray-600">
                    {[item.packLabel, item.optionLabel].filter(Boolean).join(" · ")}
                  </span>
                )}
              </td>
              <td className="money py-1.5 text-right">{item.quantity}</td>
              <td className="money py-1.5 text-right">{formatMoney(item.unitPrice)}</td>
              <td className="money py-1.5 text-right">{formatMoney(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex items-start justify-between gap-6">
        <p className="min-w-0 flex-1 text-gray-700">
          {order.note && (
            <>
              {dict.orders.remark}: {order.note}
            </>
          )}
        </p>
        <dl className="money w-48 space-y-0.5">
          <VoucherRow label={dict.orders.subtotal} value={order.itemsSubtotal} />
          {order.discount > 0 && <VoucherRow label={dict.orders.discount} value={-order.discount} />}
          <VoucherRow label={dict.orders.deliveryFee} value={order.deliveryFee} />
          <div className="flex justify-between border-t-2 border-black pt-1 font-bold">
            <dt>{dict.orders.total}</dt>
            <dd>{formatMoney(order.total)}</dd>
          </div>
          <VoucherRow label={dict.orders.advance} value={order.paidAmount} />
          <div className="flex justify-between font-bold">
            <dt>{dict.orders.balance}</dt>
            <dd>
              {formatMoney(order.total - order.paidAmount)} {dict.common.currency}
            </dd>
          </div>
        </dl>
      </div>

      <p className="mt-8 text-center text-xs text-gray-600">{dict.orders.thankYou}</p>
    </div>
  );
}

function VoucherRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt>{label}</dt>
      <dd>{formatMoney(value)}</dd>
    </div>
  );
}
