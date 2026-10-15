import type { Money } from "@/lib/money";
import { installmentPlan, monthsLabel } from "@/lib/installment";
import { formatDistance, keyPlaceDistances, type NearbyPlace } from "@/lib/places";
import type { VideoEmbed } from "@/lib/video";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { BuildingIcon, PinIcon, PlaneIcon, WaveIcon } from "../icons";

// Блоки страницы объекта. Каждый показывается, только если в объекте есть данные.

export async function InstallmentBlock({ price, down, months, rate, note, money }: {
  price: number; down: number; months: number; rate: number | null; note: string | null; money: Money;
}) {
  const { locale, t } = await getI18n();
  const plan = installmentPlan(price, down, months, rate);
  if (!plan) return null;
  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-sun/40">
      <div className="flex items-center justify-between gap-3 bg-sun-soft px-5 py-3">
        <h2 className="text-lg font-bold">{t.installment.title}</h2>
        <span className="badge bg-sun text-ink">{rate ? fmt(t.installment.rate, { rate }) : t.installment.noInterest}</span>
      </div>
      <div className="grid gap-4 bg-surface p-5 sm:grid-cols-3">
        <div>
          <div className="text-sm text-muted">{fmt(t.installment.down, { percent: down })}</div>
          <div className="mt-1 text-xl font-extrabold">{money.format(plan.down)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">{t.installment.monthly}</div>
          <div className="mt-1 text-xl font-extrabold text-accent-dark">{money.format(plan.monthly)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">{t.installment.term}</div>
          <div className="mt-1 text-xl font-extrabold">{monthsLabel(plan.months, locale)}</div>
        </div>
        {(note || plan.overpay > 1) && (
          <p className="text-sm text-muted sm:col-span-3">
            {note}
            {note && plan.overpay > 1 ? " " : ""}
            {plan.overpay > 1 ? fmt(t.installment.overpay, { overpay: money.format(plan.overpay), total: money.format(plan.total) }) : ""}
          </p>
        )}
      </div>
    </section>
  );
}

export async function DistancesBlock({ lat, lng, seaDistance, nearby }: {
  lat: number; lng: number; seaDistance: number | null; nearby: NearbyPlace[];
}) {
  const { locale, t } = await getI18n();
  const places = keyPlaceDistances(lat, lng);
  const custom = [...nearby].sort((a, b) => a.distance - b.distance);
  // Типовые места из подсказок админки переводятся, остальные показываются как введены.
  const placeName = (name: string) => t.distances.nearbyNames[name] ?? name;
  const Row = ({ icon, name, value, accent }: { icon: React.ReactNode; name: string; value: string; accent: string }) => (
    <li className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-line">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="font-semibold whitespace-nowrap">{value}</span>
    </li>
  );

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{t.distances.title}</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {seaDistance != null && (
          <Row icon={<WaveIcon className="h-5 w-5" />} name={t.distances.sea} value={formatDistance(seaDistance, locale)} accent="bg-sea-soft text-sea" />
        )}
        {custom.map((p) => (
          <Row key={p.name} icon={<PinIcon className="h-5 w-5" />} name={placeName(p.name)} value={formatDistance(p.distance, locale)} accent="bg-accent-soft text-accent-dark" />
        ))}
        {places.map((p) => (
          <Row
            key={p.key}
            icon={p.kind === "airport" ? <PlaneIcon className="h-5 w-5" /> : <BuildingIcon className="h-5 w-5" />}
            name={t.distances.places[p.key] ?? p.name}
            value={`≈ ${formatDistance(p.distance, locale)}`}
            accent="bg-warm text-ink"
          />
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">{t.distances.note}</p>
    </section>
  );
}

export async function VideoBlock({ video, title }: { video: VideoEmbed; title: string }) {
  const { t } = await getI18n();
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">{t.video.title}</h2>
      <div className="aspect-video overflow-hidden rounded-2xl bg-ink ring-1 ring-line">
        <iframe
          src={video.src}
          title={fmt(t.video.frameTitle, { title })}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
