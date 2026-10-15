import type { Metadata } from "next";
import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { ResetPasswordForm } from "@/components/PasswordForms";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.reset, robots: { index: false } };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token }, { t, lp }] = await Promise.all([searchParams, getI18n()]);
  const valid = typeof token === "string" && /^[0-9a-f]{64}$/.test(token);

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{t.password.resetTitle}</h1>
        {valid ? (
          <>
            <p className="mt-1 mb-6 text-sm text-muted">{t.password.resetText}</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            {t.password.badLink}{" "}
            <Link href={lp("/forgot-password")} className="font-semibold text-accent-dark underline">{t.password.requestNew}</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
