import Link from "next/link";
import { filtersToQuery, type CatalogFilters } from "@/lib/properties";

export function Pagination({ f, pages }: { f: CatalogFilters; pages: number }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - f.page) <= 2,
  );

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Страницы">
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={`/catalog${filtersToQuery(f, { page: n })}`}
            aria-current={n === f.page ? "page" : undefined}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold ${
              n === f.page ? "bg-accent text-white" : "bg-surface ring-1 ring-line hover:bg-warm"
            }`}
          >
            {n}
          </Link>
        </span>
      ))}
    </nav>
  );
}
