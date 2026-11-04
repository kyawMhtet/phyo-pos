"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { hasErrors, type FieldErrors } from "@/lib/form";
import { formatMoney } from "@/lib/money";
import { packsFrom, type ProductLine } from "@/lib/catalog";
import { fill } from "@/lib/text";
import type { Dictionary } from "@/lib/i18n";
import { CloseIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Hint, Input, Label, NumberInput } from "@/components/ui/input";
import { SectionTitle } from "@/components/ui/page";
import { useSubmit } from "@/components/ui/use-submit";
import { saveProductLine } from "./actions";

type PackColumn = { key: string; label: string; units: number | null };
type Cell = { id?: number; price: number | null; cost: number | null };
type SizeRow = {
  key: string;
  id?: number;
  name: string;
  note: string;
  isActive: boolean;
  stock: number | null;
  cells: Record<string, Cell>;
};

const UNIT_SUGGESTIONS = ["pcs", "kg", "yard", "pack"];

// A size's packs are entered as a grid like the printed price lists: one column per
// pack, one row per size, an empty price meaning that size isn't sold in that pack.
function initialState(line?: ProductLine) {
  if (!line) {
    return {
      columns: [{ key: "pack-0", label: "", units: null }] as PackColumn[],
      rows: [] as SizeRow[],
    };
  }

  const columns: PackColumn[] = [];
  const columnKey = (label: string, units: number) => `${label}|${units}`;
  for (const size of line.sizes) {
    for (const pack of size.packs) {
      const key = columnKey(pack.label, pack.unitsPerPack);
      if (!columns.some((column) => column.key === key)) {
        columns.push({ key, label: pack.label, units: pack.unitsPerPack });
      }
    }
  }

  const rows: SizeRow[] = line.sizes.map((size) => ({
    key: `size-${size.id}`,
    id: size.id,
    name: size.name,
    note: size.note ?? "",
    isActive: size.isActive,
    stock: size.stock,
    cells: Object.fromEntries(
      size.packs.map((pack) => [
        columnKey(pack.label, pack.unitsPerPack),
        { id: pack.id, price: pack.price, cost: pack.costPrice || null },
      ])
    ),
  }));

  return { columns, rows };
}

export function ProductEditor({ line, dict }: { line?: ProductLine; dict: Dictionary }) {
  const router = useRouter();
  const [initial] = useState(() => initialState(line));
  const nextKey = useRef(1);
  const newKey = (prefix: string) => `${prefix}-new-${nextKey.current++}`;
  const t = dict.products;

  const [name, setName] = useState(line?.name ?? "");
  const [stockUnit, setStockUnit] = useState(line?.stockUnit ?? "pcs");
  const [options, setOptions] = useState(line?.options.join(", ") ?? "");
  const [lowStockAt, setLowStockAt] = useState<number | null>(line?.lowStockAt || null);
  const [columns, setColumns] = useState(initial.columns);
  const [rows, setRows] = useState<SizeRow[]>(() =>
    initial.rows.length > 0 ? initial.rows : [blankRow("size-new-0")]
  );
  const { pending, fieldErrors, submit, clearError, showFieldErrors } = useSubmit(
    dict.common.errorGeneric
  );

  function blankRow(key: string): SizeRow {
    return { key, name: "", note: "", isActive: true, stock: null, cells: {} };
  }

  function updateColumn(key: string, patch: Partial<PackColumn>) {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  function updateRow(key: string, patch: Partial<SizeRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function updateCell(rowKey: string, columnKey: string, patch: Partial<Cell>) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.key !== rowKey) return row;
        const cell = row.cells[columnKey] ?? { price: null, cost: null };
        return { ...row, cells: { ...row.cells, [columnKey]: { ...cell, ...patch } } };
      })
    );
  }

  // "= 3 × 100 pcs": what the stock in this row adds up to in packs.
  function coverage(row: SizeRow) {
    return columns
      .filter(
        (column) => (column.units ?? 0) > 1 && column.label.trim() && row.cells[column.key]?.price
      )
      .map((column) => `${packsFrom(row.stock ?? 0, column.units ?? 1)} × ${column.label.trim()}`)
      .join(" · ");
  }

  // The grid's row and column keys only exist here, so it's checked before sending.
  function validate(filledRows: SizeRow[]): FieldErrors {
    const required = dict.common.required;
    const errors: FieldErrors = {};

    if (!name.trim()) errors.name = required;
    if (!stockUnit.trim()) errors.stockUnit = required;

    for (const column of columns) {
      if (!column.label.trim()) errors[`label-${column.key}`] = required;
      if (!column.units) errors[`units-${column.key}`] = required;
    }

    if (filledRows.length === 0) errors[`size-${rows[0].key}`] = required;

    const seen = new Set<string>();
    for (const row of filledRows) {
      const size = row.name.trim().toLowerCase();
      if (!size) errors[`size-${row.key}`] = required;
      else if (seen.has(size)) errors[`size-${row.key}`] = t.errorDuplicateSize;
      seen.add(size);
    }

    return errors;
  }

  function save() {
    const filledRows = rows.filter(
      (row) => row.id || row.name.trim() || Object.values(row.cells).some((c) => c.price !== null)
    );

    const errors = validate(filledRows);
    if (hasErrors(errors)) {
      showFieldErrors(errors);
      return;
    }

    submit(
      () =>
        saveProductLine({
          id: line?.id,
          name,
          stockUnit,
          options: options
            .split(",")
            .map((option) => option.trim())
            .filter(Boolean),
          lowStockAt: lowStockAt ?? 0,
          sizes: filledRows.map((row) => ({
            id: row.id,
            name: row.name,
            note: row.note,
            isActive: row.isActive,
            openingStock: row.id ? 0 : (row.stock ?? 0),
            packs: columns.flatMap((column) => {
              const cell = row.cells[column.key];
              if (!cell || cell.price === null) return [];
              return [
                {
                  id: cell.id,
                  label: column.label,
                  unitsPerPack: column.units ?? 1,
                  price: cell.price,
                  costPrice: cell.cost ?? 0,
                },
              ];
            }),
          })),
        }),
      (result) => router.push(`/products/${result.lineId}`)
    );
  }

  return (
    <div className="space-y-5">
      <Card className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">{t.name}</Label>
          <Input
            id="name"
            value={name}
            placeholder={t.namePlaceholder}
            error={fieldErrors.name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name");
            }}
          />
          <Hint>{t.nameHint}</Hint>
        </div>
        <div>
          <Label htmlFor="options">
            {t.options} ({dict.common.optional})
          </Label>
          <Input
            id="options"
            value={options}
            placeholder={t.optionsPlaceholder}
            onChange={(e) => setOptions(e.target.value)}
          />
          <Hint>{t.optionsHint}</Hint>
        </div>
        <div>
          <Label htmlFor="stockUnit">{t.stockUnit}</Label>
          <Input
            id="stockUnit"
            list="unit-suggestions"
            value={stockUnit}
            error={fieldErrors.stockUnit}
            onChange={(e) => {
              setStockUnit(e.target.value);
              clearError("stockUnit");
            }}
          />
          <datalist id="unit-suggestions">
            {UNIT_SUGGESTIONS.map((unit) => (
              <option key={unit} value={unit} />
            ))}
          </datalist>
          <Hint>{t.stockUnitHint}</Hint>
        </div>
        <div>
          <Label htmlFor="lowStockAt">
            {t.lowStockAt} ({stockUnit})
          </Label>
          <NumberInput
            id="lowStockAt"
            value={lowStockAt}
            onValueChange={setLowStockAt}
            placeholder="0"
          />
          <Hint>{t.lowStockHint}</Hint>
        </div>
      </Card>

      <section className="space-y-3">
        <div>
          <SectionTitle>{t.packsTitle}</SectionTitle>
          <p className="text-sm text-muted">{t.packsHint}</p>
          <ul className="mt-2 space-y-0.5 rounded-xl bg-sunken px-3 py-2 text-[13px] text-muted">
            <li>{t.packExample1}</li>
            <li>{t.packExample2}</li>
            <li>{t.packExample3}</li>
          </ul>
        </div>
        <div className="space-y-2">
          {columns.map((column) => (
            <div key={column.key}>
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`label-${column.key}`}>{t.packLabel}</Label>
                  <Input
                    id={`label-${column.key}`}
                    value={column.label}
                    placeholder={t.packLabelPlaceholder}
                    aria-invalid={fieldErrors[`label-${column.key}`] ? true : undefined}
                    onChange={(e) => {
                      updateColumn(column.key, { label: e.target.value });
                      clearError(`label-${column.key}`);
                    }}
                  />
                </div>
                <div className="w-36 shrink-0 sm:w-48">
                  <Label htmlFor={`units-${column.key}`}>
                    {t.packUnits} ({stockUnit})
                  </Label>
                  <NumberInput
                    id={`units-${column.key}`}
                    value={column.units}
                    placeholder="100"
                    aria-invalid={fieldErrors[`units-${column.key}`] ? true : undefined}
                    onValueChange={(units) => {
                      updateColumn(column.key, { units });
                      clearError(`units-${column.key}`);
                    }}
                  />
                </div>
                {columns.length > 1 && (
                  <button
                    type="button"
                    aria-label={dict.common.remove}
                    onClick={() => setColumns((prev) => prev.filter((c) => c.key !== column.key))}
                    className="flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-bad"
                  >
                    <CloseIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              <FieldError
                message={fieldErrors[`label-${column.key}`] ?? fieldErrors[`units-${column.key}`]}
              />
              {column.label.trim() && column.units ? (
                <Hint className="money">
                  {fill(t.packPreview, {
                    label: column.label.trim(),
                    units: formatMoney(column.units),
                    unit: stockUnit,
                  })}
                </Hint>
              ) : null}
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setColumns((prev) => [...prev, { key: newKey("pack"), label: "", units: null }])
          }
        >
          <PlusIcon className="h-4 w-4" />
          {t.addPack}
        </Button>
      </section>

      <section className="space-y-3">
        <div>
          <SectionTitle>{t.sizesTitle}</SectionTitle>
          <p className="text-sm text-muted">{t.sizesHint}</p>
          <p className="mt-1 text-sm font-medium">{fill(t.stockCountHint, { unit: stockUnit })}</p>
        </div>

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className={`rounded-2xl border border-border bg-surface p-3 ${
                row.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-end gap-2">
                <div className="grid min-w-0 flex-1 grid-cols-2 items-end gap-2">
                  <div>
                    <Label htmlFor={`size-${row.key}`}>{t.sizeName}</Label>
                    <Input
                      id={`size-${row.key}`}
                      value={row.name}
                      placeholder={t.sizeNamePlaceholder}
                      aria-invalid={fieldErrors[`size-${row.key}`] ? true : undefined}
                      onChange={(e) => {
                        updateRow(row.key, { name: e.target.value });
                        clearError(`size-${row.key}`);
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`note-${row.key}`}>
                      {t.sizeNote} ({dict.common.optional})
                    </Label>
                    <Input
                      id={`note-${row.key}`}
                      value={row.note}
                      onChange={(e) => updateRow(row.key, { note: e.target.value })}
                    />
                  </div>
                </div>
                {row.id ? (
                  <button
                    type="button"
                    aria-label={row.isActive ? t.hideSize : t.showSize}
                    title={row.isActive ? t.hideSize : t.showSize}
                    onClick={() => updateRow(row.key, { isActive: !row.isActive })}
                    className="flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-foreground"
                  >
                    {row.isActive ? <EyeIcon className="h-5 w-5" /> : <EyeOffIcon className="h-5 w-5" />}
                  </button>
                ) : (
                  <button
                    type="button"
                    aria-label={dict.common.remove}
                    disabled={rows.length === 1}
                    onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                    className="flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:text-bad disabled:invisible"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <FieldError message={fieldErrors[`size-${row.key}`]} />

              <div className="mt-2 grid grid-cols-2 items-end gap-2 sm:grid-cols-[repeat(auto-fill,minmax(9rem,1fr))]">
                {columns.map((column) => {
                  const cell = row.cells[column.key];
                  const label = column.label || t.packLabel;
                  return (
                    <div key={column.key} className="contents">
                      <div>
                        <Label htmlFor={`price-${row.key}-${column.key}`} className="truncate">
                          {t.sellPrice} · {label}
                        </Label>
                        <NumberInput
                          id={`price-${row.key}-${column.key}`}
                          value={cell?.price ?? null}
                          onValueChange={(price) => updateCell(row.key, column.key, { price })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`cost-${row.key}-${column.key}`} className="truncate">
                          {t.costPrice} · {label}
                        </Label>
                        <NumberInput
                          id={`cost-${row.key}-${column.key}`}
                          value={cell?.cost ?? null}
                          onValueChange={(cost) => updateCell(row.key, column.key, { cost })}
                        />
                      </div>
                    </div>
                  );
                })}
                {row.id ? (
                  <div className="col-span-2 self-end text-sm text-muted sm:col-span-1 sm:pb-2.5">
                    {dict.products.stock}:{" "}
                    <span className="money font-semibold text-foreground">
                      {formatMoney(row.stock ?? 0)} {stockUnit}
                    </span>
                    {coverage(row) && <span className="money block text-xs">= {coverage(row)}</span>}
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={`stock-${row.key}`}>
                      {t.openingStock} ({stockUnit})
                    </Label>
                    <NumberInput
                      id={`stock-${row.key}`}
                      value={row.stock}
                      onValueChange={(stock) => updateRow(row.key, { stock })}
                    />
                    {coverage(row) && <Hint className="money">= {coverage(row)}</Hint>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={() => setRows((prev) => [...prev, blankRow(newKey("size"))])}
        >
          <PlusIcon className="h-4 w-4" />
          {t.addSize}
        </Button>
      </section>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:mx-0 lg:rounded-xl lg:border-0 lg:px-0">
        <Button size="lg" className="w-full lg:w-auto lg:min-w-48" disabled={pending} onClick={save}>
          {pending ? dict.orders.saving : dict.common.save}
        </Button>
      </div>
    </div>
  );
}
