import "server-only";
import { headers } from "next/headers";

/**
 * Адрес сайта для ссылок в письмах и сообщениях.
 * Берётся только из SITE_URL в .env: адресу из запроса доверять нельзя, его можно подменить
 * и получить в письме ссылку на чужой сайт (атака на сброс пароля).
 */
export function trustedSiteUrl(): string | null {
  const url = process.env.SITE_URL?.trim().replace(/\/+$/, "");
  return url && /^https?:\/\/[^\s/]+$/.test(url) ? url : null;
}

/**
 * Адрес сайта для превью ссылок и карты сайта. Если SITE_URL не задан, берётся из запроса:
 * для этих целей подмена адреса ничем не грозит.
 */
export async function siteUrl(): Promise<string> {
  const trusted = trustedSiteUrl();
  if (trusted) return trusted;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = h.get("x-forwarded-proto") ?? (local ? "http" : "https");
  return `${proto}://${host}`;
}
