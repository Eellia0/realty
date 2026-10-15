import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import {
  CATALOG_STATUSES, COMPLETION, DEAL_TYPES, FEATURES, FINISHING, FURNISHING, PROPERTY_TYPES, REGIONS,
  SEA_DISTANCE_OPTIONS, TITLE_DEEDS, isKeyOf, labelOf,
} from "./constants";
import { propertyMeta, seaDistanceLabel } from "./format";
import type { MapPoint } from "./types";
import { thumbUrl } from "./images";
import { propertyPath } from "./slug";
import { BASE_CURRENCY, isCurrency, toGbp, type CurrencyCode, type Money, type Rates } from "./money";
import { MESSAGES } from "@/i18n/server";
import { placeLine, propertyTexts } from "./localize";

export const PAGE_SIZE = 12;

export type CatalogView = "list" | "map";

export type CatalogFilters = {
  view: CatalogView;
  deal: string;
  type?: string;
  bedrooms?: string;
  priceMin?: number;
  priceMax?: number;
  /** В какой валюте указаны priceMin и priceMax (как видел их посетитель). */
  cur: CurrencyCode;
  areaMin?: number;
  areaMax?: number;
  sea?: string; // максимальное расстояние до моря, м
  seaView?: boolean;
  inst?: boolean;
  region?: string;
  completion?: string;
  finishing?: string;
  furnishing?: string;
  title?: string;
  feat: string[];
  sort: string;
  page: number;
};

export const SORT_OPTIONS: Record<string, string> = {
  new: "Сначала новые",
  price_asc: "Сначала дешевле",
  price_desc: "Сначала дороже",
  sea_asc: "Ближе к морю",
  area_desc: "По площади",
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

function num(v: string | string[] | undefined) {
  const s = first(v);
  if (!s) return undefined;
  const n = Number(s.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function pick(map: Record<string, string>, v: string | string[] | undefined) {
  const s = first(v);
  return isKeyOf(map, s) ? s : undefined;
}

export function parseFilters(sp: SearchParams): CatalogFilters {
  const bedrooms = first(sp.bedrooms);
  const sea = first(sp.sea);
  return {
    view: first(sp.view) === "map" ? "map" : "list",
    deal: pick(DEAL_TYPES, sp.deal) ?? "SALE",
    type: pick(PROPERTY_TYPES, sp.type),
    bedrooms: bedrooms && ["0", "1", "2", "3", "4"].includes(bedrooms) ? bedrooms : undefined,
    priceMin: num(sp.priceMin),
    priceMax: num(sp.priceMax),
    cur: isCurrency(first(sp.cur)) ? (first(sp.cur) as CurrencyCode) : BASE_CURRENCY,
    areaMin: num(sp.areaMin),
    areaMax: num(sp.areaMax),
    sea: SEA_DISTANCE_OPTIONS.some((o) => o.value === sea) ? sea : undefined,
    seaView: first(sp.seaView) === "1" || undefined,
    inst: first(sp.inst) === "1" || undefined,
    region: pick(REGIONS, sp.region),
    completion: pick(COMPLETION, sp.completion),
    finishing: pick(FINISHING, sp.finishing),
    furnishing: pick(FURNISHING, sp.furnishing),
    title: pick(TITLE_DEEDS, sp.title),
    feat: [...new Set(all(sp.feat).filter((f) => isKeyOf(FEATURES, f)))],
    sort: pick(SORT_OPTIONS, sp.sort) ?? "new",
    page: Math.max(1, Math.floor(num(sp.page) ?? 1)),
  };
}

/** Сколько дополнительных фильтров включено: для бейджа на кнопке «Ещё фильтры». */
export function extraFilterCount(f: CatalogFilters) {
  return [f.areaMin, f.areaMax, f.region, f.completion, f.finishing, f.furnishing, f.title, f.seaView, f.inst].filter(
    (v) => v != null,
  ).length + f.feat.length;
}

/** Цена из фильтра в фунтах. Если курсов нет, считаем, что она уже в фунтах. */
export function filterPriceToGbp(v: number | undefined, f: CatalogFilters, rates: Rates | null) {
  if (v == null) return undefined;
  return f.cur === BASE_CURRENCY || !rates ? v : toGbp(v, f.cur, rates);
}

function buildWhere(f: CatalogFilters, rates: Rates | null): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = { status: { in: CATALOG_STATUSES }, dealType: f.deal };
  if (f.type) where.propertyType = f.type;
  if (f.bedrooms) where.bedrooms = f.bedrooms === "4" ? { gte: 4 } : Number(f.bedrooms);
  if (f.priceMin != null || f.priceMax != null) {
    where.price = { gte: filterPriceToGbp(f.priceMin, f, rates), lte: filterPriceToGbp(f.priceMax, f, rates) };
  }
  if (f.areaMin != null || f.areaMax != null) where.area = { gte: f.areaMin, lte: f.areaMax };
  if (f.sea) where.seaDistance = { lte: Number(f.sea) };
  if (f.seaView) where.seaView = true;
  if (f.inst) where.installment = true;
  if (f.region) where.region = f.region;
  if (f.completion) where.completion = f.completion;
  if (f.finishing) where.finishing = f.finishing;
  if (f.furnishing) where.furnishing = f.furnishing;
  if (f.title) where.titleDeed = f.title;
  if (f.feat.length) where.features = { hasEvery: f.feat };
  return where;
}

const ORDER: Record<string, Prisma.PropertyOrderByWithRelationInput> = {
  new: { createdAt: "desc" },
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  sea_asc: { seaDistance: { sort: "asc", nulls: "last" } },
  area_desc: { area: "desc" },
};

export const withCover = {
  // Обложка — первое фото. Планировки (kind = PLAN) в обложку не попадают.
  images: { where: { kind: "PHOTO" }, orderBy: { position: "asc" }, take: 1 },
} satisfies Prisma.PropertyInclude;

export type PropertyWithCover = Prisma.PropertyGetPayload<{ include: typeof withCover }>;

/** Данные метки на карте. Цена уже в валюте посетителя, тексты — на его языке (язык берётся из money). */
export function toMapPoint(p: PropertyWithCover, money: Money): MapPoint {
  const locale = money.locale;
  const t = MESSAGES[locale];
  const x = propertyTexts(p, locale, t);
  return {
    id: p.id,
    lat: p.lat,
    lng: p.lng,
    price: p.price,
    priceText: money.format(p.price, p.dealType),
    priceShort: money.formatShort(p.price),
    dealType: p.dealType,
    title: x.title,
    address: x.address,
    cover: p.images[0] ? thumbUrl(p.images[0].url) : null,
    typeLabel: x.typeLabel,
    meta: propertyMeta(p, locale),
    sea: seaDistanceLabel(p.seaDistance, locale),
    seaView: p.seaView,
    installment: p.installment,
    place: placeLine(p, locale, t),
    status: p.status,
    href: propertyPath(p, locale),
  };
}

/** Страница списка с пагинацией. */
export async function getCatalogPage(f: CatalogFilters, rates: Rates | null) {
  const where = buildWhere(f, rates);
  const [items, total] = await Promise.all([
    db.property.findMany({
      where,
      orderBy: [ORDER[f.sort], { id: "desc" }],
      skip: (f.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: withCover,
    }),
    db.property.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Все подходящие объекты для режима карты: их сотни, это нормальный объём. */
export async function getCatalogPoints(f: CatalogFilters, money: Money) {
  const items = await db.property.findMany({
    where: buildWhere(f, money.rates),
    orderBy: [ORDER[f.sort], { id: "desc" }],
    include: withCover,
  });
  return items.map((p) => toMapPoint(p, money));
}

/** Строит query string из фильтров, пропуская значения по умолчанию. */
export function filtersToQuery(f: CatalogFilters, overrides: Partial<Record<keyof CatalogFilters, string | number>> = {}) {
  const params = new URLSearchParams();
  const merged: Record<string, unknown> = { ...f, ...overrides };
  for (const [k, v] of Object.entries(merged)) {
    if (v == null || v === "" || v === false) continue;
    if (k === "deal" && v === "SALE") continue;
    if (k === "view" && v === "list") continue;
    if (k === "sort" && v === "new") continue;
    if (k === "page" && Number(v) === 1) continue;
    if (k === "cur" && (v === BASE_CURRENCY || (merged.priceMin == null && merged.priceMax == null))) continue;
    if (Array.isArray(v)) v.forEach((x) => params.append(k, String(x)));
    else params.set(k, v === true ? "1" : String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}
