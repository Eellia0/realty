import Form from "next/form";
import Link from "next/link";
import {
  BEDROOM_OPTIONS, COMPLETION, FEATURES, FINISHING, FURNISHING, PROPERTY_TYPES, REGIONS, SEA_DISTANCE_OPTIONS,
  TITLE_DEEDS,
} from "@/lib/constants";
import type { Money } from "@/lib/money";
import { SORT_OPTIONS, extraFilterCount, filterPriceToGbp, type CatalogFilters as Filters } from "@/lib/properties";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";

function Select({ id, name, label, value, options, any }: {
  id: string; name: string; label: string; value?: string; options: [string, string][]; any: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <select id={id} name={name} defaultValue={value ?? ""} className="input">
        <option value="">{any}</option>
        {options.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </div>
  );
}

/** Ключи справочника из constants с подписями на языке страницы. */
function opts(keys: Record<string, string>, labels: Record<string, string>): [string, string][] {
  return Object.keys(keys).map((k) => [k, labels[k] ?? keys[k]]);
}

export async function CatalogFilters({ f, money }: { f: Filters; money: Money }) {
  const { t, lp } = await getI18n();
  const L = t.labels;
  const extra = extraFilterCount(f);
  // Цены в фильтре показываются в текущей валюте посетителя, даже если ссылку открыли с другой валютой.
  const shownPrice = (v?: number) => {
    if (v == null) return "";
    if (f.cur === money.code) return String(v);
    const gbp = filterPriceToGbp(v, f, money.rates);
    return gbp == null ? "" : String(Math.round(money.convert(gbp)));
  };
  return (
    // key перерисовывает поля, когда фильтры меняются через ссылку «Сбросить» или меняется валюта
    <Form key={`${JSON.stringify(f)}|${money.code}`} action={lp("/catalog")} className="card p-4">
      {f.deal !== "SALE" && <input type="hidden" name="deal" value={f.deal} />}
      {f.view === "map" && <input type="hidden" name="view" value="map" />}
      <input type="hidden" name="cur" value={money.code} />

      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.5fr_1.1fr_1fr_auto]">
        <Select id="f-type" name="type" label={t.filters.type} any={t.filters.any} value={f.type} options={opts(PROPERTY_TYPES, L.propertyTypes)} />
        <Select id="f-bedrooms" name="bedrooms" label={t.filters.bedrooms} any={t.filters.anyNeuter} value={f.bedrooms}
          options={BEDROOM_OPTIONS.map((o) => [o.value, L.bedrooms[o.value] ?? o.label])} />
        <div>
          <span className="label">{fmt(t.filters.price, { symbol: money.symbol })}</span>
          <div className="flex gap-2">
            <input name="priceMin" inputMode="numeric" defaultValue={shownPrice(f.priceMin)} placeholder={t.filters.from} className="input" aria-label={t.filters.priceFrom} />
            <input name="priceMax" inputMode="numeric" defaultValue={shownPrice(f.priceMax)} placeholder={t.filters.to} className="input" aria-label={t.filters.priceTo} />
          </div>
        </div>
        <Select id="f-sea" name="sea" label={t.filters.sea} any={t.filters.noMatter} value={f.sea}
          options={SEA_DISTANCE_OPTIONS.map((o) => [o.value, L.sea[o.value] ?? o.label])} />
        <div>
          <label className="label" htmlFor="f-sort">{t.filters.sort}</label>
          <select id="f-sort" name="sort" defaultValue={f.sort} className="input">
            {Object.keys(SORT_OPTIONS).map((k) => <option key={k} value={k}>{L.sort[k]}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1">{t.filters.show}</button>
          <Link href={lp(f.view === "map" ? "/catalog?view=map" : "/catalog")} className="btn btn-secondary">{t.filters.reset}</Link>
        </div>
      </div>

      <details open={extra > 0} className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-accent-dark select-none">
          <span className="transition group-open:rotate-90">›</span>
          {t.filters.more}
          {extra > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{extra}</span>}
        </summary>

        <div className="mt-3 space-y-4 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select id="f-region" name="region" label={t.filters.region} any={t.filters.any} value={f.region} options={opts(REGIONS, L.regions)} />
            <div>
              <span className="label">{t.filters.area}</span>
              <div className="flex gap-2">
                <input name="areaMin" inputMode="numeric" defaultValue={f.areaMin ?? ""} placeholder={t.filters.from} className="input" aria-label={t.filters.areaFrom} />
                <input name="areaMax" inputMode="numeric" defaultValue={f.areaMax ?? ""} placeholder={t.filters.to} className="input" aria-label={t.filters.areaTo} />
              </div>
            </div>
            <Select id="f-completion" name="completion" label={t.filters.completion} any={t.filters.anyFeminine} value={f.completion} options={opts(COMPLETION, L.completion)} />
            <Select id="f-finishing" name="finishing" label={t.filters.finishing} any={t.filters.anyFeminine} value={f.finishing} options={opts(FINISHING, L.finishing)} />
            <Select id="f-furnishing" name="furnishing" label={t.filters.furnishing} any={t.filters.noMatter} value={f.furnishing} options={opts(FURNISHING, L.furnishing)} />
            <Select id="f-title" name="title" label={t.filters.titleDeed} any={t.filters.any} value={f.title} options={opts(TITLE_DEEDS, L.titleDeeds)} />
          </div>

          <div>
            <span className="label">{t.filters.amenities}</span>
            <div className="flex flex-wrap gap-2">
              <label className="check">
                <input type="checkbox" name="inst" value="1" defaultChecked={f.inst} className="accent-accent" />
                {t.filters.installment}
              </label>
              <label className="check">
                <input type="checkbox" name="seaView" value="1" defaultChecked={f.seaView} className="accent-accent" />
                {t.filters.seaView}
              </label>
              {opts(FEATURES, L.features).map(([k, v]) => (
                <label key={k} className="check">
                  <input type="checkbox" name="feat" value={k} defaultChecked={f.feat.includes(k)} className="accent-accent" />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>
      </details>
    </Form>
  );
}
