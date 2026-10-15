import { INTL_LOCALE, type Locale } from "@/i18n/config";
import { CURRENCY } from "./site";

// Форматирование чисел, площадей, этажей и расстояний с учётом языка.
// По умолчанию русский: так работают админка, уведомления и письма.

const formatters = new Map<string, Intl.NumberFormat>();
function nf(locale: Locale, digits = 0) {
  const key = `${locale}:${digits}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: digits });
    formatters.set(key, f);
  }
  return f;
}

export function formatNumber(n: number, locale: Locale = "ru", digits = 0) {
  return nf(locale, digits).format(n);
}

/** Цена в фунтах (базовая валюта). Для показа посетителю в его валюте используйте Money из currency.ts. */
export function formatPrice(price: number, dealType = "SALE", locale: Locale = "ru") {
  const perMonth = dealType === "RENT" ? (locale === "en" ? "/mo" : "/мес") : "";
  return `${CURRENCY.symbol}${nf(locale).format(Math.round(price))}${perMonth}`;
}

export function formatPriceShort(price: number, locale: Locale = "ru") {
  if (price >= 1_000_000) return `${CURRENCY.symbol}${nf(locale, 1).format(price / 1_000_000)}M`;
  if (price >= 1_000) return `${CURRENCY.symbol}${nf(locale).format(price / 1_000)}K`;
  return `${CURRENCY.symbol}${nf(locale).format(price)}`;
}

export function formatArea(area: number, locale: Locale = "ru") {
  return `${nf(locale, 1).format(area)} ${locale === "en" ? "m²" : "м²"}`;
}

export function pricePerMeter(price: number, area: number, locale: Locale = "ru") {
  return area > 0 ? `${CURRENCY.symbol}${nf(locale).format(Math.round(price / area))}/${locale === "en" ? "m²" : "м²"}` : "";
}

/**
 * Спальни. По-русски в местном формате: 2 → «2+1», 0 → «Студия».
 * По-английски привычнее «2 bed» и «Studio».
 */
export function bedroomsLabel(bedrooms: number | null | undefined, locale: Locale = "ru") {
  if (bedrooms == null) return null;
  if (locale === "en") return bedrooms === 0 ? "Studio" : `${bedrooms} bed`;
  return bedrooms === 0 ? "Студия" : `${bedrooms}+1`;
}

/**
 * Этаж по местной нумерации, где первый этаж нулевой.
 * По-русски в скобках привычный номер: 0 → «0 (1-й)», 3 → «3 (4-й)», -1 → «-1 (цокольный)».
 * По-английски (британская система) нумерация та же: 0 → «ground floor», 3 → «floor 3».
 */
export function localFloor(floor: number, locale: Locale = "ru") {
  if (locale === "en") return floor < 0 ? "lower ground floor" : floor === 0 ? "ground floor" : `floor ${floor}`;
  if (floor < 0) return `${floor} (цокольный)`;
  return `${floor} (${floor + 1}-й)`;
}

/** Этаж для строки характеристик в карточке. */
export function floorLabel(floor: number | null | undefined, total: number | null | undefined, locale: Locale = "ru") {
  if (locale === "en") {
    if (floor != null && total != null) return `${localFloor(floor, "en")} of ${total}`;
    if (floor != null) return localFloor(floor, "en");
    if (total != null) return `${total} ${total === 1 ? "storey" : "storeys"}`;
    return null;
  }
  if (floor != null && total != null) return `этаж ${localFloor(floor)} из ${total}`;
  if (floor != null) return `этаж ${localFloor(floor)}`;
  if (total != null) return `${total} ${total === 1 ? "этаж" : total < 5 ? "этажа" : "этажей"}`;
  return null;
}

/** Значение «Этаж» в таблице характеристик: «0 (1-й) из 3» или «Ground of 3». */
export function floorFact(floor: number, total: number | null | undefined, locale: Locale = "ru") {
  if (locale === "en") {
    const f = floor < 0 ? "Lower ground" : floor === 0 ? "Ground" : String(floor);
    return total ? `${f} of ${total}` : f;
  }
  return `${localFloor(floor)}${total ? ` из ${total}` : ""}`;
}

/** 350 → «350 м», 1250 → «1,3 км», 28400 → «28 км». */
export function formatDistance(m: number, locale: Locale = "ru") {
  const [mUnit, kmUnit] = locale === "en" ? ["m", "km"] : ["м", "км"];
  if (m < 1000) return `${nf(locale).format(Math.round(m / 10) * 10)} ${mUnit}`;
  if (m < 10000) return `${nf(locale, 1).format(m / 1000)} ${kmUnit}`;
  return `${nf(locale).format(m / 1000)} ${kmUnit}`;
}

export function seaDistanceLabel(m: number | null | undefined, locale: Locale = "ru") {
  if (m == null) return null;
  return `${formatDistance(m, locale)} ${locale === "en" ? "to the sea" : "до моря"}`;
}

export function propertyMeta(
  p: { bedrooms: number | null; area: number; floor: number | null; floorsTotal: number | null },
  locale: Locale = "ru",
) {
  return [bedroomsLabel(p.bedrooms, locale), formatArea(p.area, locale), floorLabel(p.floor, p.floorsTotal, locale)]
    .filter(Boolean)
    .join(" · ");
}

export function formatDate(d: Date) {
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
