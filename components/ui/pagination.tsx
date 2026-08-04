import Link from "next/link";

export function Pagination({
  basePath,
  page,
  hasMore,
  previousLabel,
  nextLabel,
  query,
}: {
  basePath: string;
  page: number;
  hasMore: boolean;
  previousLabel: string;
  nextLabel: string;
  query?: string;
}) {
  if (page === 1 && !hasMore) return null;

  function href(targetPage: number) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between pt-1 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-accent hover:underline">
          ← {previousLabel}
        </Link>
      ) : (
        <span />
      )}
      {hasMore ? (
        <Link href={href(page + 1)} className="text-accent hover:underline">
          {nextLabel} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
