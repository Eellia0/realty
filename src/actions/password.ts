"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { escapeHtml, mailLayout, sendMail } from "@/lib/mailer";
import { consume, waitMessage } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { trustedSiteUrl } from "@/lib/site-url";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import type { Messages } from "@/i18n/messages/ru";

export type ResetState = { ok?: boolean; error?: string } | undefined;

const TOKEN_TTL_MS = 60 * 60 * 1000; // ссылка действует 1 час

const emailSchema = (t: Messages) => z.string().trim().toLowerCase().email(t.errors.email).max(200);
const passwordSchema = (t: Messages) => z.string().min(8, t.errors.passwordShort).max(200, t.errors.passwordLong);

/**
 * Шаг 1: письмо со ссылкой. Ответ всегда одинаковый, чтобы по нему нельзя было
 * узнать, зарегистрирован ли email. Администратору ссылка не отправляется:
 * его пароль меняется только командой npm run admin на сервере.
 * Письмо и ссылка — на языке той версии сайта, с которой запросили восстановление.
 */
export async function requestPasswordReset(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const { t, lp } = await getI18n();
  const ipLimit = await consume(`reset:ip:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) return { error: waitMessage(ipLimit.retryAfterSec, t.errors.tooMany) };

  const parsed = emailSchema(t).safeParse(fd.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data;

  const emailLimit = await consume(`reset:email:${email}`, 3, 60 * 60 * 1000);
  const user = await db.user.findUnique({ where: { email } });

  if (emailLimit.ok && user && user.role === "USER") {
    const base = trustedSiteUrl();
    if (!base) {
      console.error("[восстановление пароля] Не задан SITE_URL в .env, ссылку построить нельзя");
    } else {
      const token = crypto.randomBytes(32).toString("hex");
      await db.passwordReset.deleteMany({ where: { userId: user.id } });
      await db.passwordReset.create({
        data: { id: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TOKEN_TTL_MS) },
      });
      const url = `${base}${lp("/reset-password")}?token=${token}`;
      try {
        await sendMail({
          to: user.email,
          subject: t.mail.resetSubject,
          text: fmt(t.mail.resetPlain, { url }),
          html: mailLayout({
            title: t.mail.resetSubject,
            brand: t.meta.siteName,
            body: `<p style="margin:0 0 8px;line-height:1.6">${t.mail.resetHello}${user.name ? `, ${escapeHtml(user.name)}` : ""}!</p>
              <p style="margin:0;line-height:1.6">${t.mail.resetText}</p>
              <p style="margin:16px 0 0;color:#5f6f76;font-size:13px">${t.mail.resetIgnore}</p>`,
            button: { url, label: t.mail.resetButton },
          }),
        });
      } catch (e) {
        console.error("[восстановление пароля] Письмо не отправлено:", e);
      }
    }
  }
  return { ok: true };
}

/** Шаг 2: новый пароль по ссылке из письма. */
export async function resetPassword(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const { t, lp } = await getI18n();
  const limit = await consume(`reset-confirm:ip:${await clientIp()}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec, t.errors.tooMany) };

  const token = String(fd.get("token") ?? "");
  if (!/^[0-9a-f]{64}$/.test(token)) return { error: t.errors.linkInvalid };

  const reset = await db.passwordReset.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.user.role !== "USER") {
    return { error: t.errors.linkExpired };
  }

  const password = passwordSchema(t).safeParse(fd.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  if (password.data !== fd.get("confirm")) return { error: t.errors.mismatch };

  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password.data) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.passwordReset.deleteMany({ where: { userId: reset.userId, NOT: { id: reset.id } } }),
    // Новый пароль: все старые сеансы завершаются.
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  redirect(lp("/login?reset=1"));
}
