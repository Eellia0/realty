import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { parsePropertyParam, propertyPath } from "@/lib/slug";
import { SITE_NAME, CURRENCY } from "@/lib/site";
import { thumbUrl } from "@/lib/images";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import {
  CATALOG_STATUSES, COMPLETION, FEATURES, FINISHING, FURNISHING, PROPERTY_TYPES, REGIONS, TITLE_DEEDS, TYPES_WITH_FLOOR,
  labelOf,
} from "@/lib/constants";
import {
  bedroomsLabel, formatArea, formatPrice, localFloor, pricePerMeter, propertyMeta, seaDistanceLabel,
} from "@/lib/format";
import { toMapPoint, withCover } from "@/lib/properties";
import { Gallery } from "@/components/Gallery";
import { FavoriteButton } from "@/components/FavoriteButton";
import { LeadForm } from "@/components/LeadForm";
import { PropertyCard } from "@/components/PropertyCard";
import { StatusBadge } from "@/components/StatusBadge";
import { PinIcon, WaveIcon } from "@/components/icons";
import { PropertiesMap } from "@/components/map";
import { ContactButtons } from "@/components/ContactButtons";
import { siteUrl } from "@/lib/site-url";
import { InstallmentBlock, DistancesBlock, VideoBlock } from "@/components/property/PropertyBlocks";
import { PlansGallery } from "@/components/property/PlansGallery";
import { installmentPlan } from "@/lib/installment";
import { parseNearby } from "@/lib/places";
import { videoEmbed } from "@/lib/video";

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

/** Короткое описание для поисковиков и превью ссылки: цена, планировка, место, море. */
function summary(p: NonNullable<Awaited<ReturnType<typeof loadProperty>>>) {
  return [
    formatPrice(p.price, p.dealType),
    `${labelOf(PROPERTY_TYPES, p.propertyType)}, ${propertyMeta(p)}`,
    [p.district, labelOf(REGIONS, p.region)].filter(Boolean).join(", "),
    seaDistanceLabel(p.seaDistance),
  ]
    .filter(Boolean)
    .join(" · ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await loadProperty((await params).id);
  if (!p) return {};
  const path = propertyPath(p);
  const short = summary(p);
  return {
    title: p.title,
    description: `${short}. ${p.description}`.slice(0, 200),
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName: SITE_NAME, locale: "ru_RU", title: p.title, description: short },
    twitter: { card: "summary_large_image", title: p.title, description: short },
    robots: p.status === "DRAFT" ? { index: false, follow: false } : undefined,
  };
}

export default async function PropertyPage({ params }: Props) {
  const param = (await params).id;
  const p = await loadProperty(param);
  if (!p) notFound();
  // Старые и устаревшие адреса (/property/12, прежнее название) ведут на актуальный.
  const path = propertyPath(p);
  if (`/property/${param}` !== path) permanentRedirect(path);

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

  const floor =
    TYPES_WITH_FLOOR.includes(p.propertyType) && p.floor != null
      ? `${localFloor(p.floor)}${p.floorsTotal ? ` из ${p.floorsTotal}` : ""}`
      : null;

  const facts: [string, string | null][] = [
    ["Тип", labelOf(PROPERTY_TYPES, p.propertyType)],
    ["Площадь", formatArea(p.area)],
    ["Планировка", bedroomsLabel(p.bedrooms)],
    ["Санузлы", p.bathrooms != null ? String(p.bathrooms) : null],
    ["Этаж", floor],
    ["Этажей в здании", !floor && p.floorsTotal ? String(p.floorsTotal) : null],
    ["Участок", p.plotArea ? formatArea(p.plotArea) : null],
    ["До моря", seaDistanceLabel(p.seaDistance)?.replace(" до моря", "") ?? null],
    ["Готовность", `${labelOf(COMPLETION, p.completion)}${p.completionDate ? `, ${p.completionDate}` : ""}`],
    ["Отделка и ремонт", p.finishing ? labelOf(FINISHING, p.finishing) : null],
    ["Мебель", p.furnishing ? labelOf(FURNISHING, p.furnishing) : null],
    ["Тип титула", p.titleDeed ? labelOf(TITLE_DEEDS, p.titleDeed) : null],
    ["Год постройки", p.yearBuilt ? String(p.yearBuilt) : null],
    ["Цена за м²", p.propertyType !== "LAND" ? pricePerMeter(p.price, p.area) : null],
  ];
  const sea = seaDistanceLabel(p.seaDistance);
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
  const waMessage = `Здравствуйте! Интересует объект «${p.title}», ${formatPrice(p.price, p.dealType)}. ${pageUrl}`;

  // Структурированные данные для поисковиков (schema.org). «<» экранируется, чтобы текст не закрыл тег script.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.title,
    description: summary(p),
    url: pageUrl,
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
      address: { "@type": "PostalAddress", streetAddress: p.address, addressLocality: p.district ?? undefined, addressRegion: labelOf(REGIONS, p.region) },
      geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
    },
  };
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <div className="container-page py-8">
      <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/catalog" className="text-sm font-medium text-muted hover:text-ink">← Назад в каталог</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <Gallery images={photos} title={p.title} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{p.title}</h1>
              {p.status !== "PUBLISHED" && <StatusBadge status={p.status} />}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-muted">
              <PinIcon className="h-4 w-4 shrink-0" />
              {[p.address, p.district, labelOf(REGIONS, p.region), "Северный Кипр"].filter(Boolean).join(", ")}
            </p>
            {(sea || p.seaView) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sea && (
                  <span className="badge bg-sea-soft text-sea">
                    <WaveIcon className="h-4 w-4" /> {sea}
                  </span>
                )}
                {p.seaView && <span className="badge bg-sea-soft text-sea">Вид на море</span>}
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
          {floor && (
            <p className="-mt-5 text-xs text-muted">
              На Кипре первый этаж считается нулевым. В скобках указан этаж в привычной нумерации.
            </p>
          )}

          {p.features.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Удобства</h2>
              <ul className="flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <li key={f} className="badge bg-accent-soft px-3 py-1.5 text-sm text-accent-dark">✓ {labelOf(FEATURES, f)}</li>
                ))}
              </ul>
            </section>
          )}

          {p.description && (
            <section>
              <h2 className="mb-3 text-xl font-bold">Описание</h2>
              <p className="leading-relaxed whitespace-pre-line text-ink/90">{p.description}</p>
            </section>
          )}

          {hasInstallment && (
            <InstallmentBlock price={p.price} down={p.installmentDownPercent!} months={p.installmentMonths!}
              rate={p.installmentRate} note={p.installmentNote} />
          )}

          {plans.length > 0 && <PlansGallery plans={plans} title={p.title} />}

          {video && <VideoBlock video={video} title={p.title} />}

          <DistancesBlock lat={p.lat} lng={p.lng} seaDistance={p.seaDistance} nearby={nearby} />

          <section>
            <h2 className="mb-3 text-xl font-bold">На карте</h2>
            <div className="card h-80 overflow-hidden">
              <PropertiesMap points={[toMapPoint({ ...p, images: p.images.filter((i) => i.kind === "PHOTO").slice(0, 1) })]} zoom={15} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <div className="text-3xl font-extrabold text-accent-dark">{formatPrice(p.price, p.dealType)}</div>
              {p.propertyType !== "LAND" && <div className="text-sm text-muted">{pricePerMeter(p.price, p.area)}</div>}
              {monthly != null && (
                <div className="mt-2 inline-flex rounded-lg bg-sun-soft px-2.5 py-1 text-sm font-semibold text-[#7a5210]">
                  Рассрочка от {formatPrice(monthly)} в месяц
                </div>
              )}
            </div>
            <FavoriteButton propertyId={p.id} initial={fav.has(p.id)} variant="full" />
            <ContactButtons message={waMessage} compact />
          </div>
          {p.status !== "SOLD" && (
            <div className="card space-y-3 p-5">
              <h2 className="font-bold">Записаться на просмотр</h2>
              <p className="text-sm text-muted">Оставьте контакты. Мы перезвоним и договоримся об онлайн- или очном показе.</p>
              <LeadForm propertyId={p.id} />
            </div>
          )}
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold">Похожие объекты</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => <PropertyCard key={s.id} p={s} isFavorite={fav.has(s.id)} />)}
          </div>
        </section>
      )}
    </div>
  );
}
