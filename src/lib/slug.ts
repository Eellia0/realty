// Понятные адреса страниц объектов: /property/12-penthaus-s-vidom-na-more.
// Число в начале — номер объекта, по нему страница и находится. Текст после него только для людей
// и поисковиков: если он устарел (объект переименовали), страница перенаправит на актуальный адрес.

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

/** Адрес страницы объекта. */
export function propertyPath(p: { id: number; title: string }) {
  const slug = slugify(p.title);
  return slug ? `/property/${p.id}-${slug}` : `/property/${p.id}`;
}

/** Номер объекта из сегмента адреса «12-penthaus-…» или «12». */
export function parsePropertyParam(param: string) {
  const m = /^(\d+)(?:-[a-z0-9-]*)?$/.exec(param);
  const id = m ? Number(m[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
