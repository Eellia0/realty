"use client";

import { startTransition, useActionState } from "react";
import { createLead } from "@/actions/leads";
import { ConsentCheckbox } from "./ConsentCheckbox";

/** Заявка на просмотр. Без propertyId это общая заявка со страницы контактов. */
export function LeadForm({
  propertyId,
  submitLabel = "Записаться на просмотр",
  messagePlaceholder = "Удобное время для показа или вопрос",
}: {
  propertyId?: number;
  submitLabel?: string;
  messagePlaceholder?: string;
}) {
  const [state, action, pending] = useActionState(createLead, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent-dark">
        Спасибо! Заявка отправлена, мы свяжемся с вами в ближайшее время.
      </div>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        // Отправляем вручную, чтобы при ошибке введённые данные не сбрасывались.
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
      <input name="name" required maxLength={80} placeholder="Ваше имя" className="input" autoComplete="name" />
      <input name="phone" type="tel" required maxLength={20} placeholder="+90 533 000 00 00" className="input" autoComplete="tel" />
      <textarea name="message" rows={3} maxLength={1000} placeholder={messagePlaceholder} className="input resize-none" />
      <ConsentCheckbox id={propertyId ? `consent-${propertyId}` : "consent-contacts"} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Отправляем…" : submitLabel}
      </button>
    </form>
  );
}
