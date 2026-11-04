"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import type { ProductLine } from "@/lib/catalog";
import type { Dictionary } from "@/lib/i18n";
import { BoxIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Label, NumberInput } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
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
  const [amounts, setAmounts] = useState<Record<number, number | null>>({});
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const sizes = line.sizes.filter((size) => size.isActive);
  const entered = sizes.filter((size) => (amounts[size.id] ?? null) !== null);

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
      <p className="text-sm text-muted">
        {
          {
            receive: dict.stock.hintReceive,
            remove: dict.stock.hintRemove,
            count: dict.stock.hintCount,
          }[mode]
        }
      </p>

      <ul className="divide-y divide-border">
        {sizes.map((size) => {
          const amount = amounts[size.id] ?? null;
          const result = amount === null ? null : resultFor(size.stock, amount);
          return (
            <li key={size.id} className="flex items-center justify-between gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{size.name}</p>
                <p className="money text-xs text-muted">
                  {formatMoney(size.stock)}
                  {result !== null && (
                    <span className={result < 0 ? "text-bad" : "text-foreground"}>
                      {" → "}
                      {formatMoney(result)}
                    </span>
                  )}{" "}
                  {line.stockUnit}
                </p>
              </div>
              <div className="w-28 shrink-0">
                <NumberInput
                  aria-label={size.name}
                  className="text-right"
                  value={amount}
                  onValueChange={(value) => setAmounts((prev) => ({ ...prev, [size.id]: value }))}
                />
              </div>
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

      {error && <p className="text-sm font-medium text-bad">{error}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={pending || entered.length === 0}
        onClick={() =>
          startTransition(async () => {
            const result = await adjustStock({
              mode,
              note,
              lines: entered.map((size) => ({
                productId: size.id,
                amount: amounts[size.id] ?? 0,
              })),
            });
            if (result.error) setError(result.error);
            else onDone();
          })
        }
      >
        {pending ? dict.orders.saving : dict.common.save}
      </Button>
    </div>
  );
}
