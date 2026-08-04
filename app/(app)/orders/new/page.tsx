import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers, products } from "@/lib/db/schema";
import { getDictionary } from "@/lib/i18n";
import { NewSaleForm } from "./new-sale-form";

export default async function NewSalePage() {
  const { dict } = await getDictionary();
  const db = getDb();
  const [activeProducts, allCustomers] = await Promise.all([
    db.select().from(products).where(eq(products.isActive, true)),
    db.select().from(customers),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg text-accent">{dict.orders.newSaleTitle}</h1>
      <NewSaleForm products={activeProducts} customers={allCustomers} dict={dict} />
    </div>
  );
}
