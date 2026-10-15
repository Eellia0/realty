import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/PasswordForms";

export const metadata: Metadata = { title: "Восстановление пароля", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Восстановление пароля</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Укажите email, с которым вы регистрировались. Мы пришлём ссылку для нового пароля.</p>
        <ForgotPasswordForm />
        <p className="mt-6 text-center text-sm text-muted">
          Вспомнили пароль?{" "}
          <Link href="/login" className="font-semibold text-accent-dark hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
