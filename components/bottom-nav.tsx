"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  BagIcon,
  BoxIcon,
  PeopleIcon,
  CoinIcon,
  ChartIcon,
} from "@/components/nav-icons";

export function BottomNav({
  labels,
}: {
  labels: {
    dashboard: string;
    orders: string;
    products: string;
    customers: string;
    expenses: string;
    reports: string;
  };
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
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-dashed border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-3xl">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-accent" : "text-muted"}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
