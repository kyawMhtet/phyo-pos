import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`relative rounded-lg border border-dashed border-border bg-surface p-4 shadow-[3px_3px_0_0_var(--color-border)] ${className}`}
      {...props}
    >
      <span
        aria-hidden
        className="absolute -left-1.5 top-3 h-3 w-3 rounded-full border border-dashed border-border bg-background"
      />
      {children}
    </div>
  );
}
