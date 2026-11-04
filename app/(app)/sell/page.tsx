import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { getProductLines } from "@/lib/db/queries";
import { getDictionary } from "@/lib/i18n";
import { PageHelp } from "@/components/page-help";
import { Register } from "./register";

export default async function SellPage() {
  const { dict } = await getDictionary();
  const [lines, customerRows] = await Promise.all([
    getProductLines(),
    getDb()
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        address: customers.address,
      })
      .from(customers)
      .orderBy(asc(customers.name)),
  ]);

  const sellableLines = lines
    .map((line) => ({
      ...line,
      sizes: line.sizes.filter((size) => size.isActive && size.packs.length > 0),
    }))
    .filter((line) => line.sizes.length > 0);

  return (
    <Register
      lines={sellableLines}
      customers={customerRows}
      dict={dict}
      help={<PageHelp topic="sell" dict={dict} />}
    />
  );
}
