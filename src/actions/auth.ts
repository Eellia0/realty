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

export type AuthState = { error?: string; needCode?: boolean } | undefined;

const LOGIN_WINDOW = 15 * 60 * 1000;
const LOGIN_PER_EMAIL = 5; // неудачных попыток на один email за 15 минут
const LOGIN_PER_IP = 30; // неудачных попыток с одного IP за 15 минут

const emailSchema = z.string().trim().toLowerCase().email("Введите корректный email").max(200);

const registerSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: emailSchema,
  password: z.string().min(8, "Пароль должен быть не короче 8 символов").max(200, "Слишком длинный пароль"),
});

/** Разрешаем редирект только на внутренние пути. */
function safeNext(value: FormDataEntryValue | null, fallback = "/") {
  const s = typeof value === "string" ? value : "";
  return /^\/(?![/\\])/.test(s) ? s : fallback;
}

export async function registerAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const limit = await consume(`register:ip:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const parsed = registerSchema.safeParse({
    name: fd.get("name") || undefined,
    email: fd.get("email"),
    password: fd.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password, name } = parsed.data;

  if (await db.user.findUnique({ where: { email } })) {
    return { error: "Пользователь с таким email уже зарегистрирован" };
  }

  // Роль всегда USER: администратор создаётся только командой npm run admin на сервере.
  const user = await db.user.create({
    data: { email, name: name || null, role: "USER", passwordHash: await hashPassword(password) },
  });
  await createSession(user.id, user.role);
  await mergeGuestFavorites(user.id);
  redirect(safeNext(fd.get("next")));
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const adminMode = fd.get("mode") === "admin";
  const parsedEmail = emailSchema.safeParse(fd.get("email"));
  const password = String(fd.get("password") ?? "").slice(0, 200);
  if (!parsedEmail.success || !password) return { error: "Введите email и пароль" };
  const email = parsedEmail.data;

  const ipKey = `login:ip:${await clientIp()}`;
  const emailKey = `login:email:${email}`;
  for (const [key, max] of [[ipKey, LOGIN_PER_IP], [emailKey, LOGIN_PER_EMAIL]] as const) {
    const res = await checkLimit(key, max);
    if (!res.ok) return { error: waitMessage(res.retryAfterSec) };
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
    return fail({ error: "Неверный email или пароль" });
  }

  // Второй шаг: код из приложения-аутентификатора.
  if (user.totpEnabled && user.totpSecret) {
    const code = String(fd.get("code") ?? "").trim();
    if (!code) return { needCode: true };
    const step = verifyTotp(decrypt(user.totpSecret), code);
    if (step === null || (user.totpLastStep != null && step <= user.totpLastStep)) {
      return fail({ needCode: true, error: "Неверный или уже использованный код" });
    }
    await db.user.update({ where: { id: user.id }, data: { totpLastStep: step } });
  }

  await resetLimit(emailKey);
  await createSession(user.id, user.role);
  if (user.role !== "ADMIN") await mergeGuestFavorites(user.id);
  redirect(safeNext(fd.get("next"), user.role === "ADMIN" && adminMode ? "/admin" : "/"));
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
