type IconProps = { className?: string };

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function BagIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M6 8h12l1 12.5a1 1 0 0 1-1 1.5H6a1 1 0 0 1-1-1.5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="m3.5 7 8.5-4 8.5 4-8.5 4-8.5-4Z" />
      <path d="M3.5 7v10l8.5 4 8.5-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.2a5.3 5.3 0 0 1 3 5.3" />
    </svg>
  );
}

export function CoinIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.3c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2c0 2.5-5 1.8-5 4.4 0 1.1 1.1 2 2.5 2s2.5-.9 2.5-2" />
      <path d="M12 6.2v1.1M12 16.7v1.1" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}
