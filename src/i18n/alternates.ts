import "server-only";
import type { Metadata } from "next";
import { localizePath } from "./config";
import { getLocale } from "./server";

/**
 * Канонический адрес страницы и ссылки на её версии на других языках (hreflang).
 * path — адрес без языкового префикса, например «/catalog». Для объектов адреса на языках
 * различаются (у английской версии свой текст в адресе), поэтому их можно передать отдельно.
 */
export async function languageAlternates(path: string, paths?: { ru: string; en: string }): Promise<Metadata["alternates"]> {
  const locale = await getLocale();
  const ru = paths?.ru ?? path;
  const en = paths?.en ?? localizePath("en", path);
  return {
    canonical: locale === "en" ? en : ru,
    languages: { ru, en, "x-default": ru },
  };
}
