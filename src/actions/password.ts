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

export type ResetState = { ok?: boolean; error?: string } | undefined;

const TOKEN_TTL_MS = 60 * 60 * 1000; // ссылка действует 1 час

const emailSchema = z.string().trim().toLowerCase().email("Введите корректный email").max(200);
const passwordSchema = z.string().min(8, "Пароль должен быть не короче 8 символов").max(200, "Слишком длинный пароль");

/**
 * Шаг 1: письмо со ссылкой. Ответ всегда одинаковый, чтобы по нему нельзя было
 * узнать, зарегистрирован ли email. Администратору ссылка не отправляется:
 * его пароль меняется только командой npm run admin на сервере.
 */
export async function requestPasswordReset(_prev: ResetState, fd: FormData): Promise<ResetState> {
  const ipLimit = await consume(`reset:ip:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!ipLimit.ok) return { error: waitMessage(ipLimit.retryAfterSec) };

  const parsed = emailSchema.safeParse(fd.get("email"));
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
      const url = `${base}/reset-password?token=${token}`;
      try {
        await sendMail({
          to: user.email,
          subject: "Восстановление пароля",
          text: `Здравствуйте!\n\nЧтобы задать новый пароль, откройте ссылку:\n${url}\n\nСсылка действует 1 час. Если вы не запрашивали восстановление, просто удалите это письмо.`,
          html: mailLayout({
            title: "Восстановление пароля",
            body: `<p style="margin:0 0 8px;line-height:1.6">Здравствуйте${user.name ? `, ${escapeHtml(user.name)}` : ""}!</p>
              <p style="margin:0;line-height:1.6">Чтобы задать новый пароль, нажмите на кнопку. Ссылка действует 1 час.</p>
              <p style="margin:16px 0 0;color:#5f6f76;font-size:13px">Если вы не запрашивали восстановление, просто удалите это письмо.</p>`,
            button: { url, label: "Задать новый пароль" },
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
  const limit = await consume(`reset-confirm:ip:${await clientIp()}`, 10, 60 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const token = String(fd.get("token") ?? "");
  if (!/^[0-9a-f]{64}$/.test(token)) return { error: "Ссылка недействительна. Запросите восстановление ещё раз." };

  const reset = await db.passwordReset.findUnique({ where: { id: sha256(token) }, include: { user: true } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date() || reset.user.role !== "USER") {
    return { error: "Ссылка устарела или уже использована. Запросите восстановление ещё раз." };
  }

  const password = passwordSchema.safeParse(fd.get("password"));
  if (!password.success) return { error: password.error.issues[0].message };
  if (password.data !== fd.get("confirm")) return { error: "Пароли не совпадают" };

  await db.$transaction([
    db.user.update({ where: { id: reset.userId }, data: { passwordHash: await hashPassword(password.data) } }),
    db.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    db.passwordReset.deleteMany({ where: { userId: reset.userId, NOT: { id: reset.id } } }),
    // Новый пароль: все старые сеансы завершаются.
    db.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  redirect("/login?reset=1");
}
