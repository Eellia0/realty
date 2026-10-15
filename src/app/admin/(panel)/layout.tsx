import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Админ-панель", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") redirect("/admin/login");
  // Без двухфакторной защиты админка закрыта: сначала настройка 2FA.
  if (!user.totpEnabled) redirect("/admin/security");

  const newLeads = await db.lead.count({ where: { status: "NEW" } });

  return (
    <div className="container-page py-8">
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Link href="/admin" className="btn btn-secondary">Объекты</Link>
        <Link href="/admin/leads" className="btn btn-secondary">
          Заявки
          {newLeads > 0 && <span className="rounded-full bg-accent px-1.5 text-xs text-white">{newLeads}</span>}
        </Link>
        <Link href="/admin/security" className="btn btn-secondary">
          <ShieldIcon className="h-4 w-4" />
          Безопасность
        </Link>
        <Link href="/admin/properties/new" className="btn btn-primary ml-auto">+ Добавить объект</Link>
      </div>
      {children}
    </div>
  );
}
