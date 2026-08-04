export const PAGE_SIZE = 20;

export function parsePage(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}
