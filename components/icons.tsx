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

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M3.5 12.2V5a1.5 1.5 0 0 1 1.5-1.5h7.2a2 2 0 0 1 1.4.6l6.8 6.8a2 2 0 0 1 0 2.8l-6.9 6.9a2 2 0 0 1-2.8 0l-6.6-6.6a2 2 0 0 1-.6-1.8Z" />
      <circle cx="8.3" cy="8.3" r="1.3" />
    </svg>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MinusIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function BackIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
    </svg>
  );
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
    </svg>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M4.5 6.5h15M9.5 6.5V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.7" />
      <path d="m6.5 6.5.9 12.6a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.6" />
    </svg>
  );
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M7 8.5V3.5h10v5" />
      <path d="M7 17H5a1.5 1.5 0 0 1-1.5-1.5v-5.5A1.5 1.5 0 0 1 5 8.5h14a1.5 1.5 0 0 1 1.5 1.5v5.5A1.5 1.5 0 0 1 19 17h-2" />
      <path d="M7 14h10v6.5H7z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function TruckIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M2.5 6.5h11.5v10H2.5z" />
      <path d="M14 10h4l3.5 3.5v3H14" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17.5" cy="18" r="1.8" />
    </svg>
  );
}

export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M3 3l18 18" />
      <path d="M9.9 4.24A10.4 10.4 0 0 1 12 4c6.5 0 10 7 10 7a13.6 13.6 0 0 1-3.15 4.05M6.5 6.6C4 8.3 2 11 2 11s3.5 7 10 7c1.4 0 2.65-.3 3.75-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  );
}

export function HelpIcon({ className }: IconProps) {
  return (
    <svg {...common} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.6 9.6a2.4 2.4 0 1 1 3.6 2.1c-.8.5-1.2 1-1.2 1.9" />
      <path d="M12 16.6v.1" />
    </svg>
  );
}
