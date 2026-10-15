"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { isMailConfigured, mailLayout, sendMail } from "@/lib/mailer";
import { getSettings } from "@/lib/settings";
import { isTelegramConfigured, sendTelegram } from "@/lib/telegram";

export type SettingsState = { ok?: string; error?: string } | undefined;

/** Пустое поле означает «не показывать». */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

const settingsSchema = z.object({
  phone: optional(z.string().trim().max(40, "Телефон слишком длинный")),
  // Номер WhatsApp храним только цифрами: так он подходит для ссылки wa.me.
  whatsapp: optional(
    z
      .string()
      .transform((v) => v.replace(/\D/g, ""))
      .pipe(z.string().regex(/^\d{8,15}$/, "WhatsApp: номер с кодом страны, 8–15 цифр")),
  ),
  // Имя в Telegram: принимаем @name, name и ссылку t.me/name.
  telegram: optional(
    z
      .string()
      .transform((v) => v.trim().replace(/^https?:\/\/t\.me\//i, "").replace(/^@/, "").replace(/\/$/, ""))
      .pipe(z.string().regex(/^[A-Za-z0-9_]{5,32}$/, "Telegram: имя из латиницы, цифр и _, от 5 символов")),
  ),
  email: optional(z.string().trim().toLowerCase().email("Почта для клиентов указана неверно").max(200)),
  address: optional(z.string().trim().max(200)),
  workingHours: optional(z.string().trim().max(100)),
  legalName: optional(z.string().trim().max(200)),
  notifyEmail: optional(z.string().trim().toLowerCase().email("Почта для заявок указана неверно").max(200)),
});

const KEYS = ["phone", "whatsapp", "telegram", "email", "address", "workingHours", "legalName", "notifyEmail"] as const;

export async function saveSettings(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(KEYS.map((k) => [k, fd.get(k) ?? ""])));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const d = parsed.data;
  const data = {
    phone: d.phone ?? null,
    whatsapp: d.whatsapp ?? null,
    telegram: d.telegram ?? null,
    email: d.email ?? null,
    address: d.address ?? null,
    workingHours: d.workingHours ?? null,
    legalName: d.legalName ?? null,
    notifyEmail: d.notifyEmail ?? null,
  };
  await db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
  revalidatePath("/", "layout");
  return { ok: "Настройки сохранены" };
}

export async function sendTestNotification(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  await requireAdmin();
  const channel = fd.get("channel");
  try {
    if (channel === "telegram") {
      if (!isTelegramConfigured()) return { error: "Telegram не настроен: заполните TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в .env" };
      await sendTelegram("✅ <b>Проверка уведомлений</b>\nЕсли вы видите это сообщение, заявки с сайта будут приходить сюда.");
      return { ok: "Сообщение отправлено в Telegram" };
    }
    if (channel === "email") {
      if (!isMailConfigured()) return { error: "Почта не настроена: заполните SMTP_HOST, SMTP_USER и SMTP_PASS в .env" };
      const to = (await getSettings()).notifyEmail;
      if (!to) return { error: "Сначала укажите и сохраните почту для заявок" };
      await sendMail({
        to,
        subject: "Проверка уведомлений",
        text: "Если вы видите это письмо, заявки с сайта будут приходить на этот адрес.",
        html: mailLayout({
          title: "Проверка уведомлений",
          body: `<p style="margin:0;line-height:1.6">Если вы видите это письмо, заявки с сайта будут приходить на этот адрес.</p>`,
        }),
      });
      return { ok: `Письмо отправлено на ${to}` };
    }
    return { error: "Неизвестный канал" };
  } catch (e) {
    console.error("[уведомления] Проверка не прошла:", e);
    return { error: `Не удалось отправить: ${e instanceof Error ? e.message : "неизвестная ошибка"}` };
  }
}
