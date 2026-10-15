import Form from "next/form";
import Link from "next/link";
import {
  BEDROOM_OPTIONS, COMPLETION, FEATURES, FINISHING, FURNISHING, PROPERTY_TYPES, REGIONS, SEA_DISTANCE_OPTIONS,
  TITLE_DEEDS,
} from "@/lib/constants";
import { CURRENCY } from "@/lib/site";
import { SORT_OPTIONS, extraFilterCount, type CatalogFilters as Filters } from "@/lib/properties";

function Select({ id, name, label, value, options, any = "Любой" }: {
  id: string; name: string; label: string; value?: string; options: [string, string][]; any?: string;
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

export function CatalogFilters({ f }: { f: Filters }) {
  const extra = extraFilterCount(f);
  return (
    // key сбрасывает поля, когда фильтры меняются через ссылку «Сбросить»
    <Form key={JSON.stringify(f)} action="/catalog" className="card p-4">
      {f.deal !== "SALE" && <input type="hidden" name="deal" value={f.deal} />}
      {f.view === "map" && <input type="hidden" name="view" value="map" />}

      <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_0.8fr_1.5fr_1.1fr_1fr_auto]">
        <Select id="f-type" name="type" label="Тип" value={f.type} options={Object.entries(PROPERTY_TYPES)} />
        <Select id="f-bedrooms" name="bedrooms" label="Спальни" value={f.bedrooms} any="Любое"
          options={BEDROOM_OPTIONS.map((o) => [o.value, o.label])} />
        <div>
          <span className="label">Цена, {CURRENCY.symbol}</span>
          <div className="flex gap-2">
            <input name="priceMin" inputMode="numeric" defaultValue={f.priceMin ?? ""} placeholder="от" className="input" aria-label="Цена от" />
            <input name="priceMax" inputMode="numeric" defaultValue={f.priceMax ?? ""} placeholder="до" className="input" aria-label="Цена до" />
          </div>
        </div>
        <Select id="f-sea" name="sea" label="До моря" value={f.sea} any="Неважно"
          options={SEA_DISTANCE_OPTIONS.map((o) => [o.value, o.label])} />
        <div>
          <label className="label" htmlFor="f-sort">Сортировка</label>
          <select id="f-sort" name="sort" defaultValue={f.sort} className="input">
            {Object.entries(SORT_OPTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1">Показать</button>
          <Link href={f.view === "map" ? "/catalog?view=map" : "/catalog"} className="btn btn-secondary">Сбросить</Link>
        </div>
      </div>

      <details open={extra > 0} className="group mt-3">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg px-1 py-1 text-sm font-semibold text-accent-dark select-none">
          <span className="transition group-open:rotate-90">›</span>
          Ещё фильтры
          {extra > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{extra}</span>}
        </summary>

        <div className="mt-3 space-y-4 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select id="f-region" name="region" label="Регион" value={f.region} options={Object.entries(REGIONS)} />
            <div>
              <span className="label">Площадь, м²</span>
              <div className="flex gap-2">
                <input name="areaMin" inputMode="numeric" defaultValue={f.areaMin ?? ""} placeholder="от" className="input" aria-label="Площадь от" />
                <input name="areaMax" inputMode="numeric" defaultValue={f.areaMax ?? ""} placeholder="до" className="input" aria-label="Площадь до" />
              </div>
            </div>
            <Select id="f-completion" name="completion" label="Готовность" value={f.completion} any="Любая" options={Object.entries(COMPLETION)} />
            <Select id="f-finishing" name="finishing" label="Отделка и ремонт" value={f.finishing} any="Любая" options={Object.entries(FINISHING)} />
            <Select id="f-furnishing" name="furnishing" label="Мебель" value={f.furnishing} any="Неважно" options={Object.entries(FURNISHING)} />
            <Select id="f-title" name="title" label="Тип титула" value={f.title} options={Object.entries(TITLE_DEEDS)} />
          </div>

          <div>
            <span className="label">Удобства</span>
            <div className="flex flex-wrap gap-2">
              <label className="check">
                <input type="checkbox" name="inst" value="1" defaultChecked={f.inst} className="accent-accent" />
                Рассрочка
              </label>
              <label className="check">
                <input type="checkbox" name="seaView" value="1" defaultChecked={f.seaView} className="accent-accent" />
                Вид на море
              </label>
              {Object.entries(FEATURES).map(([k, v]) => (
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
