import { LOCALES, localizePath, type Locale } from "@/i18n/config";

/**
 * Переключатель «RU / EN»: ссылка на ту же страницу на другом языке.
 * Обычная ссылка, а не переход внутри приложения: страница перезагружается целиком,
 * чтобы и Яндекс Карта загрузилась на новом языке.
 */
export function LanguageSwitcher({ locale, path, label }: { locale: Locale; path: string; label: string }) {
  return (
    <nav aria-label={label} className="flex items-center rounded-full bg-surface p-0.5 shadow-soft ring-1 ring-line">
      {LOCALES.map((code) => {
        const on = code === locale;
        return (
          <a
            key={code}
            href={localizePath(code, path)}
            hrefLang={code}
            lang={code}
            aria-current={on ? "true" : undefined}
            className={`flex h-7 items-center rounded-full px-2 text-xs font-bold uppercase transition sm:h-8 sm:px-2.5 ${
              on ? "bg-ink text-white" : "text-muted hover:bg-warm hover:text-ink"
            }`}
          >
            {code}
          </a>
        );
      })}
    </nav>
  );
}
