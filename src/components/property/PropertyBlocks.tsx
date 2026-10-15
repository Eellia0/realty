import type { Money } from "@/lib/money";
import { installmentPlan, monthsLabel } from "@/lib/installment";
import { formatDistance, keyPlaceDistances, type NearbyPlace } from "@/lib/places";
import type { VideoEmbed } from "@/lib/video";
import { BuildingIcon, PinIcon, PlaneIcon, WaveIcon } from "../icons";

// Блоки страницы объекта. Каждый показывается, только если в объекте есть данные.

export function InstallmentBlock({ price, down, months, rate, note, money }: {
  price: number; down: number; months: number; rate: number | null; note: string | null; money: Money;
}) {
  const plan = installmentPlan(price, down, months, rate);
  if (!plan) return null;
  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-sun/40">
      <div className="flex items-center justify-between gap-3 bg-sun-soft px-5 py-3">
        <h2 className="text-lg font-bold">Рассрочка</h2>
        <span className="badge bg-sun text-ink">{rate ? `${rate}% годовых` : "Без процентов"}</span>
      </div>
      <div className="grid gap-4 bg-surface p-5 sm:grid-cols-3">
        <div>
          <div className="text-sm text-muted">Первый взнос, {down}%</div>
          <div className="mt-1 text-xl font-extrabold">{money.format(plan.down)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">Платёж в месяц</div>
          <div className="mt-1 text-xl font-extrabold text-accent-dark">{money.format(plan.monthly)}</div>
        </div>
        <div>
          <div className="text-sm text-muted">Срок</div>
          <div className="mt-1 text-xl font-extrabold">{monthsLabel(plan.months)}</div>
        </div>
        {(note || plan.overpay > 1) && (
          <p className="text-sm text-muted sm:col-span-3">
            {note}
            {note && plan.overpay > 1 ? " " : ""}
            {plan.overpay > 1 ? `Переплата за весь срок ${money.format(plan.overpay)}, итого ${money.format(plan.total)}.` : ""}
          </p>
        )}
      </div>
    </section>
  );
}

export function DistancesBlock({ lat, lng, seaDistance, nearby }: {
  lat: number; lng: number; seaDistance: number | null; nearby: NearbyPlace[];
}) {
  const places = keyPlaceDistances(lat, lng);
  const custom = [...nearby].sort((a, b) => a.distance - b.distance);
  const Row = ({ icon, name, value, accent }: { icon: React.ReactNode; name: string; value: string; accent: string }) => (
    <li className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-line">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span className="font-semibold whitespace-nowrap">{value}</span>
    </li>
  );

  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">Расстояния</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {seaDistance != null && (
          <Row icon={<WaveIcon className="h-5 w-5" />} name="Море" value={formatDistance(seaDistance)} accent="bg-sea-soft text-sea" />
        )}
        {custom.map((p) => (
          <Row key={p.name} icon={<PinIcon className="h-5 w-5" />} name={p.name} value={formatDistance(p.distance)} accent="bg-accent-soft text-accent-dark" />
        ))}
        {places.map((p) => (
          <Row
            key={p.key}
            icon={p.kind === "airport" ? <PlaneIcon className="h-5 w-5" /> : <BuildingIcon className="h-5 w-5" />}
            name={p.name}
            value={`≈ ${formatDistance(p.distance)}`}
            accent="bg-warm text-ink"
          />
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">До аэропортов и городов указано расстояние по прямой. По дорогам обычно на 20–40% больше.</p>
    </section>
  );
}

export function VideoBlock({ video, title }: { video: VideoEmbed; title: string }) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-bold">Видео</h2>
      <div className="aspect-video overflow-hidden rounded-2xl bg-ink ring-1 ring-line">
        <iframe
          src={video.src}
          title={`Видео: ${title}`}
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
