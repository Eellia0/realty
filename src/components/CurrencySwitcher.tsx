"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCurrency } from "@/actions/currency";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/money";

/** Переключатель валюты «£ € ₽». Выбор запоминается в cookie, цены на странице сразу пересчитываются. */
export function CurrencySwitcher({ current, rateNote, unavailable }: { current: CurrencyCode; rateNote: string | null; unavailable: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [active, setActive] = useOptimistic(current);

  function choose(code: CurrencyCode) {
    if (code === active) return;
    startTransition(async () => {
      setActive(code);
      await setCurrency(code);
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label="Валюта цен"
      title={unavailable ? "Курсы временно недоступны, цены показаны в фунтах" : (rateNote ?? undefined)}
      className={`flex items-center rounded-full bg-surface p-0.5 shadow-soft ring-1 ring-line ${pending ? "opacity-80" : ""}`}
    >
      {CURRENCY_CODES.map((code) => {
        const on = code === active;
        const disabled = unavailable && code !== "GBP";
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={CURRENCIES[code].name}
            disabled={disabled}
            onClick={() => choose(code)}
            className={`flex h-7 w-7 items-center sm:h-8 sm:w-8 justify-center rounded-full text-sm font-bold transition ${
              on ? "bg-accent text-white shadow-sm" : "text-muted hover:bg-warm hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
            }`}
          >
            {CURRENCIES[code].symbol}
          </button>
        );
      })}
    </div>
  );
}
