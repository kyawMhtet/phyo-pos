import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { getProductLines } from "@/lib/db/queries";
import { stockLevel, type ProductLine } from "@/lib/catalog";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { BoxIcon, ChevronIcon, PlusIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { PageHelp } from "@/components/page-help";
import { Empty, Page, PageHeader, SectionTitle } from "@/components/ui/page";

export default async function ProductsPage() {
  const { dict } = await getDictionary();
  const lines = await getProductLines();

  const isListed = (line: ProductLine) => line.sizes.some((size) => size.isActive);
  const listed = lines.filter(isListed);
  const hidden = lines.filter((line) => !isListed(line));

  return (
    <Page wide>
      <PageHeader
        title={dict.products.title}
        help={<PageHelp topic="products" dict={dict} />}
        actions={
          <Link href="/products/new" className={buttonClass()}>
            <PlusIcon className="h-4 w-4" />
            {dict.products.addProduct}
          </Link>
        }
      />

      {listed.length === 0 && (
        <Empty
          icon={<BoxIcon />}
          title={dict.products.noProducts}
          hint={dict.products.noProductsHint}
        />
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {listed.map((line) => (
          <LineCard key={line.id} line={line} dict={dict} />
        ))}
      </div>

      {hidden.length > 0 && (
        <div className="space-y-3 pt-2">
          <SectionTitle>{dict.products.hiddenProducts}</SectionTitle>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {hidden.map((line) => (
              <li key={line.id}>
                <Link
                  href={`/products/${line.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 px-4 text-sm text-muted hover:bg-sunken/60"
                >
                  <span className="truncate">{line.name}</span>
                  <ChevronIcon className="h-4 w-4 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Page>
  );
}

function LineCard({ line, dict }: { line: ProductLine; dict: Dictionary }) {
  const active = line.sizes.filter((size) => size.isActive);
  const prices = active.flatMap((size) => size.packs.map((pack) => pack.price));
  const levels = active.map((size) => stockLevel(size.stock, line.lowStockAt));
  const out = levels.filter((level) => level === "out").length;
  const low = levels.filter((level) => level === "low").length;

  const min = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <Link
      href={`/products/${line.id}`}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent/60"
    >
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-display text-lg font-semibold tracking-tight">{line.name}</p>
        <p className="money text-sm text-muted">
          {active.length} {dict.products.sizesCount}
          {prices.length > 0 &&
            ` · ${formatMoney(min)}${maxPrice > min ? ` – ${formatMoney(maxPrice)}` : ""} ${dict.common.currency}`}
        </p>
        {(out > 0 || low > 0) && (
          <p className="flex gap-1.5 pt-0.5">
            {out > 0 && (
              <Badge tone="bad">
                {out} {dict.products.outCount}
              </Badge>
            )}
            {low > 0 && (
              <Badge tone="warn">
                {low} {dict.products.lowCount}
              </Badge>
            )}
          </p>
        )}
      </div>
      <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
    </Link>
  );
}
