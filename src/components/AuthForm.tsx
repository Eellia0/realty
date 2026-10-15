"use client";

import { startTransition, useActionState, useRef } from "react";
import { loginAction, registerAction } from "@/actions/auth";
import { ConsentCheckbox } from "./ConsentCheckbox";
import { useI18n } from "@/i18n/client";

type Mode = "login" | "register" | "admin";

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const { t } = useI18n();
  const [state, action, pending] = useActionState(mode === "register" ? registerAction : loginAction, undefined);
  const codeRef = useRef<HTMLInputElement>(null);
  const needCode = Boolean(state?.needCode);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
        if (codeRef.current) codeRef.current.value = "";
      }}
    >
      {next && <input type="hidden" name="next" value={next} />}
      {mode === "admin" && <input type="hidden" name="mode" value="admin" />}

      {/* На шаге с кодом email и пароль остаются в форме, но скрыты */}
      <div className={needCode ? "hidden" : "space-y-4"}>
        {mode === "register" && (
          <div>
            <label className="label" htmlFor="name">{t.auth.name}</label>
            <input id="name" name="name" maxLength={80} className="input" autoComplete="name" placeholder={t.auth.namePlaceholder} />
          </div>
        )}
        <div>
          <label className="label" htmlFor="email">{t.auth.email}</label>
          <input id="email" name="email" type="email" required maxLength={200} className="input" autoComplete={mode === "admin" ? "username" : "email"} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">{t.auth.password}</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            maxLength={200}
            minLength={mode === "register" ? 8 : undefined}
            className="input"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            placeholder={mode === "register" ? t.auth.passwordHint : ""}
          />
        </div>
        {mode === "register" && <ConsentCheckbox id="consent-register" />}
      </div>

      {needCode && (
        <div>
          <label className="label" htmlFor="code">{t.auth.code}</label>
          <input
            id="code"
            ref={codeRef}
            name="code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            className="input text-center text-lg tracking-[0.4em]"
            placeholder="000000"
          />
          <p className="mt-1.5 text-xs text-muted">{t.auth.codeHint}</p>
        </div>
      )}

      {state?.error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{state.error}</p>}

      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? t.auth.wait : mode === "register" ? t.auth.submitRegister : needCode ? t.auth.confirm : t.auth.submitLogin}
      </button>
    </form>
  );
}
