import Link from "next/link";

export function Pagination({
  basePath,
  page,
  hasMore,
  previousLabel,
  nextLabel,
  params = {},
}: {
  basePath: string;
  page: number;
  hasMore: boolean;
  previousLabel: string;
  nextLabel: string;
  params?: Record<string, string | undefined>;
}) {
  if (page === 1 && !hasMore) return null;

  function href(targetPage: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (targetPage > 1) search.set("page", String(targetPage));
    const qs = search.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <div className="flex items-center justify-between pt-1 text-sm font-medium">
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
