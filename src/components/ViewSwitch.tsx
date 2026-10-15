import Link from "next/link";
import { filtersToQuery, type CatalogFilters } from "@/lib/properties";

function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinejoin="round" d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6 9 4Z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}

/** Переключатель «Списком / На карте». Фильтры при переключении сохраняются. */
export function ViewSwitch({ f }: { f: CatalogFilters }) {
  const item = (view: "list" | "map", label: string, icon: React.ReactNode) => {
    const active = f.view === view;
    return (
      <Link
        href={`/catalog${filtersToQuery(f, { view, page: 1 })}`}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
          active ? "bg-accent text-white shadow-sm" : "text-muted hover:text-ink"
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };
  return (
    <div className="inline-flex rounded-xl bg-surface p-1 shadow-soft ring-1 ring-line">
      {item("list", "Списком", <ListIcon />)}
      {item("map", "На карте", <MapIcon />)}
    </div>
  );
}
