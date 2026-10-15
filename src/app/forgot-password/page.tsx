import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { ForgotPasswordForm } from "@/components/PasswordForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.forgot, robots: { index: false } };
}

export default async function ForgotPasswordPage() {
  const { t, lp } = await getI18n();
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{t.password.forgotTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{t.password.forgotText}</p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted">
          {t.password.remembered}{" "}
          <Link href={lp("/login")} className="font-semibold text-accent-dark hover:underline">{t.auth.loginLink}</Link>
        </p>
      </div>
    </div>
  );
}
