// Тексты объекта на языке посетителя. Английские поля необязательны:
// если поле не заполнено, на английском сайте показывается русский текст.
import type { Locale } from "@/i18n/config";
import type { Messages } from "@/i18n/messages/ru";

type PropertyTexts = {
  title: string;
  description: string;
  district: string | null;
  address: string;
  region: string;
  propertyType: string;
  installmentNote?: string | null;
  titleEn?: string | null;
  descriptionEn?: string | null;
  districtEn?: string | null;
  addressEn?: string | null;
  installmentNoteEn?: string | null;
};

export function propertyTexts(p: PropertyTexts, locale: Locale, t: Messages) {
  const en = locale === "en";
  return {
    title: (en && p.titleEn) || p.title,
    description: (en && p.descriptionEn) || p.description,
    district: (en && p.districtEn) || p.district,
    address: (en && p.addressEn) || p.address,
    installmentNote: (en && p.installmentNoteEn) || p.installmentNote || null,
    region: t.labels.regions[p.region] ?? p.region,
    typeLabel: t.labels.propertyTypes[p.propertyType] ?? p.propertyType,
  };
}

/** «Эсентепе, Кирения (Гирне)» / «Esentepe, Kyrenia (Girne)». */
export function placeLine(p: PropertyTexts, locale: Locale, t: Messages) {
  const x = propertyTexts(p, locale, t);
  return [x.district, x.region].filter(Boolean).join(", ");
}
