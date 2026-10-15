"use client";

import { createContext, useContext } from "react";
import { localizePath, type Locale } from "./config";
import type { Messages } from "./messages/ru";

// Тексты для браузерных компонентов. Layout кладёт сюда словарь текущего языка.
const I18nContext = createContext<{ locale: Locale; t: Messages } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Messages; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n: нет I18nProvider выше по дереву");
  return { ...ctx, lp: (path: string) => localizePath(ctx.locale, path) };
}
