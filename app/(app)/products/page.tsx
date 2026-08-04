import Link from "next/link";
import { desc, eq, like, or } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { categories, products } from "@/lib/db/schema";
import { formatMoney } from "@/lib/money";
import { getDictionary } from "@/lib/i18n";
import { PAGE_SIZE, parsePage } from "@/lib/pagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { SearchBox } from "@/components/ui/search-box";
import { createCategory, createProduct } from "./actions";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { dict } = await getDictionary();
  const { page: pageParam, q } = await searchParams;
  const page = parsePage(pageParam);
  const query = q?.trim();
  const db = getDb();

  const searchWhere = query
    ? or(like(products.name, `%${query}%`), like(products.variant, `%${query}%`))
    : undefined;

  const [productRows, allCategories] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        variant: products.variant,
        price: products.price,
        costPrice: products.costPrice,
        stock: products.stock,
        isActive: products.isActive,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(searchWhere)
      .orderBy(desc(products.createdAt))
      .limit(PAGE_SIZE + 1)
      .offset((page - 1) * PAGE_SIZE),
    db.select().from(categories),
  ]);
  const hasMore = productRows.length > PAGE_SIZE;
  const allProducts = productRows.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-lg text-accent">{dict.products.title}</h1>

      <SearchBox placeholder={dict.products.search} />

      <div className="space-y-3">
        {allProducts.length === 0 && (
          <p className="text-sm text-muted">
            {query
              ? `${dict.common.noResults} "${query}"`
              : dict.products.noProducts}
          </p>
        )}
        {allProducts.map((product, i) => (
          <Link key={product.id} href={`/products/${product.id}`}>
            <Card
              className="rise-in flex items-center justify-between gap-3 hover:border-accent"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div>
                <p className="font-medium">
                  {product.name}
                  {product.variant ? ` — ${product.variant}` : ""}
                </p>
                <p className="text-xs text-muted">
                  {product.categoryName ?? dict.products.uncategorized} ·{" "}
                  {dict.products.stock} {product.stock}
                  {!product.isActive && ` · ${dict.products.inactive}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatMoney(product.price)}</p>
                <p className="text-xs text-muted">
                  +{formatMoney(product.price - product.costPrice)}
                </p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Pagination
        basePath="/products"
        page={page}
        hasMore={hasMore}
        previousLabel={dict.common.previous}
        nextLabel={dict.common.next}
        query={query}
      />

      <details className="rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          {dict.products.addProduct}
        </summary>
        <form action={createProduct} className="space-y-3 px-4 pb-4">
          <div>
            <Label htmlFor="name">{dict.products.name}</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="variant">{dict.products.variant}</Label>
            <Input
              id="variant"
              name="variant"
              placeholder={dict.products.variantPlaceholder}
            />
          </div>
          <div>
            <Label htmlFor="categoryId">{dict.products.category}</Label>
            <Select id="categoryId" name="categoryId" defaultValue="">
              <option value="">{dict.products.uncategorized}</option>
              {allCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="price">{dict.products.sellingPrice}</Label>
              <Input id="price" name="price" type="number" min={0} required />
            </div>
            <div>
              <Label htmlFor="costPrice">{dict.products.buyingPrice}</Label>
              <Input id="costPrice" name="costPrice" type="number" min={0} />
            </div>
            <div>
              <Label htmlFor="stock">{dict.products.stock}</Label>
              <Input id="stock" name="stock" type="number" min={0} />
            </div>
          </div>
          <Button type="submit">{dict.products.addProduct}</Button>
        </form>
      </details>

      <details className="rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          {dict.products.addCategory}
        </summary>
        <form action={createCategory} className="flex gap-2 px-4 pb-4">
          <Input name="name" placeholder={dict.products.categoryName} required />
          <Button type="submit">{dict.common.save}</Button>
        </form>
      </details>
    </div>
  );
}
