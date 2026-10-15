import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { sha256 } from "./crypto";

// По HTTPS cookie называется с префиксом __Host-: браузер принимает его только с флагом Secure,
// без домена и с path=/. Такой cookie нельзя подменить с поддомена. По HTTP, то есть на localhost,
// используется обычное имя.
const SECURE_COOKIE = "__Host-session";
const PLAIN_COOKIE = "session";
const USER_SESSION_HOURS = 24 * 30;
const ADMIN_SESSION_HOURS = 12;
const BCRYPT_COST = 12;

export type CurrentUser = { id: number; email: string; name: string | null; role: string; totpEnabled: boolean };

export function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_COST);
}

// Хэш-заглушка: сравниваем с ним, когда пользователя нет, чтобы время ответа
// не выдавало, зарегистрирован ли email.
let dummyHash: Promise<string> | null = null;

export async function verifyPassword(password: string, hash: string | null | undefined) {
  dummyHash ??= bcrypt.hash(crypto.randomBytes(16).toString("hex"), BCRYPT_COST);
  const ok = await bcrypt.compare(password, hash ?? (await dummyHash));
  return Boolean(hash) && ok;
}

async function isHttps() {
  const h = await headers();
  if (h.get("x-forwarded-proto") === "https") return true;
  return (h.get("origin") ?? h.get("referer") ?? "").startsWith("https://");
}

async function readToken() {
  const store = await cookies();
  return store.get(SECURE_COOKIE)?.value ?? store.get(PLAIN_COOKIE)?.value;
}

/** Создаёт сессию и ставит cookie. Вызывать только из server action или route handler. */
export async function createSession(userId: number, role: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const hours = role === "ADMIN" ? ADMIN_SESSION_HOURS : USER_SESSION_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
  await db.session.create({ data: { id: sha256(token), userId, expiresAt } });
  // Попутно чистим просроченные сессии.
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const https = await isHttps();
  (await cookies()).set(https ? SECURE_COOKIE : PLAIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const token = await readToken();
  if (token) await db.session.deleteMany({ where: { id: sha256(token) } });
  const store = await cookies();
  store.delete(SECURE_COOKIE);
  store.delete(PLAIN_COOKIE);
}

/** Завершает все сессии пользователя, кроме текущей. */
export async function destroyOtherSessions(userId: number) {
  const token = await readToken();
  await db.session.deleteMany({ where: { userId, NOT: token ? { id: sha256(token) } : undefined } });
}

/** Текущий пользователь или null. Кэшируется на время одного запроса. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await readToken();
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({
    where: { id: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, totpEnabled: true } } },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

/**
 * Пропускает только администратора с включённой двухфакторной аутентификацией.
 * Вызывается в каждом server action и API админки, а не только в layout.
 */
export async function requireAdmin({ allowWithoutTotp = false } = {}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Доступ только для администратора");
  if (!user.totpEnabled && !allowWithoutTotp) throw new Error("Сначала включите двухфакторную аутентификацию");
  return user;
}
