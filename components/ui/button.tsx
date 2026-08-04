import { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-accent text-accent-foreground hover:brightness-110 active:translate-y-px shadow-[2px_2px_0_0_var(--color-border)]",
  secondary:
    "border border-dashed border-border text-foreground hover:bg-surface active:translate-y-px",
  danger: "bg-red-700 text-white hover:bg-red-800 active:translate-y-px",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
