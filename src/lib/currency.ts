import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { db } from "./db";
import { getLocale } from "@/i18n/server";
import { BASE_CURRENCY, createMoney, isCurrency, type CurrencyCode, type Money, type Rates } from "./money";

// Курсы валют ЦБ РФ. Порядок источников:
// 1) зеркало ЦБ в формате JSON (быстро и просто), 2) официальный сайт ЦБ (XML),
// 3) последний сохранённый курс из базы. Свежий курс держится в памяти 3 часа.

export const CURRENCY_COOKIE = "currency";
const TTL_MS = 3 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;

let memo: { rates: Rates; at: number } | null = null;
let inflight: Promise<Rates | null> | null = null;

async function fromMirror(): Promise<Rates> {
  const res = await fetch("https://www.cbr-xml-daily.ru/daily_json.js", { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`зеркало ЦБ: ${res.status}`);
  const data = (await res.json()) as { Date: string; Valute: Record<string, { Nominal: number; Value: number }> };
  const gbp = data.Valute.GBP.Value / data.Valute.GBP.Nominal;
  const eur = data.Valute.EUR.Value / data.Valute.EUR.Nominal;
  return check({ RUB: gbp, EUR: gbp / eur, date: data.Date.slice(0, 10), source: "ЦБ РФ" });
}

async function fromCbr(): Promise<Rates> {
  const res = await fetch("https://www.cbr.ru/scripts/XML_daily.asp", { cache: "no-store", signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`ЦБ: ${res.status}`);
  const xml = new TextDecoder("windows-1251").decode(await res.arrayBuffer());
  const pick = (code: string) => {
    const m = new RegExp(`<CharCode>${code}</CharCode>\\s*<Nominal>(\\d+)</Nominal>\\s*<Name>[^<]*</Name>\\s*<Value>([\\d,]+)</Value>`).exec(xml);
    if (!m) throw new Error(`ЦБ: нет курса ${code}`);
    return Number(m[2].replace(",", ".")) / Number(m[1]);
  };
  const d = /Date="(\d{2})\.(\d{2})\.(\d{4})"/.exec(xml);
  const gbp = pick("GBP");
  return check({ RUB: gbp, EUR: gbp / pick("EUR"), date: d ? `${d[3]}-${d[2]}-${d[1]}` : "", source: "ЦБ РФ" });
}

/** Защита от явно ошибочных данных источника. */
function check(r: Rates): Rates {
  if (!(r.RUB > 10 && r.RUB < 10000) || !(r.EUR > 0.5 && r.EUR < 3)) throw new Error("подозрительный курс");
  return r;
}

async function fromDb(): Promise<Rates | null> {
  const row = await db.currencyRates.findUnique({ where: { id: 1 } });
  return row ? { EUR: row.eurPerGbp, RUB: row.rubPerGbp, date: row.rateDate, source: row.source } : null;
}

/** Курсы к фунту или null, если их нет нигде. */
export async function getRates(): Promise<Rates | null> {
  if (memo && Date.now() - memo.at < TTL_MS) return memo.rates;
  inflight ??= (async () => {
    try {
      const rates = await fromMirror().catch((e) => {
        unstable_rethrow(e); // служебные сигналы Next.js не перехватываем
        return fromCbr();
      });
      memo = { rates, at: Date.now() };
      const data = { eurPerGbp: rates.EUR, rubPerGbp: rates.RUB, rateDate: rates.date, source: rates.source };
      await db.currencyRates.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }).catch(() => {});
      return rates;
    } catch (e) {
      unstable_rethrow(e);
      console.warn("[курсы] Источники недоступны, берём последний сохранённый курс:", e instanceof Error ? e.message : e);
      const saved = await fromDb();
      // Повторим попытку получить свежий курс через 10 минут.
      if (saved) memo = { rates: saved, at: Date.now() - TTL_MS + RETRY_MS };
      return saved;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function getCurrencyCode(): Promise<CurrencyCode> {
  const v = (await cookies()).get(CURRENCY_COOKIE)?.value;
  return isCurrency(v) ? v : BASE_CURRENCY;
}

/**
 * Валюта посетителя с курсами и форматом чисел его языка.
 * Если курсов нет, цены показываются в фунтах. Один раз за запрос.
 */
export const getMoney = cache(async (): Promise<Money> => {
  const [code, rates, locale] = await Promise.all([getCurrencyCode(), getRates(), getLocale()]);
  if (code !== BASE_CURRENCY && !rates) return createMoney(BASE_CURRENCY, null, true, locale);
  return createMoney(code, rates, false, locale);
});
