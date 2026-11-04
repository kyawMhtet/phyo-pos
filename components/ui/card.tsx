import { HTMLAttributes } from "react";

export function Card({
  className = "",
  flush = false,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  /** No padding, for lists whose rows run edge to edge. */
  flush?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-surface ${flush ? "" : "p-4"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
