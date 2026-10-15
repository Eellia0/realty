"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/actions/password";

function submitManually(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-3 rounded-xl bg-accent-soft p-4 text-sm text-accent-dark">
        <p className="font-semibold">Проверьте почту</p>
        <p>Если такой email зарегистрирован, мы отправили на него ссылку. Она действует 1 час. Письмо может попасть в «Спам».</p>
        <Link href="/login" className="inline-block font-semibold underline">Вернуться ко входу</Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submitManually(action)}>
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      {state?.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Отправляем…" : "Прислать ссылку"}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form className="space-y-4" onSubmit={submitManually(action)}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">Новый пароль</label>
        <input id="password" name="password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="input" placeholder="Не короче 8 символов" />
      </div>
      <div>
        <label className="label" htmlFor="confirm">Повторите пароль</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? "Сохраняем…" : "Сохранить пароль"}</button>
    </form>
  );
}
