import { CURRENCY } from "./site";

const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

export function formatPrice(price: number, dealType = "SALE") {
  return `${CURRENCY.symbol}${nf.format(Math.round(price))}${dealType === "RENT" ? "/мес" : ""}`;
}

export function formatPriceShort(price: number) {
  if (price >= 1_000_000) return `${CURRENCY.symbol}${nf1.format(price / 1_000_000)}M`;
  if (price >= 1_000) return `${CURRENCY.symbol}${nf.format(price / 1_000)}K`;
  return `${CURRENCY.symbol}${nf.format(price)}`;
}

export function formatArea(area: number) {
  return `${nf1.format(area)} м²`;
}

export function pricePerMeter(price: number, area: number) {
  return area > 0 ? `${CURRENCY.symbol}${nf.format(Math.round(price / area))}/м²` : "";
}

/** Спальни в местном формате: 2 → «2+1», 0 → «Студия». */
export function bedroomsLabel(bedrooms: number | null | undefined) {
  if (bedrooms == null) return null;
  return bedrooms === 0 ? "Студия" : `${bedrooms}+1`;
}

/**
 * Этаж по местной нумерации, где первый этаж нулевой.
 * В скобках привычный номер: 0 → «0 (1-й)», 3 → «3 (4-й)», -1 → «-1 (цокольный)».
 */
export function localFloor(floor: number) {
  if (floor < 0) return `${floor} (цокольный)`;
  return `${floor} (${floor + 1}-й)`;
}

export function floorLabel(floor: number | null | undefined, total: number | null | undefined) {
  if (floor != null && total != null) return `этаж ${localFloor(floor)} из ${total}`;
  if (floor != null) return `этаж ${localFloor(floor)}`;
  if (total != null) return `${total} ${total === 1 ? "этаж" : total < 5 ? "этажа" : "этажей"}`;
  return null;
}

export function seaDistanceLabel(m: number | null | undefined) {
  if (m == null) return null;
  if (m < 1000) return `${nf.format(m)} м до моря`;
  return `${nf1.format(m / 1000)} км до моря`;
}

export function propertyMeta(p: { bedrooms: number | null; area: number; floor: number | null; floorsTotal: number | null }) {
  return [bedroomsLabel(p.bedrooms), formatArea(p.area), floorLabel(p.floor, p.floorsTotal)].filter(Boolean).join(" · ");
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
