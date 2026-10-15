// Языки сайта. Модуль без серверных зависимостей: подходит и для браузера.
// Русская версия живёт на обычных адресах (/catalog), английская — с префиксом /en (/en/catalog).

export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

/** Формат чисел и дат для языка. Английский — британский: покупатели в основном из Великобритании. */
export const INTL_LOCALE: Record<Locale, string> = { ru: "ru-RU", en: "en-GB" };

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

/** Адрес страницы на нужном языке: localizePath("en", "/catalog?x=1") → "/en/catalog?x=1". */
export function localizePath(locale: Locale, path: string) {
  if (locale === DEFAULT_LOCALE) return path;
  if (path === "/" || path === "") return `/${locale}`;
  if (path.startsWith("/?")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** Подстановка значений в шаблон: fmt("Найдено {n}", { n: 5 }). */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/** «5 объектов» / «5 properties». */
export function objectsWord(n: number, locale: Locale) {
  if (locale === "en") return n === 1 ? "property" : "properties";
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "объект";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "объекта";
  return "объектов";
}
