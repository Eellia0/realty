import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { parsePropertyParam, propertyBasePath, propertyPath } from "@/lib/slug";
import { CURRENCY } from "@/lib/site";
import { thumbUrl } from "@/lib/images";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { CATALOG_STATUSES, TYPES_WITH_FLOOR } from "@/lib/constants";
import {
  bedroomsLabel, floorFact, formatArea, formatDistance, formatPrice, propertyMeta, seaDistanceLabel,
} from "@/lib/format";
import { toMapPoint, withCover } from "@/lib/properties";
import { siteUrl } from "@/lib/site-url";
import { installmentPlan } from "@/lib/installment";
import { parseNearby } from "@/lib/places";
import { videoEmbed } from "@/lib/video";
import { getMoney } from "@/lib/currency";
import { CURRENCY_CODES, createMoney, rateDateLabel } from "@/lib/money";
import { placeLine, propertyTexts } from "@/lib/localize";
import { fmt, type Locale } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { languageAlternates } from "@/i18n/alternates";
import type { Messages } from "@/i18n/messages/ru";
import { Gallery } from "@/components/Gallery";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LeadForm } from "@/components/LeadForm";
import { PropertyCard } from "@/components/PropertyCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PinIcon, WaveIcon } from "@/components/icons";
import { PropertiesMap } from "@/components/map";
import { ContactButtons } from "@/components/ContactButtons";
import { InstallmentBlock, DistancesBlock, VideoBlock } from "@/components/property/PropertyBlocks";
import { PlansGallery } from "@/components/property/PlansGallery";

type Props = { params: Promise<{ id: string }> };

// Объект читается один раз за запрос: и для метаданных, и для страницы.
const loadProperty = cache(async (param: string) => {
  const id = parsePropertyParam(param);
  if (!id) return null;
  const property = await db.property.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!property) return null;
  // Черновики видит только администратор.
  if (property.status === "DRAFT" && (await getCurrentUser())?.role !== "ADMIN") return null;
  return property;
});

type Loaded = NonNullable<Awaited<ReturnType<typeof loadProperty>>>;

/** Короткое описание для поисковиков и превью ссылки: цена, планировка, место, море. */
function summary(p: Loaded, locale: Locale, t: Messages) {
  const x = propertyTexts(p, locale, t);
  return [
    formatPrice(p.price, p.dealType, locale),
    `${x.typeLabel}, ${propertyMeta(p, locale)}`,
    placeLine(p, locale, t),
    seaDistanceLabel(p.seaDistance, locale),
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await loadProperty((await params).id);
  if (!p) return {};
  const { locale, t, lp } = await getI18n();
  const x = propertyTexts(p, locale, t);
  const short = summary(p, locale, t);
  const path = propertyPath(p, locale);
  const ogImage = { url: lp(`/og/property/${p.id}`), width: 1200, height: 630, alt: x.title };
  return {
    title: x.title,
    description: `${short}. ${x.description}`.slice(0, 200),
    alternates: await languageAlternates(path, { ru: propertyPath(p, "ru"), en: propertyPath(p, "en") }),
    openGraph: { type: "website", url: path, siteName: t.meta.siteName, locale: t.meta.ogLocale, title: x.title, description: short, images: [ogImage] },
    twitter: { card: "summary_large_image", title: x.title, description: short, images: [ogImage.url] },
    robots: p.status === "DRAFT" ? { index: false, follow: false } : undefined,
  };
}

export default async function PropertyPage({ params }: Props) {
  const param = (await params).id;
  const p = await loadProperty(param);
  if (!p) notFound();
  const { locale, t, lp } = await getI18n();
  // Старые и устаревшие адреса (/property/12, прежнее название) ведут на актуальный.
  if (`/property/${param}` !== propertyBasePath(p, locale)) permanentRedirect(propertyPath(p, locale));
  const path = propertyPath(p, locale);
  const money = await getMoney();
  const x = propertyTexts(p, locale, t);
  const L = t.labels;

  const [favIds, similar] = await Promise.all([
    getFavoriteIds(),
    db.property.findMany({
      where: {
        id: { not: p.id },
        status: { in: CATALOG_STATUSES },
        dealType: p.dealType,
        propertyType: p.propertyType,
        price: { gte: p.price * 0.6, lte: p.price * 1.4 },
      },
      take: 3,
      include: withCover,
    }),
  ]);
  const fav = new Set(favIds);

  const floor = TYPES_WITH_FLOOR.includes(p.propertyType) && p.floor != null ? floorFact(p.floor, p.floorsTotal, locale) : null;

  const facts: [string, string | null][] = [
    [t.property.factType, x.typeLabel],
    [t.property.factArea, formatArea(p.area, locale)],
    [t.property.factLayout, bedroomsLabel(p.bedrooms, locale)],
    [t.property.factBaths, p.bathrooms != null ? String(p.bathrooms) : null],
    [t.property.factFloor, floor],
    [t.property.factFloors, !floor && p.floorsTotal ? String(p.floorsTotal) : null],
    [t.property.factPlot, p.plotArea ? formatArea(p.plotArea, locale) : null],
    [t.property.factSea, p.seaDistance != null ? formatDistance(p.seaDistance, locale) : null],
    [t.property.factCompletion, `${L.completion[p.completion] ?? p.completion}${p.completionDate ? `, ${p.completionDate}` : ""}`],
    [t.property.factFinishing, p.finishing ? (L.finishing[p.finishing] ?? p.finishing) : null],
    [t.property.factFurnishing, p.furnishing ? (L.furnishing[p.furnishing] ?? p.furnishing) : null],
    [t.property.factTitle, p.titleDeed ? (L.titleDeeds[p.titleDeed] ?? p.titleDeed) : null],
    [t.property.factYear, p.yearBuilt ? String(p.yearBuilt) : null],
    [t.property.factPerMeter, p.propertyType !== "LAND" ? money.perMeter(p.price, p.area) : null],
  ];
  const sea = seaDistanceLabel(p.seaDistance, locale);
  const photos = p.images.filter((i) => i.kind === "PHOTO").map((i) => i.url);
  const plans = p.images.filter((i) => i.kind === "PLAN").map((i) => i.url);
  const video = videoEmbed(p.videoUrl);
  const nearby = parseNearby(p.nearby);
  const hasInstallment = p.installment && p.installmentDownPercent != null && p.installmentMonths != null;
  const monthly = hasInstallment
    ? installmentPlan(p.price, p.installmentDownPercent!, p.installmentMonths!, p.installmentRate)?.monthly
    : undefined;
  const base = await siteUrl();
  const pageUrl = `${base}${path}`;
  const waMessage = fmt(t.property.waMessage, { title: x.title, price: formatPrice(p.price, p.dealType, locale), url: pageUrl });

  // Структурированные данные для поисковиков (schema.org). «<» экранируется, чтобы текст не закрыл тег script.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: x.title,
    description: summary(p, locale, t),
    url: pageUrl,
    inLanguage: locale,
    datePosted: p.createdAt.toISOString(),
    image: photos.slice(0, 5).map((u) => `${base}${thumbUrl(u)}`),
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: CURRENCY.code,
      availability: p.status === "SOLD" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
    contentLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", streetAddress: x.address, addressLocality: x.district ?? undefined, addressRegion: x.region },
      geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
    },
  };
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href={lp("/catalog")} className="text-sm font-medium text-muted hover:text-ink">{t.property.back}</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <Gallery images={photos} title={x.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{x.title}</h1>
              {p.status !== "PUBLISHED" && <StatusBadge status={p.status} label={L.statuses[p.status]} />}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <PinIcon className="h-4 w-4 shrink-0" />
              {[x.address, x.district, x.region, t.property.country].filter(Boolean).join(", ")}
            </p>
            {(sea || p.seaView) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sea && (
                  <span className="badge bg-sea-soft text-sea">
                    <WaveIcon className="h-4 w-4" /> {sea}
                  </span>
                )}
                {p.seaView && <span className="badge bg-sea-soft text-sea">{t.card.seaView}</span>}
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {facts
              .filter((f): f is [string, string] => Boolean(f[1]))
              .map(([k, val]) => (
                <div key={k} className="rounded-2xl bg-surface p-4 ring-1 ring-line">
                  <dt className="text-sm text-muted">{k}</dt>
                  <dd className="mt-1 font-semibold">{val}</dd>
                </div>
              ))}
          </dl>
          {floor && t.property.floorNote && <p className="-mt-5 text-xs text-muted">{t.property.floorNote}</p>}

          {p.features.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">{t.property.amenities}</h2>
              <ul className="flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <li key={f} className="badge bg-accent-soft px-3 py-1.5 text-sm text-accent-dark">✓ {L.features[f] ?? f}</li>
                ))}
              </ul>
            </section>
          )}

          {x.description && (
            <section>
              <h2 className="mb-3 text-xl font-bold">{t.property.description}</h2>
              <p className="leading-relaxed whitespace-pre-line text-ink/90">{x.description}</p>
            </section>
          )}

          {hasInstallment && (
            <InstallmentBlock price={p.price} down={p.installmentDownPercent!} months={p.installmentMonths!}
              rate={p.installmentRate} note={x.installmentNote} money={money} />
          )}

          {plans.length > 0 && <PlansGallery plans={plans} title={x.title} />}

          {video && <VideoBlock video={video} title={x.title} />}

          <DistancesBlock lat={p.lat} lng={p.lng} seaDistance={p.seaDistance} nearby={nearby} />

          <section>
            <h2 className="mb-3 text-xl font-bold">{t.property.onMap}</h2>
            <div className="card h-80 overflow-hidden">
              <PropertiesMap points={[toMapPoint({ ...p, images: p.images.filter((i) => i.kind === "PHOTO").slice(0, 1) }, money)]} zoom={15} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <div className="text-3xl font-extrabold text-accent-dark">{money.format(p.price, p.dealType)}</div>
              {p.propertyType !== "LAND" && <div className="text-sm text-muted">{money.perMeter(p.price, p.area)}</div>}
              {money.rates && (
                <div className="mt-3 space-y-0.5 border-t border-line pt-3 text-sm text-muted">
                  {CURRENCY_CODES.filter((c) => c !== money.code).map((c) => (
                    <div key={c}>{createMoney(c, money.rates, false, locale).format(p.price, p.dealType)}</div>
                  ))}
                  <div className="text-xs">{fmt(t.property.ratesNote, { date: rateDateLabel(money.rates.date, locale) })}</div>
                </div>
              )}
              {monthly != null && (
                <div className="mt-2 inline-flex rounded-lg bg-sun-soft px-2.5 py-1 text-sm font-semibold text-[#7a5210]">
                  {fmt(t.property.installmentFrom, { amount: money.format(monthly) })}
                </div>
              )}
            </div>
            <FavoriteButton propertyId={p.id} initial={fav.has(p.id)} variant="full" />
            <ContactButtons message={waMessage} compact />
          </div>
          {p.status !== "SOLD" && (
            <div className="card space-y-3 p-5">
              <h2 className="font-bold">{t.property.viewingTitle}</h2>
              <p className="text-sm text-muted">{t.property.viewingText}</p>
              <LeadForm propertyId={p.id} />
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">{t.property.similar}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => <PropertyCard key={s.id} p={s} isFavorite={fav.has(s.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
