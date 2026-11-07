"use client";

type Option<T> = { value: T; label: string };

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-sunken p-1" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 flex-1 cursor-pointer rounded-lg px-2 text-sm font-semibold transition-colors ${
            value === option.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function chipClass(selected: boolean) {
  return `min-h-10 cursor-pointer rounded-full border px-3.5 text-sm font-medium transition-colors ${
    selected
      ? "border-accent bg-accent text-accent-foreground"
      : "border-border bg-surface text-foreground hover:border-accent"
  }`;
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | null;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={chipClass(value === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Chips where any number can be on at once.
export function ToggleChips({
  values,
  onToggle,
  options,
}: {
  values: string[];
  onToggle: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={values.includes(option)}
          onClick={() => onToggle(option)}
          className={chipClass(values.includes(option))}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
