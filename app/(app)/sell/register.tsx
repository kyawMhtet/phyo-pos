"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { stockAsPacks, stockLevel, type ProductLine, type Size } from "@/lib/catalog";
import { fill } from "@/lib/text";
import type { Dictionary } from "@/lib/i18n";
import { BoxIcon, ChevronIcon, SearchIcon, TagIcon, TrashIcon } from "@/components/icons";
import { Button, buttonClass } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Empty } from "@/components/ui/page";
import { Sheet } from "@/components/ui/sheet";
import { Stepper } from "@/components/ui/stepper";
import { CheckoutForm, type CustomerOption } from "./checkout-form";
import { ItemPicker } from "./item-picker";
import { useCart, type CartLine } from "./use-cart";

const squash = (value: string) => value.toLowerCase().replace(/\s+/g, "");

export function Register({
  lines,
  customers,
  dict,
  help,
}: {
  lines: ProductLine[];
  customers: CustomerOption[];
  dict: Dictionary;
  help: React.ReactNode;
}) {
  const cart = useCart(lines);
  const [activeLineId, setActiveLineId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [picking, setPicking] = useState<{ line: ProductLine; size: Size } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const visibleLines = useMemo(() => {
    // "25x35" has to find "25 x 35 cm", so compare with spaces removed.
    const query = squash(search);
    return lines
      .filter((line) => query || activeLineId === null || line.id === activeLineId)
      .map((line) => ({
        ...line,
        sizes: query
          ? line.sizes.filter((size) =>
              squash(`${line.name} ${size.name} ${size.note ?? ""}`).includes(query)
            )
          : line.sizes,
      }))
      .filter((line) => line.sizes.length > 0);
  }, [lines, activeLineId, search]);

  function handleTile(line: ProductLine, size: Size) {
    if (size.packs.length === 1 && line.options.length === 0) {
      cart.add(size.packs[0].id, null, 1);
    } else {
      setPicking({ line, size });
    }
  }

  function startCheckout() {
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-16">
        <Empty
          icon={<BoxIcon />}
          title={dict.sell.noProducts}
          hint={dict.sell.noProductsHint}
          action={
            <Link href="/products/new" className={buttonClass()}>
              {dict.products.addProduct}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 lg:h-dvh lg:flex-none lg:overflow-hidden">
      <section className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
        <div className="sticky top-0 z-10 space-y-2.5 border-b border-border bg-background/95 px-4 pt-3 pb-2.5 backdrop-blur lg:px-6 lg:pt-5">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dict.sell.search}
                className="pl-10"
              />
            </div>
            {help}
          </div>
          <div className="scroll-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
            <LineChip
              label={dict.sell.all}
              active={activeLineId === null}
              onClick={() => setActiveLineId(null)}
            />
            {lines.map((line) => (
              <LineChip
                key={line.id}
                label={line.name}
                active={activeLineId === line.id}
                onClick={() => setActiveLineId(line.id)}
              />
            ))}
          </div>
        </div>

        <div className={`flex-1 space-y-6 px-4 pt-4 lg:px-6 lg:pb-8 ${cart.count > 0 ? "pb-40" : "pb-28"}`}>
          {visibleLines.length === 0 && (
            <Empty icon={<SearchIcon />} title={`${dict.common.noResults} "${search}"`} />
          )}
          {visibleLines.map((line) => (
            <div key={line.id} className="space-y-2.5">
              <h2 className="font-display text-sm font-semibold text-muted">{line.name}</h2>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                {line.sizes.map((size) => (
                  <Tile
                    key={size.id}
                    line={line}
                    size={size}
                    unitsInCart={cart.unitsInCart(size.id)}
                    quantityInCart={cart.quantityInCart(size.id)}
                    dict={dict}
                    onClick={() => handleTile(line, size)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tablet/desktop: the cart is always on screen. */}
      <aside className="hidden w-[23rem] shrink-0 flex-col border-l border-border bg-surface lg:flex">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display text-lg font-semibold">{dict.sell.cart}</h2>
          {cart.count > 0 && (
            <Button variant="ghost" size="sm" onClick={cart.clear}>
              {dict.sell.clear}
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <CartLines cart={cart} dict={dict} />
        </div>
        <CartFooter cart={cart} dict={dict} onCheckout={startCheckout} />
      </aside>

      {/* Phone: a bar above the nav opens the cart. */}
      {cart.count > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-10 flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-2xl bg-ink px-4 text-ink-foreground shadow-lg transition-transform active:scale-[0.99] lg:hidden dark:bg-accent dark:text-accent-foreground"
        >
          <span className="flex items-center gap-2.5 font-semibold">
            <span key={cart.count} className="pop money flex h-7 min-w-7 items-center justify-center rounded-full bg-gold px-1.5 text-sm text-ink">
              {cart.count}
            </span>
            {dict.sell.viewCart}
          </span>
          <span className="money flex items-center gap-1 font-display text-lg font-semibold">
            {formatMoney(cart.subtotal)}
            <ChevronIcon className="h-4 w-4" />
          </span>
        </button>
      )}

      <Sheet
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title={dict.sell.cart}
        closeLabel={dict.common.close}
        footer={<CartFooter cart={cart} dict={dict} onCheckout={startCheckout} bare />}
      >
        <CartLines cart={cart} dict={dict} />
        {cart.count > 0 && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={cart.clear}>
            {dict.sell.clear}
          </Button>
        )}
      </Sheet>

      <Sheet
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={picking ? `${picking.line.name} · ${picking.size.name}` : ""}
        closeLabel={dict.common.close}
      >
        {picking && (
          <ItemPicker
            line={picking.line}
            size={picking.size}
            freeUnits={picking.size.stock - cart.unitsInCart(picking.size.id)}
            dict={dict}
            onAdd={(packId, option, quantity) => {
              cart.add(packId, option, quantity);
              setPicking(null);
            }}
          />
        )}
      </Sheet>

      <Sheet
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        title={dict.checkout.title}
        closeLabel={dict.common.close}
        dismissable={false}
      >
        <CheckoutForm cart={cart} customers={customers} dict={dict} />
      </Sheet>
    </div>
  );
}

function LineChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border bg-surface text-foreground hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}

function Tile({
  line,
  size,
  unitsInCart,
  quantityInCart,
  dict,
  onClick,
}: {
  line: ProductLine;
  size: Size;
  unitsInCart: number;
  quantityInCart: number;
  dict: Dictionary;
  onClick: () => void;
}) {
  const free = size.stock - unitsInCart;
  const level = stockLevel(size.stock, line.lowStockAt);
  const soldOut = !size.packs.some((pack) => pack.unitsPerPack <= free);

  function stockText() {
    const stock = formatMoney(free);
    const unit = line.stockUnit;
    if (level === "out") return dict.sell.outOfStock;
    if (soldOut && unitsInCart > 0) return dict.sell.allInCart;
    if (soldOut) return fill(dict.sell.notEnoughForPack, { stock, unit });
    return fill(dict.sell.stockLeft, { stock: stockAsPacks(free, size.packs, unit) });
  }

  return (
    <button
      type="button"
      disabled={soldOut && unitsInCart === 0}
      onClick={onClick}
      className={`tag-hole relative flex min-h-32 cursor-pointer flex-col rounded-2xl border bg-surface p-3 text-left transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-55 disabled:active:scale-100 ${
        unitsInCart > 0
          ? "border-accent ring-1 ring-accent"
          : "border-border hover:border-accent/60 hover:shadow-sm"
      }`}
    >
      <span className="pr-4 font-display text-base font-semibold tracking-tight">{size.name}</span>
      {size.note && <span className="text-xs text-muted">{size.note}</span>}

      <span className="mt-auto space-y-0.5 pt-2">
        {size.packs.map((pack) => (
          <span key={pack.id} className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate text-xs text-muted">{pack.label}</span>
            <span className="money font-semibold">{formatMoney(pack.price)}</span>
          </span>
        ))}
      </span>

      <span
        className={`money mt-1.5 border-t border-dashed border-border pt-1 text-xs font-medium ${
          level === "out" || soldOut ? "text-bad" : level === "low" ? "text-warn" : "text-muted"
        }`}
      >
        {stockText()}
      </span>

      {unitsInCart > 0 && (
        <span
          key={quantityInCart}
          className="pop money absolute -top-1.5 -left-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground shadow"
        >
          {quantityInCart}
        </span>
      )}
    </button>
  );
}

type Cart = ReturnType<typeof useCart>;

function CartLines({ cart, dict }: { cart: Cart; dict: Dictionary }) {
  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-muted">
        <TagIcon className="h-8 w-8" />
        <p className="text-sm">{dict.sell.cartEmpty}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {cart.lines.map((item) => (
        <CartRow key={item.key} item={item} cart={cart} dict={dict} />
      ))}
    </ul>
  );
}

function CartRow({ item, cart, dict }: { item: CartLine; cart: Cart; dict: Dictionary }) {
  return (
    <li className="space-y-2 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{item.line.name}</p>
          <p className="font-semibold">{item.size.name}</p>
          <p className="text-xs text-muted">
            {item.pack.label}
            {item.option ? ` · ${item.option}` : ""}
          </p>
        </div>
        <button
          type="button"
          aria-label={dict.common.remove}
          onClick={() => cart.remove(item)}
          className="-mt-1 -mr-1.5 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-bad"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Stepper
          value={item.quantity}
          max={item.maxQuantity}
          onChange={(quantity) => cart.setQuantity(item, quantity)}
          label={dict.sell.quantity}
          decreaseLabel={dict.sell.decrease}
          increaseLabel={dict.sell.increase}
        />
        <span className="money font-semibold">{formatMoney(item.subtotal)}</span>
      </div>
      {item.quantity >= item.maxQuantity && (
        <p className="text-[13px] text-warn">{fill(dict.sell.atMax, { n: item.maxQuantity })}</p>
      )}
    </li>
  );
}

function CartFooter({
  cart,
  dict,
  onCheckout,
  bare = false,
}: {
  cart: Cart;
  dict: Dictionary;
  onCheckout: () => void;
  bare?: boolean;
}) {
  return (
    <div className={`space-y-3 ${bare ? "" : "border-t border-border p-5"}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted">{dict.orders.subtotal}</span>
        <span className="money font-display text-2xl font-semibold tracking-tight">
          {formatMoney(cart.subtotal)}
          <span className="ml-1 text-sm font-medium text-muted">{dict.common.currency}</span>
        </span>
      </div>
      <Button size="lg" className="w-full" disabled={cart.count === 0} onClick={onCheckout}>
        {dict.sell.checkout}
      </Button>
    </div>
  );
}
