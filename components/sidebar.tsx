"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BagIcon,
  BoxIcon,
  ChartIcon,
  CoinIcon,
  HomeIcon,
  PeopleIcon,
  TagIcon,
} from "@/components/icons";

export function Sidebar({
  labels,
  appName,
  footer,
}: {
  labels: {
    dashboard: string;
    sell: string;
    orders: string;
    products: string;
    customers: string;
    expenses: string;
    reports: string;
  };
  appName: string;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();

  const items = [
    { href: "/", label: labels.dashboard, Icon: HomeIcon },
    { href: "/orders", label: labels.orders, Icon: BagIcon },
    { href: "/products", label: labels.products, Icon: BoxIcon },
    { href: "/customers", label: labels.customers, Icon: PeopleIcon },
    { href: "/expenses", label: labels.expenses, Icon: CoinIcon },
    { href: "/reports", label: labels.reports, Icon: ChartIcon },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col bg-ink text-ink-foreground lg:flex print:hidden">
      <div className="px-5 pt-6 pb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-wordmark.png" alt={appName} className="h-6 w-auto invert" />
      </div>

      <div className="px-3">
        <Link
          href="/sell"
          aria-current={pathname === "/sell" ? "page" : undefined}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-4 font-semibold text-ink transition-all hover:brightness-105 active:scale-[0.98]"
        >
          <TagIcon className="h-5 w-5" />
          {labels.sell}
        </Link>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                active
                  ? "bg-ink-line text-ink-foreground"
                  : "text-ink-muted hover:bg-ink-line/60 hover:text-ink-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-ink-line px-4 py-3 text-ink-muted">
        {footer}
      </div>
    </aside>
  );
}
