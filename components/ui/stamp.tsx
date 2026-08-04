const colors = {
  pending: "bg-stamp-pending/15 text-stamp-pending",
  paid: "bg-stamp-paid/15 text-stamp-paid",
  delivered: "bg-stamp-delivered/15 text-stamp-delivered",
  cancelled: "bg-stamp-cancelled/15 text-stamp-cancelled line-through",
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
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colors[status]}`}
    >
      {label}
    </span>
  );
}
