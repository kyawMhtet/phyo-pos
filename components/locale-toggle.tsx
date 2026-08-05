import { setLocale } from "@/lib/i18n/actions";
import type { Locale } from "@/lib/i18n";

export function LocaleToggle({ locale }: { locale: Locale }) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-border text-xs">
      {(
        [
          ["mm", "မြန်မာ"],
          ["en", "EN"],
        ] as const
      ).map(([value, label]) => (
        <form key={value} action={setLocale.bind(null, value)}>
          <button
            type="submit"
            disabled={locale === value}
            className={`w-16 cursor-pointer whitespace-nowrap px-2.5 py-1 text-center transition-colors disabled:cursor-default ${
              locale === value
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {label}
          </button>
        </form>
      ))}
    </div>
  );
}
