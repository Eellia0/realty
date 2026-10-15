import type { Metadata } from "next";
import { getCatalogPage, getCatalogPoints, parseFilters } from "@/lib/properties";
import { getFavoriteIds } from "@/lib/favorites";
import { getMoney } from "@/lib/currency";
import { fmt, objectsWord } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageAlternates } from "@/i18n/alternates";
import { CatalogFilters } from "@/components/CatalogFilters";
import { CatalogMapView } from "@/components/CatalogMapView";
import { PropertyCard } from "@/components/PropertyCard";
import { Pagination } from "@/components/Pagination";
import { ViewSwitch } from "@/components/ViewSwitch";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.catalog, description: t.meta.catalogDescription, alternates: await languageAlternates("/catalog") };
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CatalogPage({ searchParams }: Props) {
  const f = parseFilters(await searchParams);
  const [favIds, money, { locale, t }] = await Promise.all([getFavoriteIds(), getMoney(), getI18n()]);
  const isMap = f.view === "map";

  const list = isMap ? null : await getCatalogPage(f, money.rates);
  const points = isMap ? await getCatalogPoints(f, money) : null;
  const total = list?.total ?? points?.length ?? 0;
  const fav = new Set(favIds);

  return (
    // В режиме карты страница шире обычной, чтобы карта заняла почти всё окно.
    <div className={isMap ? "mx-auto w-full max-w-[1920px] px-4 py-6 sm:px-6" : "container-page py-8"}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t.catalog.title}</h1>
          <p className="mt-1 text-muted">{fmt(t.catalog.found, { n: total, objects: objectsWord(total, locale) })}</p>
        </div>
        <ViewSwitch f={f} />
      </div>

      <CatalogFilters f={f} money={money} />

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
            <div className="card p-10 text-center text-muted">{t.catalog.empty}</div>
          ))}
      </div>
    </div>
  );
}
