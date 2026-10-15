"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { consume, waitMessage } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export type LeadState = { ok?: boolean; error?: string } | undefined;

const leadSchema = z.object({
  propertyId: z.coerce.number().int().positive(),
  name: z.string().trim().min(2, "Укажите имя").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s()+-]{6,20}$/, "Укажите корректный номер телефона"),
  message: z.string().trim().max(1000).optional(),
});

export async function createLead(_prev: LeadState, fd: FormData): Promise<LeadState> {
  // Защита от спама: не больше 5 заявок с одного IP за 10 минут.
  const limit = await consume(`lead:ip:${await clientIp()}`, 5, 10 * 60 * 1000);
  if (!limit.ok) return { error: waitMessage(limit.retryAfterSec) };

  const parsed = leadSchema.safeParse({
    propertyId: fd.get("propertyId"),
    name: fd.get("name"),
    phone: fd.get("phone"),
    message: fd.get("message") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const property = await db.property.findFirst({
    where: { id: parsed.data.propertyId, status: { not: "DRAFT" } },
    select: { id: true },
  });
  if (!property) return { error: "Объект не найден" };

  await db.lead.create({ data: parsed.data });
  return { ok: true };
}
