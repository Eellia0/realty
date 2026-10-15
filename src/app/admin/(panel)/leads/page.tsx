import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";

export default async function AdminLeadsPage() {
  const leads = await db.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { property: { select: { id: true, title: true } } },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold">Заявки на просмотр</h1>
      {leads.length === 0 ? (
        <div className="card p-10 text-center text-muted">Заявок пока нет.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="p-4 font-medium">Дата</th>
                <th className="p-4 font-medium">Объект</th>
                <th className="p-4 font-medium">Клиент</th>
                <th className="p-4 font-medium">Комментарий</th>
                <th className="w-44 p-4 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l) => (
                <tr key={l.id} className={l.status === "NEW" ? "bg-accent-soft/40" : ""}>
                  <td className="p-4 whitespace-nowrap text-muted">{formatDate(l.createdAt)}</td>
                  <td className="p-4">
                    {l.property ? (
                      <Link href={`/admin/properties/${l.property.id}`} className="font-medium hover:underline">{l.property.title}</Link>
                    ) : l.source === "CONTACTS" ? (
                      <span className="badge bg-sea-soft text-sea">Общая заявка: подбор</span>
                    ) : (
                      <span className="text-muted">Объект удалён</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-medium">
                      {l.name}
                      {l.locale === "en" && <span className="badge bg-sea-soft text-sea" title="Заявка с английской версии сайта">EN</span>}
                    </div>
                    <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="text-accent-dark hover:underline">{l.phone}</a>
                  </td>
                  <td className="max-w-xs p-4 text-muted">{l.message || "—"}</td>
                  <td className="p-4"><LeadStatusSelect id={l.id} status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
