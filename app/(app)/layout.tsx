import { getDictionary } from "@/lib/i18n";
import { logout } from "@/app/login/actions";
import { LocaleToggle } from "@/components/locale-toggle";
import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";
import { Toaster } from "@/components/ui/toast";

// Every page here reads live stock/sales data straight from the DB and must
// never be prerendered — both because Turso credentials aren't available at
// build time, and because stale build-time data would be actively wrong for a POS.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { locale, dict } = await getDictionary();

  return (
    <>
      <Sidebar
        labels={dict.nav}
        appName={dict.common.appName}
        footer={
          <>
            <LocaleToggle locale={locale} />
            <form action={logout}>
              <button type="submit" className="cursor-pointer text-xs hover:text-ink-foreground">
                {dict.common.logout}
              </button>
            </form>
          </>
        }
      />
      <main className="flex w-full flex-1 flex-col lg:pl-60 print:pl-0">{children}</main>
      <BottomNav labels={dict.nav} />
      <Toaster />
    </>
  );
}
