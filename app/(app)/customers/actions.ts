"use server";

import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import type { FormResult } from "@/lib/form";
import { getDictionary } from "@/lib/i18n";

const customerSchema = z.object({
  name: z.string().trim(),
  phone: z.string().trim(),
  address: z.string().trim(),
});

export async function saveCustomer(
  customerId: number | null,
  input: z.infer<typeof customerSchema>
): Promise<FormResult> {
  const { dict } = await getDictionary();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return { error: dict.common.errorGeneric };
  if (!parsed.data.name) return { fieldErrors: { name: dict.common.required } };

  const values = {
    name: parsed.data.name,
    phone: parsed.data.phone || null,
    address: parsed.data.address || null,
  };

  const db = getDb();
  if (values.phone) {
    const samePhone = await db.query.customers.findFirst({
      where: and(
        eq(customers.phone, values.phone),
        customerId ? ne(customers.id, customerId) : undefined
      ),
    });
    if (samePhone) {
      return { fieldErrors: { phone: `${dict.customers.errorDuplicatePhone} ${samePhone.name}` } };
    }
  }

  if (customerId) {
    await db.update(customers).set(values).where(eq(customers.id, customerId));
  } else {
    await db.insert(customers).values(values);
  }

  revalidatePath("/customers", "layout");
  revalidatePath("/sell");
  return {};
}
