"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/lib/i18n";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input, Label, NumberInput } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { createExpense, deleteExpense } from "./actions";

export function ExpenseButton({
  categories,
  dict,
}: {
  categories: string[];
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon className="h-4 w-4" />
        {dict.expenses.addExpense}
      </Button>
      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={dict.expenses.addExpense}
        closeLabel={dict.common.close}
      >
        <ExpenseForm categories={categories} dict={dict} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

function ExpenseForm({
  categories,
  dict,
  onDone,
}: {
  categories: string[];
  dict: Dictionary;
  onDone: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [category, setCategory] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="description">{dict.expenses.description}</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="amount">{dict.expenses.amount}</Label>
          <NumberInput id="amount" value={amount} onValueChange={setAmount} />
        </div>
        <div>
          <Label htmlFor="category">{dict.expenses.category}</Label>
          <Input
            id="category"
            list="expense-categories"
            value={category}
            placeholder={dict.expenses.categoryPlaceholder}
            onChange={(e) => setCategory(e.target.value)}
          />
          <datalist id="expense-categories">
            {categories.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </div>
      </div>
      <Button
        size="lg"
        className="w-full"
        disabled={pending || !description.trim() || !amount}
        onClick={() =>
          startTransition(async () => {
            await createExpense({ description, amount: amount ?? 0, category });
            onDone();
          })
        }
      >
        {pending ? dict.orders.saving : dict.common.save}
      </Button>
    </div>
  );
}

export function DeleteExpenseButton({
  expenseId,
  label,
  confirmLabel,
}: {
  expenseId: number;
  label: string;
  confirmLabel: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmLabel)) startTransition(() => deleteExpense(expenseId));
      }}
      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-sunken hover:text-bad"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}
