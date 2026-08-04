import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, products, stockAdjustments } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { adjustStock, updateProduct } from "../actions";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId)) notFound();

  const db = getDb();
  const [product, allCategories, history] = await Promise.all([
    db.query.products.findFirst({ where: eq(products.id, productId) }),
    db.select().from(categories),
    db
      .select()
      .from(stockAdjustments)
      .where(eq(stockAdjustments.productId, productId))
      .orderBy(desc(stockAdjustments.createdAt))
      .limit(20),
  ]);

  if (!product) notFound();

  const updateProductWithId = updateProduct.bind(null, productId);
  const adjustStockWithId = adjustStock.bind(null, productId);
  const margin = product.price - product.costPrice;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-lg text-accent">{product.name}</h1>
        <p className="text-sm text-muted">
          {dict.products.stock}: {product.stock} · {formatMoney(product.price)} ·{" "}
          {dict.products.margin} +{formatMoney(margin)}
        </p>
      </div>

      <Card className="space-y-3">
        <p className="text-sm font-medium">{dict.products.editProduct}</p>
        <form action={updateProductWithId} className="space-y-3">
          <div>
            <Label htmlFor="name">{dict.products.name}</Label>
            <Input id="name" name="name" defaultValue={product.name} required />
          </div>
          <div>
            <Label htmlFor="variant">{dict.products.variant}</Label>
            <Input id="variant" name="variant" defaultValue={product.variant ?? ""} />
          </div>
          <div>
            <Label htmlFor="categoryId">{dict.products.category}</Label>
            <Select
              id="categoryId"
              name="categoryId"
              defaultValue={product.categoryId ?? ""}
            >
              <option value="">{dict.products.uncategorized}</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="price">{dict.products.sellingPrice}</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                defaultValue={product.price}
                required
              />
            </div>
            <div>
              <Label htmlFor="costPrice">{dict.products.buyingPrice}</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                min={0}
                defaultValue={product.costPrice}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
            {dict.products.active}
          </label>
          <Button type="submit">{dict.common.save}</Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <p className="text-sm font-medium">{dict.products.adjustStock}</p>
        <form action={adjustStockWithId} className="flex flex-wrap items-end gap-2">
          <div className="w-28">
            <Label htmlFor="change">{dict.products.change}</Label>
            <Input
              id="change"
              name="change"
              type="number"
              placeholder={dict.products.changePlaceholder}
              required
            />
          </div>
          <div className="min-w-40 flex-1">
            <Label htmlFor="reason">{dict.products.reason}</Label>
            <Input
              id="reason"
              name="reason"
              placeholder={dict.products.reasonPlaceholder}
              required
            />
          </div>
          <Button type="submit">{dict.products.applyAdjustment}</Button>
        </form>

        {history.length > 0 && (
          <div className="space-y-1 pt-2 text-sm">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex justify-between border-t border-dashed border-border pt-1 text-muted first:border-0 first:pt-0"
              >
                <span>{entry.reason}</span>
                <span
                  className={
                    entry.change > 0 ? "text-stamp-delivered" : "text-red-600"
                  }
                >
                  {entry.change > 0 ? "+" : ""}
                  {entry.change}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
