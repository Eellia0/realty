import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Вход для администратора", robots: { index: false } };

export default async function AdminLoginPage() {
  if ((await getCurrentUser())?.role === "ADMIN") redirect("/admin");

  return (
    <div className="container-page flex justify-center py-16">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <span className="badge bg-accent-soft text-accent-dark">Админ-панель</span>
        <h1 className="mt-3 text-2xl font-extrabold">Вход для администратора</h1>
        <p className="mt-1 mb-6 text-sm text-muted">Управление объектами и заявками.</p>
        <AuthForm mode="admin" next="/admin" />
      </div>
    </div>
  );
}
