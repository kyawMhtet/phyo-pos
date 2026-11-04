import { desc, gte, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { formatDate, startOfMonth } from "@/lib/time";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { CoinIcon } from "@/components/icons";
import { Empty, Page, PageHeader, Stat } from "@/components/ui/page";
import { Pagination } from "@/components/ui/pagination";
import { DeleteExpenseButton, ExpenseButton } from "./expense-sheet";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { dict } = await getDictionary();
  const page = parsePage((await searchParams).page);
  const db = getDb();

  const [expenseRows, [month], usedCategories] = await Promise.all([
    db
      .select()
      .from(expenses)
      .orderBy(desc(expenses.createdAt), desc(expenses.id))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(gte(expenses.createdAt, startOfMonth())),
    db.selectDistinct({ category: expenses.category }).from(expenses).where(isNotNull(expenses.category)),
  ]);
  const hasMore = expenseRows.length > PAGE_SIZE;
  const allExpenses = expenseRows.slice(0, PAGE_SIZE);

  return (
    <Page>
      <PageHeader
        title={dict.expenses.title}
        actions={
          <ExpenseButton
            categories={usedCategories.flatMap((row) => row.category ?? [])}
            dict={dict}
          />
        }
      />

      <Stat
        label={dict.expenses.thisMonth}
        value={formatMoney(month.total)}
        unit={dict.common.currency}
      />

      {allExpenses.length === 0 ? (
        <Empty icon={<CoinIcon />} title={dict.expenses.noExpenses} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {allExpenses.map((expense) => (
            <li key={expense.id} className="flex items-center gap-3 py-2.5 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{expense.description}</p>
                <p className="truncate text-sm text-muted">
                  {expense.category ?? dict.expenses.general} · {formatDate(expense.createdAt)}
                </p>
              </div>
              <span className="money shrink-0 font-semibold">{formatMoney(expense.amount)}</span>
              <DeleteExpenseButton
                expenseId={expense.id}
                label={dict.common.remove}
                confirmLabel={dict.expenses.deleteConfirm}
              />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        basePath="/expenses"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
      />
    </Page>
  );
}
