"use client";

import { useI18n } from "@/i18n/client";

export function MapError() {
  const { t } = useI18n();
  return <div className="flex h-full w-full items-center justify-center bg-warm p-6 text-center text-sm text-muted">{t.map.error}</div>;
}
