// Понятные адреса страниц объектов: /property/12-penthaus-s-vidom-na-more, /en/property/12-penthouse-sea-view.
// Число в начале — номер объекта, по нему страница и находится. Текст после него только для людей
// и поисковиков: если он устарел (объект переименовали), страница перенаправит на актуальный адрес.
import { localizePath, type Locale } from "@/i18n/config";

const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Турецкие буквы в названиях кипрских посёлков
  ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
};

export function slugify(text: string, maxLength = 70) {
  const translit = text
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
  const slug = translit.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.slice(0, maxLength).replace(/-+$/g, "");
}

type Sluggable = { id: number; title: string; titleEn?: string | null };

/** Адрес объекта без языкового префикса: «/property/12-penthaus-…». */
export function propertyBasePath(p: Sluggable, locale: Locale = "ru") {
  const title = locale === "en" && p.titleEn ? p.titleEn : p.title;
  const slug = slugify(title);
  return slug ? `/property/${p.id}-${slug}` : `/property/${p.id}`;
}

/** Адрес страницы объекта на нужном языке. */
export function propertyPath(p: Sluggable, locale: Locale = "ru") {
  return localizePath(locale, propertyBasePath(p, locale));
}

/** Номер объекта из сегмента адреса «12-penthaus-…» или «12». */
export function parsePropertyParam(param: string) {
  const m = /^(\d+)(?:-[a-z0-9-]*)?$/.exec(param);
  const id = m ? Number(m[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
