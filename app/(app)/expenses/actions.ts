"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";
import { hasErrors, type FieldErrors, type FormResult } from "@/lib/form";
import { getDictionary } from "@/lib/i18n";

const expenseSchema = z.object({
  description: z.string().trim(),
  amount: z.number().int().min(0),
  category: z.string().trim(),
});

function refreshExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function createExpense(input: z.infer<typeof expenseSchema>): Promise<FormResult> {
  const { dict } = await getDictionary();
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { error: dict.common.errorGeneric };

  const fieldErrors: FieldErrors = {};
  if (!parsed.data.description) fieldErrors.description = dict.common.required;
  if (parsed.data.amount === 0) fieldErrors.amount = dict.common.required;
  if (hasErrors(fieldErrors)) return { fieldErrors };

  await getDb()
    .insert(expenses)
    .values({ ...parsed.data, category: parsed.data.category || null });
  refreshExpensePages();
  return {};
}

export async function deleteExpense(expenseId: number) {
  await getDb().delete(expenses).where(eq(expenses.id, expenseId));
  refreshExpensePages();
}
