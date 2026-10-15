"use client";

import { useI18n } from "@/i18n/client";

/** Обязательная галочка согласия на обработку персональных данных. */
export function ConsentCheckbox({ id = "consent" }: { id?: string }) {
  const { t, lp } = useI18n();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
      <input id={id} name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
      <span>
        {t.consent.before}{" "}
        <a href={lp("/privacy")} target="_blank" className="font-medium text-accent-dark underline underline-offset-2">
          {t.consent.link}
        </a>
      </span>
    </label>
  );
}
