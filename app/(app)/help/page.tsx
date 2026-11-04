import { getDictionary, type Dictionary } from "@/lib/i18n";
import { GuideContent } from "@/components/guide";
import { ChevronIcon } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Page, PageHeader } from "@/components/ui/page";

// In the order someone learns the shop.
const TOPICS: (keyof Dictionary["help"]["guides"])[] = [
  "sell",
  "orders",
  "orderDetail",
  "products",
  "addProduct",
  "productDetail",
  "customers",
  "expenses",
  "home",
  "reports",
];

export default async function HelpPage() {
  const { dict } = await getDictionary();
  const start = dict.help.guides.start;

  return (
    <Page>
      <PageHeader title={dict.help.title} subtitle={dict.help.subtitle} />

      <Card className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{start.title}</h2>
        <GuideContent guide={start} tipsLabel={dict.help.tips} />
      </Card>

      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {TOPICS.map((topic) => {
          const guide = dict.help.guides[topic];
          return (
            <details key={topic} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 font-medium [&::-webkit-details-marker]:hidden">
                {guide.title}
                <ChevronIcon className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-4 pb-5">
                <GuideContent guide={guide} tipsLabel={dict.help.tips} />
              </div>
            </details>
          );
        })}
      </div>
    </Page>
  );
}
