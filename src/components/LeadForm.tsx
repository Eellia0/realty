"use client";

import { startTransition, useActionState } from "react";
import { createLead } from "@/actions/leads";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { useI18n } from "@/i18n/client";

/** Заявка на просмотр. Без propertyId это общая заявка со страницы контактов. */
export function LeadForm({
  propertyId,
  submitLabel,
  messagePlaceholder,
}: {
  propertyId?: number;
  submitLabel?: string;
  messagePlaceholder?: string;
}) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(createLead, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-xl bg-accent-soft p-4 text-sm text-accent-dark">
        {t.lead.thanks}
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
      <input name="name" required maxLength={80} placeholder={t.lead.name} className="input" autoComplete="name" />
      <input name="phone" type="tel" required maxLength={20} placeholder={t.lead.phone} className="input" autoComplete="tel" />
      <textarea name="message" rows={3} maxLength={1000} placeholder={messagePlaceholder ?? t.lead.message} className="input resize-none" />
      <ConsentCheckbox id={propertyId ? `consent-${propertyId}` : "consent-contacts"} />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? t.lead.sending : (submitLabel ?? t.lead.submit)}
      </button>
    </form>
  );
}
