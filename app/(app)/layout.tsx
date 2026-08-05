import { getDictionary } from "@/lib/i18n";
import { logout } from "@/app/login/actions";
import { LocaleToggle } from "@/components/locale-toggle";
import { BottomNav } from "@/components/bottom-nav";

// Every page here reads live stock/sales data straight from the DB and must
// never be prerendered — both because Turso credentials aren't available at
// build time, and because stale build-time data would be actively wrong for a POS.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getDictionary();

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={dict.common.appName} className="h-25 w-auto" />
          <div className="flex items-center gap-3">
            <LocaleToggle locale={locale} />
            <form action={logout}>
              <button
                type="submit"
                className="cursor-pointer text-xs text-muted hover:text-foreground"
              >
                {dict.common.logout}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24 print:p-0">
        {children}
      </main>
      <BottomNav labels={dict.nav} />
    </>
  );
}
