import "server-only";
import { db } from "./db";

// Счётчики попыток хранятся в БД, поэтому переживают перезапуск сервера
// и работают, даже если сайт запущен в несколько процессов.

export type RateLimitResult = { ok: boolean; retryAfterSec: number };

/** Проверяет лимит без увеличения счётчика. */
export async function checkLimit(key: string, limit: number): Promise<RateLimitResult> {
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < new Date()) return { ok: true, retryAfterSec: 0 };
  return {
    ok: row.count < limit,
    retryAfterSec: Math.ceil((row.resetAt.getTime() - Date.now()) / 1000),
  };
}

/** Увеличивает счётчик. Окно отсчитывается от первой попытки. */
export async function hit(key: string, windowMs: number) {
  const now = new Date();
  // Удаляем истёкшие записи: в ключах есть IP-адреса, долго хранить их незачем.
  await db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
  const row = await db.rateLimit.findUnique({ where: { key } });
  if (!row || row.resetAt < now) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
      update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
    });
  } else {
    await db.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  }
}

/** Проверка и учёт в одном вызове: для действий, где считается каждая попытка. */
export async function consume(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const res = await checkLimit(key, limit);
  if (!res.ok) return res;
  await hit(key, windowMs);
  return res;
}

export async function resetLimit(key: string) {
  await db.rateLimit.deleteMany({ where: { key } });
}

/** Текст «попробуйте через N мин.». template — из словаря языка посетителя, по умолчанию русский. */
export function waitMessage(sec: number, template = "Слишком много попыток. Попробуйте через {min} мин.") {
  return template.replace("{min}", String(Math.ceil(sec / 60)));
}
