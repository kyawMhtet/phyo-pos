"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { packsFrom, type ProductLine, type Size } from "@/lib/catalog";
import { fill } from "@/lib/text";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Chips } from "@/components/ui/segmented";
import { Stepper } from "@/components/ui/stepper";

export function ItemPicker({
  line,
  size,
  freeUnits,
  dict,
  onAdd,
}: {
  line: ProductLine;
  size: Size;
  freeUnits: number;
  dict: Dictionary;
  onAdd: (packId: number, option: string | null, quantity: number) => void;
}) {
  const firstAvailable = size.packs.find((pack) => pack.unitsPerPack <= freeUnits);
  const [packId, setPackId] = useState((firstAvailable ?? size.packs[0]).id);
  const [option, setOption] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const pack = size.packs.find((p) => p.id === packId)!;
  const maxQuantity = Math.floor(freeUnits / pack.unitsPerPack);
  const needsOption = line.options.length > 0 && option === null;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {size.packs.map((p) => {
          const available = p.unitsPerPack <= freeUnits;
          const selected = p.id === packId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!available}
              onClick={() => {
                setPackId(p.id);
                setQuantity(1);
              }}
              className={`flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected ? "border-accent bg-accent/8 ring-1 ring-accent" : "border-border hover:border-accent/60"
              }`}
            >
              <span className="min-w-0">
                <span className="block font-medium">{p.label}</span>
                {p.unitsPerPack > 1 && (
                  <span className="money block text-[13px] text-muted">
                    {fill(dict.sell.available, { n: packsFrom(freeUnits, p.unitsPerPack) })}
                  </span>
                )}
              </span>
              <span className="money shrink-0 font-display text-lg font-semibold">
                {available ? formatMoney(p.price) : dict.sell.notEnough}
              </span>
            </button>
          );
        })}
      </div>

      {line.options.length > 0 && (
        <div>
          <Label>{dict.sell.pickOption}</Label>
          <Chips
            value={option}
            onChange={setOption}
            options={line.options.map((value) => ({ value, label: value }))}
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted">{dict.sell.quantity}</p>
          <p className="money text-[13px] text-muted">
            {pack.unitsPerPack > 1
              ? fill(dict.sell.maxExplain, {
                  n: maxQuantity,
                  stock: formatMoney(freeUnits),
                  unit: line.stockUnit,
                  units: pack.unitsPerPack,
                })
              : fill(dict.sell.unitsLeft, { stock: formatMoney(freeUnits), unit: line.stockUnit })}
          </p>
        </div>
        <Stepper
          large
          value={Math.min(quantity, Math.max(maxQuantity, 1))}
          max={Math.max(maxQuantity, 1)}
          onChange={setQuantity}
          label={dict.sell.quantity}
          decreaseLabel={dict.sell.decrease}
          increaseLabel={dict.sell.increase}
        />
      </div>

      <Button
        size="lg"
        className="w-full justify-between"
        disabled={maxQuantity < 1 || needsOption}
        onClick={() => onAdd(pack.id, option, Math.min(quantity, maxQuantity))}
      >
        <span>{needsOption ? dict.sell.pickOption : dict.sell.addToCart}</span>
        <span className="money">{formatMoney(pack.price * Math.min(quantity, Math.max(maxQuantity, 1)))}</span>
      </Button>
    </div>
  );
}
