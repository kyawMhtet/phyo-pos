"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";

const expenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  amount: z.coerce.number().int().min(0),
  category: z.string().trim().optional(),
});

export async function createExpense(formData: FormData) {
  const parsed = expenseSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
  });
  if (!parsed.success) return;

  const db = getDb();
  await db.insert(expenses).values(parsed.data);
  revalidatePath("/expenses");
  revalidatePath("/");
}
