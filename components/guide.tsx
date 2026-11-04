import type { Dictionary } from "@/lib/i18n";

export type Guide = Dictionary["help"]["guides"]["start"];

export function GuideContent({ guide, tipsLabel }: { guide: Guide; tipsLabel: string }) {
  return (
    <div className="space-y-4">
      <p className="text-muted">{guide.intro}</p>
      <ol className="space-y-3">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="money flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">
              {index + 1}
            </span>
            <span className="min-w-0">{step}</span>
          </li>
        ))}
      </ol>
      <div className="rounded-xl bg-sunken px-4 py-3 text-sm">
        <p className="font-semibold">{tipsLabel}</p>
        <ul className="mt-1 list-disc space-y-1 pl-4 text-muted">
          {guide.tips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
