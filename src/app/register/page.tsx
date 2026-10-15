import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/i18n/server";
import { AuthForm } from "@/components/AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.register, robots: { index: false } };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t, lp }] = await Promise.all([searchParams, getI18n()]);
  if (await getCurrentUser()) redirect(lp("/"));
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">{t.auth.registerTitle}</h1>
        <p className="mt-1 mb-6 text-sm text-muted">{t.auth.registerText}</p>
        <AuthForm mode="register" next={next} />
        <p className="mt-6 text-center text-sm text-muted">
          {t.auth.haveAccount}{" "}
          <Link href={lp(`/login${nextQ}`)} className="font-semibold text-accent-dark hover:underline">{t.auth.loginLink}</Link>
        </p>
      </div>
    </div>
  );
}
