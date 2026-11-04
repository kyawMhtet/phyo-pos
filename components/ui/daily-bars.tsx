import { formatMoney, formatMoneyCompact } from "@/lib/money";

export type DailyBar = { label: string; value: number };

// One series, so one hue and no legend; the section title names it. Tooltips work on
// hover and, via tabIndex, on tap.
export function DailyBars({ data, unit }: { data: DailyBar[]; unit: string }) {
  const max = Math.max(...data.map((day) => day.value));
  const edgeLabels = [data[0], data[Math.floor((data.length - 1) / 2)], data[data.length - 1]];

  return (
    <div className="pt-1">
      <div className="relative h-36">
        {max > 0 && (
          <span className="money absolute top-0 left-0 text-[11px] text-muted">
            {formatMoneyCompact(max)}
          </span>
        )}
        <div className="absolute inset-x-0 top-1/2 border-t border-border" />
        <div className="absolute inset-x-0 bottom-0 flex h-[calc(100%-1.1rem)] items-end gap-[2px] border-b border-border">
          {data.map((day, index) => (
            <div
              key={day.label}
              tabIndex={0}
              aria-label={`${day.label}: ${formatMoney(day.value)} ${unit}`}
              className="group relative flex h-full flex-1 items-end justify-center outline-none"
            >
              <div
                className="w-full max-w-6 rounded-t bg-chart transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                style={{ height: max > 0 ? `${(day.value / max) * 100}%` : 0 }}
              />
              <div
                className={`pointer-events-none absolute bottom-full z-10 mb-1 hidden rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-ink-foreground shadow group-hover:block group-focus:block ${
                  index < data.length / 2 ? "left-0" : "right-0"
                }`}
              >
                {day.label} · <span className="money font-semibold">{formatMoney(day.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        {edgeLabels.map((day, index) => (
          <span key={index}>{day.label}</span>
        ))}
      </div>
    </div>
  );
}
