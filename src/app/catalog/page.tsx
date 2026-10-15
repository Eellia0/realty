import type { Metadata } from "next";
import { getCatalogPage, getCatalogPoints, parseFilters } from "@/lib/properties";
import { getFavoriteIds } from "@/lib/favorites";
import { CatalogFilters } from "@/components/CatalogFilters";
import { CatalogMapView } from "@/components/CatalogMapView";
import { PropertyCard } from "@/components/PropertyCard";
import { Pagination } from "@/components/Pagination";
import { ViewSwitch } from "@/components/ViewSwitch";

export const metadata: Metadata = {
  title: "Каталог недвижимости",
  description:
    "Квартиры, пентхаусы, виллы и участки на Северном Кипре: фильтры по расстоянию до моря, региону, отделке, рассрочке. Объекты на карте.",
  alternates: { canonical: "/catalog" },
};

function plural(n: number) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "объект";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "объекта";
  return "объектов";
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CatalogPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const favIds = await getFavoriteIds();
  const isMap = f.view === "map";

  const list = isMap ? null : await getCatalogPage(f);
  const points = isMap ? await getCatalogPoints(f) : null;
  const total = list?.total ?? points?.length ?? 0;
  const fav = new Set(favIds);

  return (
    // В режиме карты страница шире обычной, чтобы карта заняла почти всё окно.
    <div className={isMap ? "mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6" : "container-page py-8"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Каталог недвижимости</h1>
          <p className="mt-1 text-muted">
            Найдено {total} {plural(total)}
          </p>
        </div>
        <ViewSwitch f={f} />
      </div>

      <CatalogFilters f={f} />

      <div className="mt-6">
        {points && <CatalogMapView points={points} favIds={favIds} />}

        {list &&
          (list.items.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {list.items.map((p) => <PropertyCard key={p.id} p={p} isFavorite={fav.has(p.id)} />)}
              </div>
              <Pagination f={f} pages={list.pages} />
            </>
          ) : (
            <div className="card p-10 text-center text-muted">
              По этим параметрам ничего не нашлось. Попробуйте ослабить фильтры.
            </div>
          ))}
      </div>
    </div>
  );
}
