"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { saveProperty } from "@/actions/admin";
import {
  COMPLETION, DEAL_TYPES, FEATURES, FINISHING, FURNISHING, PROPERTY_STATUSES, PROPERTY_TYPES, REGIONS, TITLE_DEEDS,
  TYPES_WITH_FLOOR, TYPES_WITH_PLOT,
} from "@/lib/constants";
import { localFloor } from "@/lib/format";
import { CURRENCY } from "@/lib/site";
import { LocationPicker } from "@/components/map";
import { geocodeAddress } from "@/components/map/ymaps";
import type { LatLng } from "@/components/map/LocationPicker";
import { ImageUploader } from "./ImageUploader";

export type PropertyFormValues = {
  id?: number;
  title: string;
  description: string;
  dealType: string;
  propertyType: string;
  status: string;
  price: number | null;
  area: number | null;
  plotArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  floorsTotal: number | null;
  yearBuilt: number | null;
  completion: string;
  completionDate: string;
  finishing: string;
  furnishing: string;
  titleDeed: string;
  seaDistance: number | null;
  seaView: boolean;
  features: string[];
  region: string;
  district: string;
  address: string;
  lat: number | null;
  lng: number | null;
  images: string[];
};

const v = (n: number | null) => (n == null ? "" : String(n));

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

function SelectField({ id, label, value, options, empty, onChange }: {
  id: string; label: string; value: string; options: Record<string, string>; empty?: string; onChange?: (v: string) => void;
}) {
  return (
    <Field id={id} label={label}>
      <select id={id} name={id} defaultValue={value} className="input" onChange={(e) => onChange?.(e.target.value)}>
        {empty !== undefined && <option value="">{empty}</option>}
        {Object.entries(options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
    </Field>
  );
}

export function PropertyForm({ initial }: { initial: PropertyFormValues }) {
  const [state, action, pending] = useActionState(saveProperty, undefined);
  const [images, setImages] = useState(initial.images);
  const [coords, setCoords] = useState<LatLng | null>(
    initial.lat != null && initial.lng != null ? { lat: initial.lat, lng: initial.lng } : null,
  );
  const [type, setType] = useState(initial.propertyType);
  const [completion, setCompletion] = useState(initial.completion);
  const [floor, setFloor] = useState(v(initial.floor));
  const [geo, setGeo] = useState<{ loading: boolean; message?: string; error?: boolean }>({ loading: false });
  // Метку поставили вручную (кликом или перетаскиванием) — автопоиск её больше не двигает.
  // У существующего объекта точка уже выверена, поэтому тоже считаем её ручной.
  const manualRef = useRef(initial.lat != null);
  const lastQueryRef = useRef("");
  const regionRef = useRef<HTMLSelectElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const dealKeys = Object.keys(DEAL_TYPES);
  const floorNum = floor.trim() === "" ? null : Number(floor);

  function addressQuery() {
    const region = regionRef.current ? REGIONS[regionRef.current.value]?.split(" (")[0] : "";
    const address = addressRef.current?.value.trim();
    if (!address) return "";
    return [address, districtRef.current?.value.trim(), region, "Северный Кипр"].filter(Boolean).join(", ");
  }

  /**
   * Поиск координат по адресу.
   * auto = true: вызов при уходе из поля адреса. Ничего не делает, если метку уже ставили вручную
   * или адрес не изменился с прошлого поиска.
   */
  async function findOnMap(auto = false) {
    const q = addressQuery();
    if (!q) {
      if (!auto) setGeo({ loading: false, message: "Сначала введите адрес", error: true });
      return;
    }
    if (auto && (manualRef.current || q === lastQueryRef.current)) return;
    lastQueryRef.current = q;
    setGeo({ loading: true });
    try {
      const found = await geocodeAddress(q);
      if (found) {
        manualRef.current = false;
        setCoords({ lat: found.lat, lng: found.lng });
        setGeo({ loading: false, message: `${auto ? "Метка поставлена автоматически" : "Найдено"}: ${found.label}. Уточните положение, перетащив метку.` });
      } else {
        setGeo({ loading: false, message: "Адрес не найден. Поставьте метку на карте вручную.", error: true });
      }
    } catch {
      setGeo({ loading: false, message: "Поиск по адресу недоступен: нужен ключ API Яндекс Карт. Поставьте метку кликом по карте.", error: true });
    }
  }

  function onPick(c: LatLng) {
    manualRef.current = true;
    setCoords(c);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="lat" value={coords?.lat ?? ""} />
      <input type="hidden" name="lng" value={coords?.lng ?? ""} />

      <Section title="Основное">
        <Field id="title" label="Заголовок">
          <input id="title" name="title" required maxLength={200} defaultValue={initial.title} className="input" placeholder="Пентхаус 2+1 с видом на море" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          {dealKeys.length > 1 ? (
            <SelectField id="dealType" label="Сделка" value={initial.dealType} options={DEAL_TYPES} />
          ) : (
            <input type="hidden" name="dealType" value={dealKeys[0]} />
          )}
          <SelectField id="propertyType" label="Тип объекта" value={initial.propertyType} options={PROPERTY_TYPES} onChange={setType} />
          <SelectField id="status" label="Статус на сайте" value={initial.status} options={PROPERTY_STATUSES} />
        </div>
        <Field id="description" label="Описание">
          <textarea id="description" name="description" rows={6} maxLength={10000} defaultValue={initial.description} className="input"
            placeholder="Комплекс, вид из окон, инфраструктура, условия рассрочки" />
        </Field>
      </Section>

      <Section title="Цена и характеристики">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="price" label={`Цена, ${CURRENCY.symbol}`}>
            <input id="price" name="price" required inputMode="decimal" defaultValue={v(initial.price)} className="input" placeholder="185000" />
          </Field>
          <Field id="area" label="Площадь, м²">
            <input id="area" name="area" required inputMode="decimal" defaultValue={v(initial.area)} className="input" placeholder="95" />
          </Field>
          <Field id="bedrooms" label="Спальни (2 = «2+1», 0 = студия)">
            <input id="bedrooms" name="bedrooms" inputMode="numeric" defaultValue={v(initial.bedrooms)} className="input" />
          </Field>
          <Field id="bathrooms" label="Санузлы">
            <input id="bathrooms" name="bathrooms" inputMode="numeric" defaultValue={v(initial.bathrooms)} className="input" />
          </Field>
          {TYPES_WITH_PLOT.includes(type) && (
            <Field id="plotArea" label="Площадь участка, м²">
              <input id="plotArea" name="plotArea" inputMode="decimal" defaultValue={v(initial.plotArea)} className="input" />
            </Field>
          )}
          {TYPES_WITH_FLOOR.includes(type) && (
            <Field id="floor" label="Этаж (первый этаж = 0)">
              <input id="floor" name="floor" inputMode="numeric" value={floor} onChange={(e) => setFloor(e.target.value)} className="input" />
              {floorNum != null && Number.isInteger(floorNum) && (
                <span className="mt-1 block text-xs text-muted">На сайте: этаж {localFloor(floorNum)}</span>
              )}
            </Field>
          )}
          <Field id="floorsTotal" label="Этажей в здании">
            <input id="floorsTotal" name="floorsTotal" inputMode="numeric" defaultValue={v(initial.floorsTotal)} className="input" />
          </Field>
          <Field id="yearBuilt" label="Год постройки">
            <input id="yearBuilt" name="yearBuilt" inputMode="numeric" defaultValue={v(initial.yearBuilt)} className="input" />
          </Field>
        </div>
      </Section>

      <Section title="Состояние и документы">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField id="completion" label="Готовность" value={initial.completion} options={COMPLETION} onChange={setCompletion} />
          {completion !== "READY" && (
            <Field id="completionDate" label="Срок сдачи">
              <input id="completionDate" name="completionDate" maxLength={50} defaultValue={initial.completionDate} className="input" placeholder="IV кв. 2027" />
            </Field>
          )}
          <SelectField id="finishing" label="Отделка и ремонт" value={initial.finishing} options={FINISHING} empty="Не указано" />
          <SelectField id="furnishing" label="Мебель" value={initial.furnishing} options={FURNISHING} empty="Не указано" />
          <SelectField id="titleDeed" label="Тип титула" value={initial.titleDeed} options={TITLE_DEEDS} empty="Не указано" />
        </div>
      </Section>

      <Section title="Море и удобства">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field id="seaDistance" label="Расстояние до моря, м">
            <input id="seaDistance" name="seaDistance" inputMode="numeric" defaultValue={v(initial.seaDistance)} className="input" placeholder="350" />
          </Field>
          <label className="check self-end">
            <input type="checkbox" name="seaView" defaultChecked={initial.seaView} className="accent-accent" />
            Вид на море
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(FEATURES).map(([k, l]) => (
            <label key={k} className="check">
              <input type="checkbox" name="features" value={k} defaultChecked={initial.features.includes(k)} className="accent-accent" />
              {l}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Расположение" hint="Введите адрес: метка встанет сама, когда вы перейдёте к следующему полю. Её можно перетащить в точное место или поставить кликом по карте.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr]">
          <Field id="region" label="Регион">
            <select id="region" ref={regionRef} name="region" defaultValue={initial.region} className="input" onChange={() => findOnMap(true)}>
              {Object.entries(REGIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </Field>
          <Field id="district" label="Посёлок или район">
            <input id="district" ref={districtRef} name="district" onBlur={() => findOnMap(true)} maxLength={100} defaultValue={initial.district} className="input" placeholder="Эсентепе" />
          </Field>
          <Field id="address" label="Адрес или название комплекса">
            <div className="flex gap-2">
              <input id="address" ref={addressRef} name="address" onBlur={() => findOnMap(true)} required maxLength={300} defaultValue={initial.address} className="input" placeholder="Long Beach, İskele" />
              <button type="button" onClick={() => findOnMap(false)} disabled={geo.loading} className="btn btn-secondary shrink-0">
                {geo.loading ? "Ищем…" : "Найти на карте"}
              </button>
            </div>
          </Field>
        </div>
        {geo.message && <p className={`text-sm ${geo.error ? "text-danger" : "text-accent-dark"}`}>{geo.message}</p>}
        <div className="h-96 overflow-hidden rounded-2xl ring-1 ring-line">
          <LocationPicker value={coords} onChange={onPick} />
        </div>
        <p className="text-sm text-muted">
          {coords ? `Координаты: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Метка ещё не поставлена."}
        </p>
      </Section>

      <Section title="Фотографии">
        <ImageUploader value={images} onChange={setImages} />
      </Section>

      {state?.errors && (
        <ul className="space-y-1 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
          {state.errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-primary px-6">
          {pending ? "Сохраняем…" : initial.id ? "Сохранить изменения" : "Добавить объект"}
        </button>
        <a href="/admin" className="btn btn-secondary">Отмена</a>
      </div>
    </form>
  );
}
