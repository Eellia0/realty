import "server-only";
import { headers } from "next/headers";

/**
 * IP клиента. За обратным прокси (nginx, хостинг) берём первый адрес из X-Forwarded-For.
 * Без прокси заголовок можно подделать, поэтому лимиты по IP дополняются лимитами по email.
 */
export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

/** Запрос пришёл с нашего же сайта: защита route handlers от CSRF. */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
