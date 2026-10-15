"use server";

import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { notifyNewLead } from "@/lib/notify";
import { consume, waitMessage } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { trustedSiteUrl } from "@/lib/site-url";

export type LeadState = { ok?: boolean; error?: string } | undefined;

const leadSchema = z.object({
  propertyId: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{6,20}$/, "Укажите корректный номер телефона"),
  message: z.string().trim().max(1000).optional(),
});

export async function createLead(_prev: LeadState, fd: FormData): Promise<LeadState> {
  if (fd.get("consent") !== "on") return { error: "Подтвердите согласие на обработку персональных данных" };

  // Защита от спама: не больше 5 заявок с одного IP за 10 минут.
  const limit = await consume(`lead:ip:${await clientIp()}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const parsed = leadSchema.safeParse({
    propertyId: fd.get("propertyId") || undefined,
    name: fd.get("name"),
    phone: fd.get("phone"),
    message: fd.get("message") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { propertyId, ...data } = parsed.data;

  if (propertyId) {
    const property = await db.property.findFirst({
      where: { id: propertyId, status: { not: "DRAFT" } },
      select: { id: true },
    });
    if (!property) return { error: "Объект не найден" };
  }

  const lead = await db.lead.create({
    data: { ...data, propertyId: propertyId ?? null, source: propertyId ? "PROPERTY" : "CONTACTS", consentAt: new Date() },
  });

  // Уведомление уходит после ответа посетителю: он не ждёт Telegram и почту.
  // Ссылки в нём строятся только из SITE_URL, чтобы подменённый адрес запроса не попал вам в Telegram.
  const base = trustedSiteUrl();
  after(() => notifyNewLead(lead.id, base));
  return { ok: true };
}
