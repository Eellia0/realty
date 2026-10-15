import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Регистрация" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/");
  const nextQ = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className="container-page flex justify-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold">Регистрация</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Объекты, которые вы уже добавили в избранное, сохранятся в аккаунте.</p>
        <AuthForm mode="register" next={next} />
        <p className="mt-6 text-center text-sm text-muted">
          Уже есть аккаунт?{" "}
          <Link href={`/login${nextQ}`} className="font-semibold text-accent-dark hover:underline">Войти</Link>
        </p>
      </div>
    </div>
  );
}
