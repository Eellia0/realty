"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { MapBounds, MapPoint } from "@/lib/types";
import { PropertiesMap } from "./map";
import { FavoriteButton } from "./FavoriteButton";
import { ImagePlaceholder, WaveIcon } from "./icons";

const LIST_LIMIT = 150;

function inBounds(p: MapPoint, [[s, w], [n, e]]: MapBounds) {
  return p.lat >= s && p.lat <= n && p.lng >= w && p.lng <= e;
}

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "объект";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "объекта";
  return "объектов";
}

/* eslint-disable @next/next/no-img-element */
function CompactCard({ p, isFavorite }: { p: MapPoint; isFavorite: boolean }) {
  return (
    <div className="relative flex gap-3 rounded-2xl bg-surface p-2.5 ring-1 ring-line transition hover:shadow-soft hover:ring-accent/40">
      <Link href={p.href} className="h-24 w-28 shrink-0 overflow-hidden rounded-xl">
        {p.cover ? <img src={p.cover} alt="" loading="lazy" className="h-full w-full object-cover" /> : <ImagePlaceholder className="[&_svg]:h-8 [&_svg]:w-8" />}
      </Link>
      <Link href={p.href} className="min-w-0 flex-1 space-y-0.5 pr-8">
        <div className="font-extrabold text-accent-dark">{p.priceText}</div>
        <div className="truncate text-xs text-muted">{p.typeLabel} · {p.meta}</div>
        <div className="line-clamp-2 text-sm leading-snug font-semibold">{p.title}</div>
        {p.sea && (
          <div className="flex items-center gap-1 pt-0.5 text-xs font-medium text-sea">
            <WaveIcon className="h-3.5 w-3.5" /> {p.sea}
          </div>
        )}
      </Link>
      <div className="absolute top-2 right-2 scale-[0.8]">
        <FavoriteButton propertyId={p.id} initial={isFavorite} />
      </div>
    </div>
  );
}

/** Режим каталога «На карте»: карта почти на всю ширину и колонка объектов из видимой области. */
export function CatalogMapView({ points, favIds }: { points: MapPoint[]; favIds: number[] }) {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [hoverId, setHoverId] = useState<number | null>(null);
  const fav = useMemo(() => new Set(favIds), [favIds]);
  const visible = useMemo(() => (bounds ? points.filter((p) => inBounds(p, bounds)) : points), [points, bounds]);

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-7rem)] lg:flex-row">
      <div className="card h-[60vh] min-h-80 overflow-hidden lg:h-full lg:flex-1">
        <PropertiesMap points={points} onBoundsChange={setBounds} highlightId={hoverId} />
      </div>

      <aside className="flex flex-col lg:h-full lg:w-[25rem] lg:shrink-0">
        <div className="mb-3 flex items-baseline justify-between px-1">
          <span className="font-bold">
            {visible.length} {plural(visible.length)} в этой области
          </span>
          {bounds && visible.length < points.length && (
            <span className="text-xs text-muted">всего {points.length}</span>
          )}
        </div>

        {visible.length ? (
          <ul className="space-y-2.5 pr-1 lg:flex-1 lg:overflow-y-auto">
            {visible.slice(0, LIST_LIMIT).map((p) => (
              <li key={p.id} onMouseEnter={() => setHoverId(p.id)} onMouseLeave={() => setHoverId(null)}>
                <CompactCard p={p} isFavorite={fav.has(p.id)} />
              </li>
            ))}
            {visible.length > LIST_LIMIT && (
              <li className="py-3 text-center text-sm text-muted">Приблизьте карту, чтобы увидеть остальные объекты.</li>
            )}
          </ul>
        ) : (
          <div className="card p-6 text-center text-sm text-muted">
            В этой части карты объектов нет. Отдалите карту или сдвиньте её.
          </div>
        )}
      </aside>
    </div>
  );
}
