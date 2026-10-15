"use client";

import { startTransition, useActionState } from "react";
import { saveSettings, sendTestNotification, type SettingsState } from "@/actions/settings";
import type { Settings } from "@/lib/settings";

function Message({ state }: { state: SettingsState }) {
  if (state?.error) return <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>;
  if (state?.ok) return <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-dark">{state.ok}</p>;
  return null;
}

function Field({ name, label, hint, value, placeholder, type = "text" }: {
  name: keyof Settings; label: string; hint?: string; value: string | null; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={value ?? ""} placeholder={placeholder} className="input" maxLength={200} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <section className="card space-y-4 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Контакты на сайте</h2>
          <p className="mt-0.5 text-sm text-muted">Показываются в шапке, подвале, на странице «Контакты» и у каждого объекта. Пустые поля не показываются.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="phone" label="Телефон" value={settings.phone} placeholder="+90 533 123 45 67" />
          <Field name="whatsapp" label="WhatsApp" value={settings.whatsapp} placeholder="905331234567" hint="Номер с кодом страны. Пробелы и плюс уберутся сами." />
          <Field name="telegram" label="Telegram" value={settings.telegram} placeholder="@novyi_adres" hint="Имя пользователя или ссылка t.me/…" />
          <Field name="email" label="Почта для клиентов" type="email" value={settings.email} placeholder="info@example.com" />
          <Field name="address" label="Адрес офиса" value={settings.address} placeholder="Кирения, ул. Зия Рызки, 12" />
          <Field name="workingHours" label="Часы работы" value={settings.workingHours} placeholder="Пн–Сб, 9:00–19:00" />
          <Field name="addressEn" label="Адрес офиса по-английски" value={settings.addressEn} placeholder="12 Ziya Rızkı St, Kyrenia"
            hint="Для английской версии сайта. Пусто — покажется русский адрес." />
          <Field name="workingHoursEn" label="Часы работы по-английски" value={settings.workingHoursEn} placeholder="Mon–Sat, 9:00–19:00" />
        </div>
      </section>

      <section className="card space-y-4 p-5 sm:p-6">
        <h2 className="text-lg font-bold">Заявки и документы</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="notifyEmail" label="Почта для заявок" type="email" value={settings.notifyEmail} placeholder="you@yandex.ru"
            hint="Сюда будут приходить письма о новых заявках. Клиенты этот адрес не видят." />
          <Field name="legalName" label="Кто обрабатывает данные" value={settings.legalName} placeholder="ИП Иванов Иван Иванович"
            hint="Показывается в политике конфиденциальности." />
        </div>
      </section>

      <Message state={state} />
      <button disabled={pending} className="btn btn-primary px-6">{pending ? "Сохраняем…" : "Сохранить настройки"}</button>
    </form>
  );
}

export function TestNotificationButton({ channel, label }: { channel: "telegram" | "email"; label: string }) {
  const [state, action, pending] = useActionState(sendTestNotification, undefined);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="channel" value={channel} />
      <button disabled={pending} className="btn btn-secondary">{pending ? "Отправляем…" : label}</button>
      <Message state={state} />
    </form>
  );
}
