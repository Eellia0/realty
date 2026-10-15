import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { CATALOG_STATUSES, PROPERTY_TYPES, BEDROOM_OPTIONS, SEA_DISTANCE_OPTIONS } from "@/lib/constants";
import { getFavoriteIds } from "@/lib/favorites";
import { toMapPoint, withCover } from "@/lib/properties";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site-url";
import { getMoney } from "@/lib/currency";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageAlternates } from "@/i18n/alternates";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertiesMap } from "@/components/map";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: await languageAlternates("/") };
}

export default async function HomePage() {
  const where = { status: { in: CATALOG_STATUSES } };
  const [latest, all, favIds, total, money, { locale, t, lp }] = await Promise.all([
    db.property.findMany({ where, orderBy: { createdAt: "desc" }, take: 6, include: withCover }),
    db.property.findMany({ where, include: withCover }),
    getFavoriteIds(),
    db.property.count({ where }),
    getMoney(),
    getI18n(),
  ]);
  const fav = new Set(favIds);

  const quickLinks = [
    { href: "/catalog?sea=200", label: t.home.quickFirstLine },
    { href: "/catalog?type=PENTHOUSE", label: t.home.quickPenthouses },
    { href: "/catalog?type=VILLA", label: t.home.quickVillas },
    { href: "/catalog?completion=UNDER_CONSTRUCTION", label: t.home.quickNewBuilds },
    { href: "/catalog?feat=POOL_PRIVATE", label: t.home.quickPrivatePool },
  ];

  // Сведения об агентстве для поисковиков (schema.org). Пустые контакты не попадают.
  const [settings, base, nonce] = await Promise.all([getSettings(), siteUrl(), headers().then((h) => h.get("x-nonce") ?? undefined)]);
  const jsonLd = Object.fromEntries(
    Object.entries({
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: t.meta.siteName,
      url: `${base}${lp("/")}`,
      description: t.meta.description,
      areaServed: t.home.badge,
      telephone: settings.phone,
      email: settings.email,
      address: (locale === "en" && settings.addressEn) || settings.address,
    }).filter(([, v]) => v),
  );

  return (
    <>
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="container-page pt-8 pb-8 sm:pt-12">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent-dark via-accent to-sea px-6 py-12 text-white sm:px-12 sm:py-16">
          {/* Декоративные волны */}
          <svg aria-hidden viewBox="0 0 1200 200" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full text-white/10">
            <path fill="currentColor" d="M0 120c150-40 300-40 450 0s300 40 450 0 225-50 300-30v110H0Z" />
            <path fill="currentColor" d="M0 160c200-30 350-30 550 0s350 30 650-10v50H0Z" />
          </svg>

          <div className="relative">
            <span className="badge bg-white/15 text-white backdrop-blur">{t.home.badge}</span>
            <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-extrabold tracking-tight sm:text-5xl">{t.home.title}</h1>
            <p className="mt-4 max-w-xl text-white/85 sm:text-lg">{t.home.lead}</p>

            <Form action={lp("/catalog")} className="mt-8 grid max-w-4xl gap-2 rounded-2xl bg-surface p-2.5 text-ink shadow-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
              <select name="type" defaultValue="" className="input border-0 bg-bg" aria-label={t.filters.type}>
                <option value="">{t.home.anyType}</option>
                {Object.keys(PROPERTY_TYPES).map((k) => <option key={k} value={k}>{t.labels.propertyTypes[k]}</option>)}
              </select>
              <select name="bedrooms" defaultValue="" className="input border-0 bg-bg" aria-label={t.home.bedrooms}>
                <option value="">{t.home.bedrooms}</option>
                {BEDROOM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t.labels.bedrooms[o.value]}</option>)}
              </select>
              <select name="sea" defaultValue="" className="input border-0 bg-bg" aria-label={t.filters.sea}>
                <option value="">{t.home.seaAny}</option>
                {SEA_DISTANCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{t.labels.sea[o.value]}</option>)}
              </select>
              <input name="priceMax" inputMode="numeric" placeholder={fmt(t.home.priceTo, { symbol: money.symbol })} className="input border-0 bg-bg" />
              <input type="hidden" name="cur" value={money.code} />
              <button className="btn btn-primary px-6">{t.home.search}</button>
            </Form>

            <div className="mt-5 flex flex-wrap gap-2">
              {quickLinks.map((l) => (
                <Link key={l.href} href={lp(l.href)} className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium backdrop-blur transition hover:bg-white/25">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">{t.home.latest}</h2>
          <Link href={lp("/catalog")} className="text-sm font-semibold text-accent-dark hover:underline">
            {fmt(t.home.all, { n: total })}
          </Link>
        </div>
        {latest.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((p) => <PropertyCard key={p.id} p={p} isFavorite={fav.has(p.id)} />)}
          </div>
        ) : (
          <p className="text-muted">{t.home.empty}</p>
        )}
      </section>

      {all.length > 0 && (
        <section className="container-page py-8">
          <h2 className="mb-6 text-2xl font-bold">{t.home.onMap}</h2>
          <div className="card h-[28rem] overflow-hidden">
            <PropertiesMap points={all.map((p) => toMapPoint(p, money))} />
          </div>
        </section>
      )}
    </>
  );
}
