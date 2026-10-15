"use client";

import { startTransition, useActionState } from "react";
import { changeAdminPassword, confirmTotp, type SecurityState } from "@/actions/admin";

function useManualSubmit(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(() => action(fd));
    form.querySelectorAll<HTMLInputElement>("input[data-clear]").forEach((i) => (i.value = ""));
  };
}

function Message({ state }: { state: SecurityState }) {
  if (state?.error) return <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>;
  if (state?.ok) return <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-dark">{state.ok}</p>;
  return null;
}

export function TotpConfirmForm() {
  const [state, action, pending] = useActionState(confirmTotp, undefined);
  return (
    <form onSubmit={useManualSubmit(action)} className="space-y-3">
      <label className="label" htmlFor="code">Код из приложения</label>
      <input id="code" name="code" data-clear required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6}
        className="input text-center text-lg tracking-[0.4em]" placeholder="000000" />
      <Message state={state} />
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Проверяем…" : "Включить защиту"}</button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeAdminPassword, undefined);
  return (
    <form onSubmit={useManualSubmit(action)} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="current">Текущий пароль</label>
        <input id="current" name="current" type="password" data-clear required autoComplete="current-password" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="pcode">Код из приложения</label>
        <input id="pcode" name="code" data-clear required inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Новый пароль</label>
        <input id="password" name="password" type="password" data-clear required minLength={12} autoComplete="new-password" className="input"
          placeholder="Не короче 12 символов, буквы и цифры" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Повторите пароль</label>
        <input id="confirm" name="confirm" type="password" data-clear required minLength={12} autoComplete="new-password" className="input" />
      </div>
      <div className="sm:col-span-2"><Message state={state} /></div>
      <div className="sm:col-span-2">
        <button disabled={pending} className="btn btn-primary">{pending ? "Сохраняем…" : "Сменить пароль"}</button>
      </div>
    </form>
  );
}
