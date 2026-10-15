import Link from "next/link";
import { db } from "@/lib/db";
import { PROPERTY_STATUSES, PROPERTY_TYPES, REGIONS, isKeyOf, labelOf } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { withCover } from "@/lib/properties";
import { StatusBadge } from "@/components/StatusBadge";
import { ImagePlaceholder } from "@/components/icons";
import { DeletePropertyButton } from "@/components/admin/DeletePropertyButton";

/* eslint-disable @next/next/no-img-element */
export default async function AdminPropertiesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const activeStatus = isKeyOf(PROPERTY_STATUSES, status) ? status : undefined;

  const [items, counts] = await Promise.all([
    db.property.findMany({
      where: activeStatus ? { status: activeStatus } : {},
      orderBy: { updatedAt: "desc" },
      include: { ...withCover, _count: { select: { favorites: true, leads: true } } },
    }),
    db.property.groupBy({ by: ["status"], _count: true }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((sum, c) => sum + c._count, 0);

  const tab = (href: string, label: string, n: number, active: boolean) => (
    <Link
      key={href}
      href={href}
      className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${active ? "bg-ink text-white" : "bg-surface ring-1 ring-line hover:bg-warm"}`}
    >
      {label} <span className="opacity-60">{n}</span>
    </Link>
  );

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">Объекты</h1>
      <div className="mb-6 flex flex-wrap gap-2">
        {tab("/admin", "Все", total, !activeStatus)}
        {Object.entries(PROPERTY_STATUSES).map(([k, l]) => tab(`/admin?status=${k}`, l, countOf(k), activeStatus === k))}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Объектов пока нет.{" "}
          <Link href="/admin/properties/new" className="font-semibold text-accent-dark underline">Добавить первый</Link>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((p) => (
            <div key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                {p.images[0] ? <img src={p.images[0].url} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/properties/${p.id}`} className="font-semibold hover:underline">{p.title}</Link>
                  <StatusBadge status={p.status} />
                </div>
                <div className="mt-1 text-sm text-muted">
                  {labelOf(PROPERTY_TYPES, p.propertyType)} · {formatPrice(p.price, p.dealType)} · {labelOf(REGIONS, p.region)}, {p.address}
                </div>
                <div className="mt-1 text-xs text-muted">
                  В избранном: {p._count.favorites} · Заявок: {p._count.leads}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {p.status !== "DRAFT" && (
                  <Link href={`/property/${p.id}`} target="_blank" className="btn btn-secondary px-3 py-1.5">На сайте</Link>
                )}
                <Link href={`/admin/properties/${p.id}`} className="btn btn-secondary px-3 py-1.5">Изменить</Link>
                <DeletePropertyButton id={p.id} title={p.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
