import Link from "next/link";
import { logout } from "@/app/login/actions";
import { getDictionary } from "@/lib/i18n";
import { ChartIcon, ChevronIcon, CoinIcon, HelpIcon, PeopleIcon } from "@/components/icons";
import { LocaleToggle } from "@/components/locale-toggle";
import { Button } from "@/components/ui/button";
import { Page, PageHeader } from "@/components/ui/page";

export default async function MorePage() {
  const { locale, dict } = await getDictionary();

  const links = [
    { href: "/customers", label: dict.nav.customers, Icon: PeopleIcon },
    { href: "/expenses", label: dict.nav.expenses, Icon: CoinIcon },
    { href: "/reports", label: dict.nav.reports, Icon: ChartIcon },
    { href: "/help", label: dict.nav.help, Icon: HelpIcon },
  ];

  return (
    <Page>
      <PageHeader title={dict.nav.more} />

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
        {links.map(({ href, label, Icon }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-14 items-center gap-3 px-4 font-medium">
              <Icon className="h-5 w-5 text-accent" />
              <span className="flex-1">{label}</span>
              <ChevronIcon className="h-4 w-4 text-muted" />
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex min-h-14 items-center justify-between rounded-2xl border border-border bg-surface px-4 font-medium">
        {dict.common.language}
        <LocaleToggle locale={locale} />
      </div>

      <form action={logout}>
        <Button type="submit" variant="secondary" className="w-full">
          {dict.common.logout}
        </Button>
      </form>
    </Page>
  );
}
