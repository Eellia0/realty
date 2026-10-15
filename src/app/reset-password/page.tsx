import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/PasswordForms";

export const metadata: Metadata = { title: "Новый пароль", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && /^[0-9a-f]{64}$/.test(token);

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Новый пароль</h1>
        {valid ? (
          <>
            <p className="mt-1 mb-6 text-sm text-muted">Придумайте новый пароль. После сохранения войдите с ним на сайт.</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">
            Ссылка повреждена. <Link href="/forgot-password" className="font-semibold text-accent-dark underline">Запросите новую</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
