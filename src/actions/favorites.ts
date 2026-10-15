"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getGuestFavoriteIds, setGuestFavoriteIds } from "@/lib/favorites";

/** Переключает избранное и возвращает новое состояние. */
export async function toggleFavorite(propertyId: number): Promise<boolean> {
  if (!Number.isInteger(propertyId) || propertyId <= 0) throw new Error("Некорректный объект");

  const property = await db.property.findFirst({
    where: { id: propertyId, status: { not: "DRAFT" } },
    select: { id: true },
  });
  if (!property) throw new Error("Объект не найден");

  const user = await getCurrentUser();
  if (user) {
    const key = { userId_propertyId: { userId: user.id, propertyId } };
    if (await db.favorite.findUnique({ where: key })) {
      await db.favorite.delete({ where: key });
      return false;
    }
    await db.favorite.create({ data: { userId: user.id, propertyId } });
    return true;
  }

  const ids = await getGuestFavoriteIds();
  if (ids.includes(propertyId)) {
    await setGuestFavoriteIds(ids.filter((id) => id !== propertyId));
    return false;
  }
  await setGuestFavoriteIds([...ids, propertyId]);
  return true;
}
