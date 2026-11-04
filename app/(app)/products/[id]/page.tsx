import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { stockAdjustments } from "@/lib/db/schema";
import { getProductLines } from "@/lib/db/queries";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/time";
import { packsFrom, stockLevel } from "@/lib/catalog";
import { fill } from "@/lib/text";
import { getDictionary } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHelp } from "@/components/page-help";
import { Page, PageHeader, SectionTitle } from "@/components/ui/page";
import { StockButton } from "./stock-sheet";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { dict } = await getDictionary();
  const { id } = await params;
  const lines = await getProductLines();
  const line = lines.find((l) => l.id === Number(id));
  if (!line) notFound();

  const sizeIds = line.sizes.map((size) => size.id);
  const history =
    sizeIds.length > 0
      ? await getDb()
          .select()
          .from(stockAdjustments)
          .where(inArray(stockAdjustments.productId, sizeIds))
          .orderBy(desc(stockAdjustments.createdAt), desc(stockAdjustments.id))
          .limit(20)
      : [];
  const sizeName = new Map(line.sizes.map((size) => [size.id, size.name]));
  const activeSizes = line.sizes.filter((size) => size.isActive);

  return (
    <Page>
      <PageHeader
        title={line.name}
        help={<PageHelp topic="productDetail" dict={dict} />}
        subtitle={line.options.length > 0 ? line.options.join(" · ") : undefined}
        backHref="/products"
        backLabel={dict.common.back}
        actions={
          <>
            <Link href={`/products/${line.id}/edit`} className={buttonClass({ variant: "secondary" })}>
              {dict.common.edit}
            </Link>
            {activeSizes.length > 0 && <StockButton line={line} dict={dict} />}
          </>
        }
      />

      <Card flush>
        <ul className="divide-y divide-border">
          {line.sizes.map((size) => {
            const level = stockLevel(size.stock, line.lowStockAt);
            return (
              <li
                key={size.id}
                className={`grid gap-x-4 gap-y-1 px-4 py-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-center ${
                  size.isActive ? "" : "opacity-55"
                }`}
              >
                <div className="flex items-start justify-between gap-3 sm:block">
                  <div>
                    <p className="font-display font-semibold tracking-tight">{size.name}</p>
                    {size.note && <p className="text-xs text-muted">{size.note}</p>}
                  </div>
                  <StockBadge
                    className="sm:hidden"
                    level={level}
                    label={`${formatMoney(size.stock)} ${line.stockUnit}`}
                  />
                </div>
                <div className="space-y-0.5">
                  {size.packs.length === 0 && <p className="text-sm text-muted">—</p>}
                  {size.packs.map((pack) => (
                    <p key={pack.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted">
                        {pack.label}
                        {pack.unitsPerPack > 1 && (
                          <span className="money text-xs">
                            {" · "}
                            {fill(dict.sell.available, {
                              n: packsFrom(size.stock, pack.unitsPerPack),
                            })}
                          </span>
                        )}
                      </span>
                      <span className="money">
                        <span className="font-semibold">{formatMoney(pack.price)}</span>
                        {pack.costPrice > 0 && (
                          <span className="ml-2 text-xs text-good">
                            +{formatMoney(pack.price - pack.costPrice)}
                          </span>
                        )}
                      </span>
                    </p>
                  ))}
                </div>
                <div className="hidden w-28 text-right sm:block">
                  <StockBadge level={level} label={`${formatMoney(size.stock)} ${line.stockUnit}`} />
                </div>
              </li>
            );
          })}
          {line.sizes.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-muted">{dict.products.noSizes}</li>
          )}
        </ul>
      </Card>

      {history.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{dict.stock.history}</SectionTitle>
          <Card flush>
            <ul className="divide-y divide-border text-sm">
              {history.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{sizeName.get(entry.productId)}</p>
                    <p className="truncate text-xs text-muted">
                      {entry.reason} · {formatDateTime(entry.createdAt)}
                    </p>
                  </div>
                  <span className={`money shrink-0 font-semibold ${entry.change > 0 ? "text-good" : "text-bad"}`}>
                    {entry.change > 0 ? "+" : ""}
                    {formatMoney(entry.change)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </Page>
  );
}

function StockBadge({
  level,
  label,
  className,
}: {
  level: "out" | "low" | "ok";
  label: string;
  className?: string;
}) {
  const tone = level === "out" ? "bad" : level === "low" ? "warn" : "neutral";
  return (
    <Badge tone={tone} className={`money ${className ?? ""}`}>
      {label}
    </Badge>
  );
}
