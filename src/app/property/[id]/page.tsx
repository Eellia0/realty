import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import {
  CATALOG_STATUSES, COMPLETION, FEATURES, FINISHING, FURNISHING, PROPERTY_TYPES, REGIONS, TITLE_DEEDS, TYPES_WITH_FLOOR,
  labelOf,
} from "@/lib/constants";
import {
  bedroomsLabel, formatArea, formatPrice, localFloor, pricePerMeter, seaDistanceLabel,
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

type Props = { params: Promise<{ id: string }> };

async function loadProperty(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  const property = await db.property.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!property) return null;
  // Черновики видит только администратор.
  if (property.status === "DRAFT" && (await getCurrentUser())?.role !== "ADMIN") return null;
  return property;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await loadProperty((await params).id);
  return p ? { title: p.title, description: p.description.slice(0, 160) } : {};
}

export default async function PropertyPage({ params }: Props) {
  const p = await loadProperty((await params).id);
  if (!p) notFound();

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
  const pageUrl = `${await siteUrl()}/property/${p.id}`;
  const waMessage = `Здравствуйте! Интересует объект «${p.title}», ${formatPrice(p.price, p.dealType)}. ${pageUrl}`;

  return (
    <div className="container-page py-8">
      <Link href="/catalog" className="text-sm font-medium text-muted hover:text-ink">← Назад в каталог</Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-8">
          <Gallery images={p.images.map((i) => i.url)} title={p.title} />

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

          <section>
            <h2 className="mb-3 text-xl font-bold">На карте</h2>
            <div className="card h-80 overflow-hidden">
              <PropertiesMap points={[toMapPoint({ ...p, images: p.images.slice(0, 1) })]} zoom={15} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <div>
              <div className="text-3xl font-extrabold text-accent-dark">{formatPrice(p.price, p.dealType)}</div>
              {p.propertyType !== "LAND" && <div className="text-sm text-muted">{pricePerMeter(p.price, p.area)}</div>}
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
