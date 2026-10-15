import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { withCover } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";

export const metadata: Metadata = { title: "Избранное" };

export default async function FavoritesPage() {
  const [user, ids] = await Promise.all([getCurrentUser(), getFavoriteIds()]);
  const found = ids.length
    ? await db.property.findMany({ where: { id: { in: ids }, status: { not: "DRAFT" } }, include: withCover })
    : [];
  // Сохраняем порядок: последние добавленные первыми.
  const order = new Map(ids.map((id, i) => [id, i]));
  const items = found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  if (!user) items.reverse(); // у гостя в cookie новые id в конце

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Избранное</h1>

      {!user && (
        <div className="mb-6 rounded-2xl bg-accent-soft p-4 text-sm text-accent-dark">
          Избранное сохранено в этом браузере.{" "}
          <Link href="/register?next=/favorites" className="font-semibold underline">Зарегистрируйтесь</Link> или{" "}
          <Link href="/login?next=/favorites" className="font-semibold underline">войдите</Link>, чтобы оно было доступно на любом устройстве.
          Всё, что вы уже добавили, перенесётся в аккаунт.
        </div>
      )}

      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => <PropertyCard key={p.id} p={p} isFavorite />)}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <p className="text-muted">Здесь пока пусто. Нажмите на сердечко у объекта, чтобы сохранить его.</p>
          <Link href="/catalog" className="btn btn-primary mt-4">Перейти в каталог</Link>
        </div>
      )}
    </div>
  );
}
