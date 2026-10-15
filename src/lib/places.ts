// Расстояния до важных мест. Считаются автоматически по координатам объекта, по прямой.

export type KeyPlace = { key: string; name: string; lat: number; lng: number; kind: "airport" | "city" };

export const KEY_PLACES: KeyPlace[] = [
  { key: "ERCAN", name: "Аэропорт Эрджан", lat: 35.1547, lng: 33.4961, kind: "airport" },
  { key: "LARNACA", name: "Аэропорт Ларнаки", lat: 34.8751, lng: 33.6249, kind: "airport" },
  { key: "GIRNE", name: "Кирения, центр", lat: 35.3417, lng: 33.32, kind: "city" },
  { key: "LEFKOSA", name: "Никосия, центр", lat: 35.1765, lng: 33.362, kind: "city" },
  { key: "GAZIMAGUSA", name: "Фамагуста, старый город", lat: 35.125, lng: 33.9417, kind: "city" },
];

/** Расстояние по прямой в метрах (формула гаверсинусов). */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Аэропорты и города, отсортированные по удалённости. */
export function keyPlaceDistances(lat: number, lng: number) {
  return KEY_PLACES.map((p) => ({ ...p, distance: distanceMeters(lat, lng, p.lat, p.lng) })).sort(
    (a, b) => a.distance - b.distance,
  );
}

const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/** 350 → «350 м», 1250 → «1,3 км», 28400 → «28 км». */
export function formatDistance(m: number) {
  if (m < 1000) return `${nf.format(Math.round(m / 10) * 10)} м`;
  if (m < 10000) return `${nf1.format(m / 1000)} км`;
  return `${nf.format(m / 1000)} км`;
}

export type NearbyPlace = { name: string; distance: number };

/** Безопасно читает список «своих» мест из JSON-поля базы. */
export function parseNearby(value: unknown): NearbyPlace[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (v): v is NearbyPlace =>
        typeof v === "object" && v !== null && typeof v.name === "string" && typeof v.distance === "number",
    )
    .map((v) => ({ name: v.name.slice(0, 60), distance: Math.max(0, Math.round(v.distance)) }))
    .slice(0, 12);
}
