"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export async function createCustomer(formData: FormData) {
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
  });
  if (!parsed.success) return;

  const db = getDb();
  await db.insert(customers).values(parsed.data);
  revalidatePath("/customers");
  revalidatePath("/orders/new");
}
