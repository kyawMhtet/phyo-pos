"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";

const expenseSchema = z.object({
  description: z.string().trim().min(1),
  amount: z.number().int().positive(),
  category: z.string().trim(),
});

function refreshExpensePages() {
  revalidatePath("/expenses");
  revalidatePath("/reports");
  revalidatePath("/");
}

export async function createExpense(input: z.infer<typeof expenseSchema>) {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return;

  await getDb()
    .insert(expenses)
    .values({ ...parsed.data, category: parsed.data.category || null });
  refreshExpensePages();
}

export async function deleteExpense(expenseId: number) {
  await getDb().delete(expenses).where(eq(expenses.id, expenseId));
  refreshExpensePages();
}
