"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { stockAsPacks, stockPackSize, type ProductLine } from "@/lib/catalog";
import { fill } from "@/lib/text";
import type { Dictionary } from "@/lib/i18n";
import { BoxIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, NumberInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { useSubmit } from "@/components/ui/use-submit";
import { adjustStock, type AdjustStockInput } from "../actions";

export function StockButton({ line, dict }: { line: ProductLine; dict: Dictionary }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <BoxIcon className="h-4 w-4" />
        {dict.stock.update}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={`${dict.stock.update} · ${line.name}`}
        closeLabel={dict.common.close}
        dismissable={false}
      >
        <StockForm line={line} dict={dict} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function StockForm({
  line,
  dict,
  onDone,
}: {
  line: ProductLine;
  dict: Dictionary;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<AdjustStockInput["mode"]>("receive");
  const [entry, setEntry] = useState<"packs" | "units">("packs");
  const [amounts, setAmounts] = useState<Record<number, number | null>>({});
  const [note, setNote] = useState("");
  const { pending, fieldErrors, submit, clearError } = useSubmit(dict.common.errorGeneric);

  const sizes = line.sizes.filter((size) => size.isActive);
  const entered = sizes.filter((size) => (amounts[size.id] ?? null) !== null);
  const hasPacks = sizes.some((size) => stockPackSize(size) > 1);
  const inPacks = hasPacks && entry === "packs";

  // What's typed for a size, in stock units.
  function unitsFor(size: ProductLine["sizes"][number], amount: number) {
    return inPacks ? amount * stockPackSize(size) : amount;
  }

  const packGuide = [
    ...new Set(
      sizes.flatMap((size) =>
        size.packs
          .filter((pack) => pack.unitsPerPack > 1)
          .map((pack) =>
            fill(dict.stock.packTakes, {
              label: pack.label,
              units: formatMoney(pack.unitsPerPack),
              unit: line.stockUnit,
            })
          )
      )
    ),
  ];

  function resultFor(stock: number, amount: number) {
    if (mode === "receive") return stock + amount;
    if (mode === "remove") return stock - amount;
    return amount;
  }

  return (
    <div className="space-y-4">
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: "receive", label: dict.stock.modeReceive },
          { value: "remove", label: dict.stock.modeRemove },
          { value: "count", label: dict.stock.modeCount },
        ]}
      />
      {hasPacks && (
        <div>
          <Label>{dict.stock.enterIn}</Label>
          <Segmented
            value={entry}
            onChange={setEntry}
            options={[
              { value: "packs", label: dict.stock.packs },
              { value: "units", label: line.stockUnit },
            ]}
          />
        </div>
      )}
      <div className="text-sm text-muted">
        <p>
          {fill(
            {
              receive: dict.stock.hintReceive,
              remove: dict.stock.hintRemove,
              count: dict.stock.hintCount,
            }[mode],
            { unit: inPacks ? dict.stock.packs : line.stockUnit }
          )}
        </p>
        {inPacks ? (
          <p className="mt-1 rounded-lg bg-sunken px-3 py-2 font-medium text-foreground">
            {fill(dict.stock.packsHint, { unit: line.stockUnit })}
          </p>
        ) : (
          packGuide.length > 0 && (
            <p className="mt-1 rounded-lg bg-sunken px-3 py-2 font-medium text-foreground">
              {fill(dict.stock.unitWarning, { unit: line.stockUnit })}{" "}
              <span className="font-normal text-muted">{packGuide.join(" · ")}</span>
            </p>
          )
        )}
      </div>

      <ul className="divide-y divide-border">
        {sizes.map((size) => {
          const amount = amounts[size.id] ?? null;
          const units = amount === null ? null : unitsFor(size, amount);
          const result = units === null ? null : resultFor(size.stock, units);
          const packSize = stockPackSize(size);
          return (
            <li key={size.id} className="py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{size.name}</p>
                  <p className="money text-xs text-muted">
                    {stockAsPacks(size.stock, size.packs, line.stockUnit)}
                    {result !== null && (
                      <span className={result < 0 ? "text-bad" : "text-foreground"}>
                        {" → "}
                        {result < 0
                          ? `${formatMoney(result)} ${line.stockUnit}`
                          : stockAsPacks(result, size.packs, line.stockUnit)}
                      </span>
                    )}
                  </p>
                  {inPacks && packSize > 1 && (
                    <p className="money text-xs text-muted">
                      {fill(dict.stock.packSizeNote, {
                        size: formatMoney(packSize),
                        unit: line.stockUnit,
                      })}
                    </p>
                  )}
                </div>
                <div className="w-28 shrink-0">
                  <NumberInput
                    id={`stock-${size.id}`}
                    aria-label={size.name}
                    aria-invalid={fieldErrors[`stock-${size.id}`] ? true : undefined}
                    className="text-right"
                    value={amount}
                    onValueChange={(value) => {
                      setAmounts((prev) => ({ ...prev, [size.id]: value }));
                      clearError(`stock-${size.id}`);
                    }}
                  />
                </div>
              </div>
              <FieldError message={fieldErrors[`stock-${size.id}`]} />
            </li>
          );
        })}
      </ul>

      <div>
        <Label htmlFor="stockNote">
          {dict.stock.note} ({dict.common.optional})
        </Label>
        <Input
          id="stockNote"
          value={note}
          placeholder={dict.stock.notePlaceholder}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={pending}
        onClick={() =>
          submit(
            () =>
              adjustStock({
                mode,
                note,
                lines: entered.map((size) => ({
                  productId: size.id,
                  amount: unitsFor(size, amounts[size.id] ?? 0),
                })),
              }),
            onDone
          )
        }
      >
        {pending ? dict.orders.saving : dict.common.save}
      </Button>
    </div>
  );
}
