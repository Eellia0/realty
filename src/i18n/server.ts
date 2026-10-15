import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, localizePath, type Locale } from "./config";
import { en } from "./messages/en";
import { ru, type Messages } from "./messages/ru";

export const MESSAGES: Record<Locale, Messages> = { ru, en };

/**
 * Язык текущего запроса. Его выставляет proxy.ts по адресу: /en/… — английский, остальное — русский.
 * Работает и в страницах, и в server actions: форма отправляется на адрес страницы, где был посетитель.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await headers()).get("x-locale");
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

/** Тексты и помощник для ссылок на текущем языке. */
export const getI18n = cache(async () => {
  const locale = await getLocale();
  return { locale, t: MESSAGES[locale], lp: (path: string) => localizePath(locale, path) };
});

/** Адрес текущей страницы без языкового префикса, например «/catalog?view=map». Нужен переключателю языка. */
export async function getCurrentPath() {
  return (await headers()).get("x-path") ?? "/";
}
