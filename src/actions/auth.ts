"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { decrypt } from "@/lib/crypto";
import { mergeGuestFavorites } from "@/lib/favorites";
import { checkLimit, consume, hit, resetLimit, waitMessage } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { verifyTotp } from "@/lib/totp";
import { getI18n } from "@/i18n/server";
import type { Messages } from "@/i18n/messages/ru";

export type AuthState = { error?: string; needCode?: boolean } | undefined;

const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_PER_EMAIL = 5; // неудачных попыток на один email за 15 минут
const LOGIN_PER_IP = 30; // неудачных попыток с одного IP за 15 минут

const emailSchema = (t: Messages) => z.string().trim().toLowerCase().email(t.errors.email).max(200);

const registerSchema = (t: Messages) =>
  z.object({
    name: z.string().trim().max(80).optional(),
    email: emailSchema(t),
    password: z.string().min(8, t.errors.passwordShort).max(200, t.errors.passwordLong),
  });

/** Разрешаем редирект только на внутренние пути. */
function safeNext(value: FormDataEntryValue | null, fallback = "/") {
  const s = typeof value === "string" ? value : "";
  return /^\/(?![/\\])/.test(s) ? s : fallback;
}

export async function registerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const { t, lp } = await getI18n();
  if (fd.get("consent") !== "on") return { error: t.errors.consent };
  const limit = await consume(`register:ip:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec, t.errors.tooMany) };

  const parsed = registerSchema(t).safeParse({
    name: fd.get("name") || undefined,
    email: fd.get("email"),
    password: fd.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, name } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: t.errors.userExists };
  }

  // Роль всегда USER: администратор создаётся только командой npm run admin на сервере.
  const user = await db.user.create({
    data: { email, name: name || null, role: "USER", passwordHash: await hashPassword(password), consentAt: new Date() },
  });
  await createSession(user.id, user.role);
  await mergeGuestFavorites(user.id);
  redirect(safeNext(fd.get("next"), lp("/")));
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const { t, lp } = await getI18n();
  const adminMode = fd.get("mode") === "admin";
  const parsedEmail = emailSchema(t).safeParse(fd.get("email"));
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!parsedEmail.success || !password) return { error: t.errors.credentialsRequired };
  const email = parsedEmail.data;

  const ipKey = `login:ip:${await clientIp()}`;
  const emailKey = `login:email:${email}`;
  for (const [key, max] of [[ipKey, LOGIN_PER_IP], [emailKey, LOGIN_PER_EMAIL]] as const) {
    const res = await checkLimit(key, max);
    if (!res.ok) return { error: waitMessage(res.retryAfterSec, t.errors.tooMany) };
  }
  const fail = async (state: AuthState): Promise<AuthState> => {
    await hit(ipKey, LOGIN_WINDOW);
    await hit(emailKey, LOGIN_WINDOW);
    return state;
  };

  const user = await db.user.findUnique({ where: { email } });
  const passwordOk = await verifyPassword(password, user?.passwordHash);
  // Одинаковый ответ для «нет пользователя», «неверный пароль» и «не администратор».
  if (!user || !passwordOk || (adminMode && user.role !== "ADMIN")) {
    return fail({ error: t.errors.wrongCredentials });
  }

  // Второй шаг: код из приложения-аутентификатора.
  if (user.totpEnabled && user.totpSecret) {
    const code = String(fd.get("code") ?? "").trim();
    if (!code) return { needCode: true };
    const step = verifyTotp(decrypt(user.totpSecret), code);
    if (step === null || (user.totpLastStep != null && step <= user.totpLastStep)) {
      return fail({ needCode: true, error: t.errors.wrongCode });
    }
    await db.user.update({ where: { id: user.id }, data: { totpLastStep: step } });
  }

  await resetLimit(emailKey);
  await createSession(user.id, user.role);
  if (user.role !== "ADMIN") await mergeGuestFavorites(user.id);
  redirect(safeNext(fd.get("next"), user.role === "ADMIN" && adminMode ? "/admin" : lp("/")));
}

export async function logoutAction() {
  const { lp } = await getI18n();
  await destroySession();
  redirect(lp("/"));
}
