"use client";

import { startTransition, useActionState } from "react";
import { createLead } from "@/actions/leads";

export function LeadForm({ propertyId }: { propertyId: number }) {
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
      <input type="hidden" name="propertyId" value={propertyId} />
      <input name="name" required placeholder="Ваше имя" className="input" autoComplete="name" />
      <input name="phone" type="tel" required placeholder="+7 900 000-00-00" className="input" autoComplete="tel" />
      <textarea name="message" rows={3} placeholder="Удобное время для показа или вопрос" className="input resize-none" />
      {state?.error && <p className="text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Отправляем…" : "Записаться на просмотр"}
      </button>
    </form>
  );
}
