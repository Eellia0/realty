// Валюты сайта и пересчёт цен. Модуль без серверных зависимостей: подходит и для браузера.
// Цены в базе хранятся в фунтах. Остальные валюты — пересчёт по курсу ЦБ РФ, поэтому они округляются
// и помечаются знаком «≈».
import { INTL_LOCALE, type Locale } from "@/i18n/config";

export const CURRENCIES = {
  GBP: { symbol: "£", name: "Фунты" },
  EUR: { symbol: "€", name: "Евро" },
  RUB: { symbol: "₽", name: "Рубли" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const BASE_CURRENCY: CurrencyCode = "GBP";
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrency(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/** Сколько единиц валюты за 1 фунт. */
export type Rates = { EUR: number; RUB: number; date: string; source: string };

function perGbp(code: CurrencyCode, rates: Rates | null) {
  if (code === "GBP") return 1;
  return rates ? rates[code] : NaN;
}

export function fromGbp(gbp: number, code: CurrencyCode, rates: Rates | null) {
  return gbp * perGbp(code, rates);
}

export function toGbp(value: number, code: CurrencyCode, rates: Rates | null) {
  return value / perGbp(code, rates);
}

/** Округление пересчитанной суммы: точность до копейки при пересчёте по курсу не имеет смысла. */
function nice(value: number, code: CurrencyCode) {
  if (code === "GBP") return Math.round(value);
  const step = value >= 1_000_000 ? 1000 : value >= 10_000 ? 100 : value >= 1000 ? 10 : 1;
  return Math.round(value / step) * step;
}

export type Money = {
  code: CurrencyCode;
  symbol: string;
  /** true, если цены пересчитаны из фунтов по курсу. */
  approx: boolean;
  /** Курсы недоступны: показываем фунты, хотя выбрана другая валюта. */
  unavailable: boolean;
  rates: Rates | null;
  locale: Locale;
  convert: (gbp: number) => number;
  format: (gbp: number, dealType?: string) => string;
  formatShort: (gbp: number) => string;
  perMeter: (gbp: number, area: number) => string;
};

export function createMoney(code: CurrencyCode, rates: Rates | null, unavailable = false, locale: Locale = "ru"): Money {
  const symbol = CURRENCIES[code].symbol;
  const approx = code !== BASE_CURRENCY;
  const nf = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat(INTL_LOCALE[locale], { maximumFractionDigits: 1 });
  const perMonth = locale === "en" ? "/mo" : "/мес";
  const sqm = locale === "en" ? "m²" : "м²";

  const convert = (gbp: number) => fromGbp(gbp, code, rates);
  const format = (gbp: number, dealType = "SALE") =>
    `${approx ? "≈ " : ""}${symbol}${nf.format(nice(convert(gbp), code))}${dealType === "RENT" ? perMonth : ""}`;
  const formatShort = (gbp: number) => {
    const v = convert(gbp);
    if (v >= 1_000_000) return `${symbol}${nf1.format(v / 1_000_000)}M`;
    if (v >= 1_000) return `${symbol}${nf.format(v / 1_000)}K`;
    return `${symbol}${nf.format(v)}`;
  };
  const perMeter = (gbp: number, area: number) => (area > 0 ? `${format(gbp / area)}/${sqm}` : "");
  return { code, symbol, approx, unavailable, rates, locale, convert, format, formatShort, perMeter };
}

/** «2026-10-15» → «15.10.2026» (по-английски «15/10/2026»). */
export function rateDateLabel(iso: string, locale: Locale = "ru") {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return locale === "en" ? `${m[3]}/${m[2]}/${m[1]}` : `${m[3]}.${m[2]}.${m[1]}`;
}
