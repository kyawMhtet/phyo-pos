export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US").format(amount);
}

// Chart axes only — 1,250,000 → 1.3M.
export function formatMoneyCompact(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
