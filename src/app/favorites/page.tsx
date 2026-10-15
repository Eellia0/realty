import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { withCover } from "@/lib/properties";
import { getI18n } from "@/i18n/server";
import { PropertyCard } from "@/components/PropertyCard";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.favorites, robots: { index: false } };
}

export default async function FavoritesPage() {
  const [user, ids, { t, lp }] = await Promise.all([getCurrentUser(), getFavoriteIds(), getI18n()]);
  const found = ids.length
    ? await db.property.findMany({ where: { id: { in: ids }, status: { not: "DRAFT" } }, include: withCover })
    : [];
  // Сохраняем порядок: последние добавленные первыми.
  const order = new Map(ids.map((id, i) => [id, i]));
  const items = found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  if (!user) items.reverse(); // у гостя в cookie новые id в конце
  const back = encodeURIComponent(lp("/favorites"));

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">{t.favorites.title}</h1>

      {!user && (
        <div className="mb-6 rounded-2xl bg-accent-soft p-4 text-sm text-accent-dark">
          {t.favorites.guestBefore}{" "}
          <Link href={lp(`/register?next=${back}`)} className="font-semibold underline">{t.favorites.register}</Link> {t.favorites.or}{" "}
          <Link href={lp(`/login?next=${back}`)} className="font-semibold underline">{t.favorites.login}</Link>
          {t.favorites.guestAfter}
        </div>
      )}

      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <PropertyCard key={p.id} p={p} isFavorite />)}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-muted">{t.favorites.empty}</p>
          <Link href={lp("/catalog")} className="btn btn-primary mt-4">{t.favorites.toCatalog}</Link>
        </div>
      )}
    </div>
  );
}
