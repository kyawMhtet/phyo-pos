import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { WarningIcon } from "@/components/icons";

const fieldClass =
  "w-full min-h-11 rounded-xl border border-border bg-surface px-3 py-2 text-base text-foreground outline-none transition-shadow placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20 aria-invalid:border-bad aria-invalid:ring-2 aria-invalid:ring-bad/15";

export function FieldError({ message, className = "" }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p className={`field-error mt-1 flex items-start gap-1 text-sm font-medium text-bad ${className}`}>
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
      {message}
    </p>
  );
}

export function Input({
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <>
      <input
        aria-invalid={error ? true : undefined}
        {...props}
        className={`${fieldClass} ${props.className ?? ""}`}
      />
      <FieldError message={error} />
    </>
  );
}

export function Textarea({
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <>
      <textarea
        aria-invalid={error ? true : undefined}
        {...props}
        className={`${fieldClass} ${props.className ?? ""}`}
      />
      <FieldError message={error} />
    </>
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${fieldClass} ${props.className ?? ""}`} />;
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1 block text-sm font-medium text-muted ${props.className ?? ""}`}
    />
  );
}

// Whole-number field that shows thousands separators as you type.
export function NumberInput({
  value,
  onValueChange,
  error,
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  error?: string;
}) {
  return (
    <>
      <input
        aria-invalid={error ? true : undefined}
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === null ? "" : new Intl.NumberFormat("en-US").format(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 12);
          onValueChange(digits ? Number(digits) : null);
        }}
        onFocus={(e) => e.target.select()}
        className={`${fieldClass} money ${className}`}
      />
      <FieldError message={error} />
    </>
  );
}
