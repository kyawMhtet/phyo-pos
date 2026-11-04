import Link from "next/link";
import { BackIcon } from "@/components/icons";

export function Page({
  children,
  wide = false,
}: {
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full space-y-5 px-4 pt-5 pb-28 lg:px-8 lg:pt-7 lg:pb-10 print:p-0 ${
        wide ? "max-w-6xl" : "max-w-4xl"
      }`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  subtitle?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            aria-label={backLabel}
            className="-ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sunken hover:text-foreground"
          >
            <BackIcon className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function Empty({
  icon,
  title,
  hint,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
      <div className="text-muted [&>svg]:h-8 [&>svg]:w-8">{icon}</div>
      <p className="font-medium">{title}</p>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  className = "",
}: {
  label: string;
  value: string;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className="money mt-1 font-display text-2xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
      </p>
    </div>
  );
}

export function FilterTabs({
  tabs,
}: {
  tabs: { href: string; label: string; active: boolean; count?: number }[];
}) {
  return (
    <div className="scroll-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
            tab.active
              ? "border-ink bg-ink text-ink-foreground dark:border-accent dark:bg-accent dark:text-accent-foreground"
              : "border-border bg-surface text-muted hover:text-foreground"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span className="money text-xs opacity-75">{tab.count}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
