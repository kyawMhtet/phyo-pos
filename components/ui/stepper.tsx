"use client";

import { MinusIcon, PlusIcon } from "@/components/icons";

export function Stepper({
  value,
  min = 1,
  max,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  large = false,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  large?: boolean;
}) {
  const box = large ? "h-12 w-12" : "h-9 w-9";
  const buttonClass = `flex ${box} cursor-pointer items-center justify-center rounded-lg text-foreground transition-colors hover:bg-sunken active:bg-sunken disabled:cursor-not-allowed disabled:text-muted/50`;

  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-surface">
      <button
        type="button"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        className={buttonClass}
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const next = Number(e.target.value.replace(/[^0-9]/g, ""));
          onChange(Math.min(Math.max(next, min), max));
        }}
        className={`money bg-transparent text-center font-semibold outline-none ${
          large ? "w-14 text-lg" : "w-9 text-sm"
        }`}
      />
      <button
        type="button"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className={buttonClass}
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
