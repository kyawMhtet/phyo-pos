"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BagIcon, BoxIcon, HomeIcon, MoreIcon, TagIcon } from "@/components/icons";

export function BottomNav({
  labels,
}: {
  labels: { dashboard: string; sell: string; orders: string; products: string; more: string };
}) {
  const pathname = usePathname();
  const moreRoutes = ["/more", "/customers", "/expenses", "/reports"];

  const items = [
    { href: "/", label: labels.dashboard, Icon: HomeIcon, active: pathname === "/" },
    { href: "/orders", label: labels.orders, Icon: BagIcon, active: pathname.startsWith("/orders") },
    { href: "/sell", label: labels.sell, Icon: TagIcon, active: pathname === "/sell", primary: true },
    { href: "/products", label: labels.products, Icon: BoxIcon, active: pathname.startsWith("/products") },
    {
      href: "/more",
      label: labels.more,
      Icon: MoreIcon,
      active: moreRoutes.some((route) => pathname.startsWith(route)),
    },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden print:hidden">
      <div className="flex">
        {items.map(({ href, label, Icon, active, primary }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 pt-1.5 pb-1 text-[11px] font-medium transition-colors ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            {primary ? (
              <span className="-mt-5 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md ring-4 ring-surface">
                <Icon className="h-5 w-5" />
              </span>
            ) : (
              <Icon className="h-5 w-5" />
            )}
            <span className="max-w-full truncate">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
