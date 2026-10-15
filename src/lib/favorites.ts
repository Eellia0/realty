import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { getCurrentUser } from "./auth";

// Избранное гостя хранится в cookie списком id через запятую.
// После входа или регистрации оно переносится в аккаунт.
const GUEST_COOKIE = "guest_favs";
const GUEST_LIMIT = 200;

export async function getGuestFavoriteIds(): Promise<number[]> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value ?? "";
  return raw
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
}

export async function setGuestFavoriteIds(ids: number[]) {
  const unique = [...new Set(ids)].slice(-GUEST_LIMIT);
  (await cookies()).set(GUEST_COOKIE, unique.join(","), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/** id избранных объектов: из БД для пользователя, из cookie для гостя. */
export async function getFavoriteIds(): Promise<number[]> {
  const user = await getCurrentUser();
  if (!user) return getGuestFavoriteIds();
  const rows = await db.favorite.findMany({
    where: { userId: user.id },
    select: { propertyId: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => r.propertyId);
}

/** Переносит избранное гостя в аккаунт и очищает cookie. */
export async function mergeGuestFavorites(userId: number) {
  const ids = await getGuestFavoriteIds();
  if (!ids.length) return;
  const existing = await db.property.findMany({ where: { id: { in: ids } }, select: { id: true } });
  for (const { id } of existing) {
    await db.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId: id } },
      create: { userId, propertyId: id },
      update: {},
    });
  }
  (await cookies()).delete(GUEST_COOKIE);
}
