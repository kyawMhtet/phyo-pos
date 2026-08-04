import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
