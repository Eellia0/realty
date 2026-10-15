import "server-only";
import { cache } from "react";
import { db } from "./db";

export type Settings = {
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  workingHours: string | null;
  legalName: string | null;
  notifyEmail: string | null;
};

const EMPTY: Settings = {
  phone: null,
  whatsapp: null,
  telegram: null,
  email: null,
  address: null,
  workingHours: null,
  legalName: null,
  notifyEmail: null,
};

/** Настройки сайта из админки. Читаются один раз за запрос. */
export const getSettings = cache(async (): Promise<Settings> => {
  const row = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (!row) return EMPTY;
  const { id: _id, updatedAt: _u, ...rest } = row;
  return rest;
});

/** Ссылки для связи. Пустые поля не показываются. */
export function contactLinks(s: Settings) {
  const phoneDigits = s.phone?.replace(/[^\d+]/g, "");
  return {
    phone: s.phone && phoneDigits ? { label: s.phone, href: `tel:${phoneDigits}` } : null,
    whatsapp: s.whatsapp ? { label: "WhatsApp", href: `https://wa.me/${s.whatsapp}` } : null,
    telegram: s.telegram ? { label: `@${s.telegram}`, href: `https://t.me/${s.telegram}` } : null,
    email: s.email ? { label: s.email, href: `mailto:${s.email}` } : null,
  };
}

export function hasAnyContact(s: Settings) {
  return Boolean(s.phone || s.whatsapp || s.telegram || s.email);
}
