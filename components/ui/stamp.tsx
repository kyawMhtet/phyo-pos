const colors = {
  pending: "border-stamp-pending text-stamp-pending",
  paid: "border-stamp-paid text-stamp-paid",
  delivered: "border-stamp-delivered text-stamp-delivered",
  cancelled: "border-stamp-cancelled text-stamp-cancelled line-through",
};

export function Stamp({
  status,
  label,
}: {
  status: keyof typeof colors;
  label: string;
}) {
  return (
    <span
      className={`inline-block -rotate-3 rounded border-2 border-double px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${colors[status]}`}
    >
      {label}
    </span>
  );
}
