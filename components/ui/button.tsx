import { ButtonHTMLAttributes } from "react";

const variants = {
  primary: "bg-accent text-accent-foreground hover:brightness-110 shadow-sm",
  secondary: "border border-border bg-surface text-foreground hover:bg-sunken",
  ghost: "text-muted hover:bg-sunken hover:text-foreground",
  danger: "bg-bad text-white hover:brightness-110 dark:text-black",
};

const sizes = {
  sm: "min-h-9 rounded-lg px-3 text-sm",
  md: "min-h-11 rounded-xl px-4 text-sm",
  lg: "min-h-13 rounded-xl px-5 text-base",
};

type ButtonStyle = { variant?: keyof typeof variants; size?: keyof typeof sizes };

// Also used to style <Link>s as buttons.
export function buttonClass({ variant = "primary", size = "md" }: ButtonStyle = {}) {
  return `inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${variants[variant]} ${sizes[size]}`;
}

export function Button({
  variant,
  size,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyle) {
  return (
    <button type={type} className={`${buttonClass({ variant, size })} ${className}`} {...props} />
  );
}
