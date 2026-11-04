"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Pack, ProductLine, Size } from "@/lib/catalog";

type StoredLine = { packId: number; option: string | null; quantity: number };

export type CartLine = StoredLine & {
  key: string;
  line: ProductLine;
  size: Size;
  pack: Pack;
  subtotal: number;
  /** Most of this line the shelf can still cover, given the rest of the cart. */
  maxQuantity: number;
};

// Kept in localStorage so a half-built order survives switching to Viber to copy an
// address — phone browsers often reload the tab when you come back.
const STORAGE_KEY = "diva-cart";
const EMPTY: StoredLine[] = [];

let cache: StoredLine[] | undefined;
const listeners = new Set<() => void>();

function read(): StoredLine[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as StoredLine[];
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: StoredLine[]) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode: the cart just won't survive a reload.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const sameLine = (a: StoredLine, packId: number, option: string | null) =>
  a.packId === packId && a.option === option;

export function useCart(productLines: ProductLine[]) {
  const stored = useSyncExternalStore(subscribe, read, () => EMPTY);

  const packIndex = useMemo(() => {
    const index = new Map<number, { line: ProductLine; size: Size; pack: Pack }>();
    for (const line of productLines) {
      for (const size of line.sizes) {
        for (const pack of size.packs) index.set(pack.id, { line, size, pack });
      }
    }
    return index;
  }, [productLines]);

  // Lines whose pack has since been removed from the catalog just drop out.
  const lines = useMemo<CartLine[]>(() => {
    const live = stored.filter((item) => packIndex.has(item.packId));

    const unitsBySize = new Map<number, number>();
    for (const item of live) {
      const { size, pack } = packIndex.get(item.packId)!;
      unitsBySize.set(size.id, (unitsBySize.get(size.id) ?? 0) + item.quantity * pack.unitsPerPack);
    }

    return live.map((item) => {
      const { line, size, pack } = packIndex.get(item.packId)!;
      const otherUnits = unitsBySize.get(size.id)! - item.quantity * pack.unitsPerPack;
      return {
        ...item,
        key: `${item.packId}:${item.option ?? ""}`,
        line,
        size,
        pack,
        subtotal: pack.price * item.quantity,
        maxQuantity: Math.floor((size.stock - otherUnits) / pack.unitsPerPack),
      };
    });
  }, [stored, packIndex]);

  const unitsInCart = useCallback(
    (sizeId: number) =>
      lines
        .filter((item) => item.size.id === sizeId)
        .reduce((sum, item) => sum + item.quantity * item.pack.unitsPerPack, 0),
    [lines]
  );

  const quantityInCart = useCallback(
    (sizeId: number) =>
      lines
        .filter((item) => item.size.id === sizeId)
        .reduce((sum, item) => sum + item.quantity, 0),
    [lines]
  );

  const add = useCallback(
    (packId: number, option: string | null, quantity: number) => {
      const entry = packIndex.get(packId);
      if (!entry) return;

      const current = read();
      const existing = current.find((item) => sameLine(item, packId, option));
      const free = entry.size.stock - unitsInCart(entry.size.id);
      const added = Math.min(quantity, Math.floor(free / entry.pack.unitsPerPack));
      if (added <= 0) return;

      write(
        existing
          ? current.map((item) =>
              item === existing ? { ...item, quantity: item.quantity + added } : item
            )
          : [...current, { packId, option, quantity: added }]
      );
    },
    [packIndex, unitsInCart]
  );

  const setQuantity = useCallback((target: CartLine, quantity: number) => {
    write(
      read().map((item) =>
        sameLine(item, target.packId, target.option) ? { ...item, quantity } : item
      )
    );
  }, []);

  const remove = useCallback((target: CartLine) => {
    write(read().filter((item) => !sameLine(item, target.packId, target.option)));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  return {
    lines,
    subtotal: lines.reduce((sum, item) => sum + item.subtotal, 0),
    count: lines.reduce((sum, item) => sum + item.quantity, 0),
    unitsInCart,
    quantityInCart,
    add,
    setQuantity,
    remove,
    clear,
  };
}
