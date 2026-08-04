import { desc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { createExpense } from "./actions";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { dict, locale } = await getDictionary();
  const page = parsePage((await searchParams).page);
  const db = getDb();
  const expenseRows = await db
    .select()
    .from(expenses)
    .orderBy(desc(expenses.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);
  const hasMore = expenseRows.length > PAGE_SIZE;
  const allExpenses = expenseRows.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg text-accent">{dict.expenses.title}</h1>

      <div className="space-y-3">
        {allExpenses.length === 0 && (
          <p className="text-sm text-muted">{dict.expenses.noExpenses}</p>
        )}
        {allExpenses.map((expense, i) => (
          <Card
            key={expense.id}
            className="rise-in flex items-center justify-between"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div>
              <p className="font-medium">{expense.description}</p>
              <p className="text-xs text-muted">
                {expense.category ?? dict.expenses.general} ·{" "}
                {expense.createdAt.toLocaleDateString(locale === "mm" ? "en-GB" : "en-US")}
              </p>
            </div>
            <p className="font-medium text-red-600">-{formatMoney(expense.amount)}</p>
          </Card>
        ))}
      </div>

      <Pagination
        basePath="/expenses"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
      />

      <details className="rounded-lg border border-dashed border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          {dict.expenses.addExpense}
        </summary>
        <form action={createExpense} className="space-y-3 px-4 pb-4">
          <div>
            <Label htmlFor="description">{dict.expenses.description}</Label>
            <Input id="description" name="description" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="amount">{dict.expenses.amount}</Label>
              <Input id="amount" name="amount" type="number" min={0} required />
            </div>
            <div>
              <Label htmlFor="category">{dict.expenses.category}</Label>
              <Input
                id="category"
                name="category"
                placeholder={dict.expenses.categoryPlaceholder}
              />
            </div>
          </div>
          <Button type="submit">{dict.expenses.addExpense}</Button>
        </form>
      </details>
    </div>
  );
}
