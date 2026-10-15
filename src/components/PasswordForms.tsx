"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { requestPasswordReset, resetPassword } from "@/actions/password";
import { useI18n } from "@/i18n/client";

function submitManually(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

export function ForgotPasswordForm() {
  const { t, lp } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="space-y-3 rounded-xl bg-accent-soft p-4 text-sm text-accent-dark">
        <p className="font-semibold">{t.password.checkTitle}</p>
        <p>{t.password.checkText}</p>
        <Link href={lp("/login")} className="inline-block font-semibold underline">{t.password.backToLogin}</Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submitManually(action)}>
      <div>
        <label className="label" htmlFor="email">{t.auth.email}</label>
        <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      {state?.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? t.password.sending : t.password.send}</button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(resetPassword, undefined);
  return (
    <form className="space-y-4" onSubmit={submitManually(action)}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label className="label" htmlFor="password">{t.password.newPassword}</label>
        <input id="password" name="password" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="input" placeholder={t.auth.passwordHint} />
      </div>
      <div>
        <label className="label" htmlFor="confirm">{t.password.repeat}</label>
        <input id="confirm" name="confirm" type="password" required minLength={8} maxLength={200} autoComplete="new-password" className="input" />
      </div>
      {state?.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}
      <button disabled={pending} className="btn btn-primary w-full">{pending ? t.password.saving : t.password.save}</button>
    </form>
  );
}
