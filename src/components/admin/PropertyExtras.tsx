"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import { installmentPlan, monthsLabel } from "@/lib/installment";
import { formatDistance, keyPlaceDistances, type NearbyPlace } from "@/lib/places";
import { videoEmbed } from "@/lib/video";

const num = (s: string) => {
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return s.trim() === "" || !Number.isFinite(n) ? null : n;
};

// ---------- Рассрочка ----------

export type InstallmentValues = {
  installment: boolean;
  installmentDownPercent: number | null;
  installmentMonths: number | null;
  installmentRate: number | null;
  installmentNote: string;
};

export function InstallmentFields({ initial, price }: { initial: InstallmentValues; price: string }) {
  const [on, setOn] = useState(initial.installment);
  const [down, setDown] = useState(initial.installmentDownPercent?.toString() ?? "");
  const [months, setMonths] = useState(initial.installmentMonths?.toString() ?? "");
  const [rate, setRate] = useState(initial.installmentRate?.toString() ?? "");

  const plan = useMemo(() => {
    const p = num(price), d = num(down), m = num(months);
    return p != null && d != null && m != null ? installmentPlan(p, d, Math.round(m), num(rate)) : null;
  }, [price, down, months, rate]);

  return (
    <div className="space-y-4">
      <label className="check w-fit">
        <input type="checkbox" name="installment" checked={on} onChange={(e) => setOn(e.target.checked)} className="accent-accent" />
        Продаётся в рассрочку
      </label>

      {on && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="installmentDownPercent">Первый взнос, %</label>
              <input id="installmentDownPercent" name="installmentDownPercent" inputMode="numeric" value={down}
                onChange={(e) => setDown(e.target.value)} className="input" placeholder="35" />
            </div>
            <div>
              <label className="label" htmlFor="installmentMonths">Срок, месяцев</label>
              <input id="installmentMonths" name="installmentMonths" inputMode="numeric" value={months}
                onChange={(e) => setMonths(e.target.value)} className="input" placeholder="24" />
            </div>
            <div>
              <label className="label" htmlFor="installmentRate">Ставка, % годовых</label>
              <input id="installmentRate" name="installmentRate" inputMode="decimal" value={rate}
                onChange={(e) => setRate(e.target.value)} className="input" placeholder="0 — без процентов" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="installmentNote">Условия своими словами</label>
            <input id="installmentNote" name="installmentNote" maxLength={300} defaultValue={initial.installmentNote} className="input"
              placeholder="Например: последний платёж при получении ключей" />
          </div>
          <p className="rounded-xl bg-sun-soft px-3 py-2 text-sm text-[#7a5210]">
            {plan
              ? `На сайте: первый взнос ${formatPrice(plan.down)}, затем ${formatPrice(plan.monthly)} в месяц, ${monthsLabel(plan.months)}${
                  plan.overpay > 1 ? `, переплата ${formatPrice(plan.overpay)}` : ", без процентов"
                }.`
              : "Заполните цену, первый взнос и срок, чтобы увидеть расчёт."}
          </p>
        </>
      )}
    </div>
  );
}

// ---------- Расстояния ----------

type Row = { name: string; value: string; unit: "m" | "km" };

const SUGGESTIONS = ["Пляж", "Супермаркет", "Школа", "Детский сад", "Больница", "Аптека", "Ресторан", "Остановка автобуса", "Торговый центр", "Гольф-клуб", "Университет", "Набережная"];

function toRows(list: NearbyPlace[]): Row[] {
  return list.map((p) =>
    p.distance >= 1000 && p.distance % 100 === 0
      ? { name: p.name, value: String(p.distance / 1000).replace(".", ","), unit: "km" }
      : { name: p.name, value: String(p.distance), unit: "m" },
  );
}

export function NearbyEditor({ initial, coords }: { initial: NearbyPlace[]; coords: { lat: number; lng: number } | null }) {
  const [rows, setRows] = useState<Row[]>(toRows(initial));
  const auto = coords ? keyPlaceDistances(coords.lat, coords.lng) : [];

  // В базу уходит расстояние в метрах; строки без названия или расстояния пропускаются.
  const value: NearbyPlace[] = rows.flatMap((r) => {
    const name = r.name.trim();
    const d = num(r.value);
    return name && d != null && d >= 0 ? [{ name, distance: Math.round(d * (r.unit === "km" ? 1000 : 1)) }] : [];
  });

  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-4">
      <input type="hidden" name="nearby" value={JSON.stringify(value)} />

      <div>
        <span className="label">Считаются автоматически по метке на карте</span>
        {auto.length ? (
          <div className="flex flex-wrap gap-2">
            {auto.map((p) => (
              <span key={p.key} className="chip bg-sea-soft text-sea">
                {p.name}: {formatDistance(p.distance)}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Поставьте метку на карте выше, и здесь появятся расстояния до аэропортов и городов.</p>
        )}
      </div>

      <div className="space-y-2">
        <span className="label">Свои места рядом</span>
        <datalist id="nearby-suggestions">
          {SUGGESTIONS.map((s) => <option key={s} value={s} />)}
        </datalist>
        {rows.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input list="nearby-suggestions" value={r.name} onChange={(e) => update(i, { name: e.target.value })} maxLength={60}
              placeholder="Например: Супермаркет" className="input flex-1" aria-label="Название места" />
            <input value={r.value} onChange={(e) => update(i, { value: e.target.value })} inputMode="decimal" placeholder="300"
              className="input w-24" aria-label="Расстояние" />
            <select value={r.unit} onChange={(e) => update(i, { unit: e.target.value as Row["unit"] })} className="input w-20" aria-label="Единица">
              <option value="m">м</option>
              <option value="km">км</option>
            </select>
            <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} className="btn btn-danger px-3" aria-label="Убрать место">
              ×
            </button>
          </div>
        ))}
        {rows.length < 12 && (
          <button type="button" onClick={() => setRows((rs) => [...rs, { name: "", value: "", unit: "m" }])} className="btn btn-secondary">
            + Добавить место
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Видео ----------

export function VideoField({ initial }: { initial: string }) {
  const [url, setUrl] = useState(initial);
  const embed = url.trim() ? videoEmbed(url) : null;
  return (
    <div>
      <label className="label" htmlFor="videoUrl">Ссылка на видео</label>
      <input id="videoUrl" name="videoUrl" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={300} className="input"
        placeholder="https://youtu.be/… , https://rutube.ru/video/… или https://vkvideo.ru/video-…" />
      <p className={`mt-1 text-xs ${url.trim() && !embed ? "text-danger" : "text-muted"}`}>
        {!url.trim()
          ? "Необязательно. Если ссылки нет, блок видео на странице объекта не показывается."
          : embed
            ? `✓ ${embed.provider}: видео появится на странице объекта`
            : "Такую ссылку встроить нельзя. Подходят YouTube, RuTube и VK Видео."}
      </p>
    </div>
  );
}
