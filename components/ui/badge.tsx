const tones = {
  neutral: "bg-sunken text-muted",
  good: "bg-good/12 text-good",
  warn: "bg-warn/12 text-warn",
  info: "bg-info/12 text-info",
  bad: "bg-bad/12 text-bad",
};

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
