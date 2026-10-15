import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { AuthForm } from "@/components/AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.login, robots: { index: false } };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; reset?: string }> }) {
  const [{ next, reset }, { t, lp }] = await Promise.all([searchParams, getI18n()]);
  if (await getCurrentUser()) redirect(lp("/"));
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{t.auth.loginTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{t.auth.loginText}</p>
        {reset === "1" && <p className="mb-4 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-dark">{t.auth.resetDone}</p>}
        <AuthForm mode="login" next={next} />
        <div className="mt-4 text-center">
          <Link href={lp("/forgot-password")} className="text-sm font-medium text-muted hover:text-ink hover:underline">
            {t.auth.forgot}
          </Link>
        </div>
        <p className="mt-4 text-center text-sm text-muted">
          {t.auth.noAccount}{" "}
          <Link href={lp(`/register${nextQ}`)} className="font-semibold text-accent-dark hover:underline">{t.auth.registerLink}</Link>
        </p>
      </div>
    </div>
  );
}
