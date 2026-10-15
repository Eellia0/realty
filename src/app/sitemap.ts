import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CATALOG_STATUSES } from "@/lib/constants";
import { siteUrl } from "@/lib/site-url";
import { propertyPath } from "@/lib/slug";
import { LOCALES, localizePath } from "@/i18n/config";

// Карта собирается при каждом запросе, чтобы новые объекты сразу в неё попадали.
export const dynamic = "force-dynamic";

// Карта сайта для поисковиков: главные страницы и все опубликованные объекты на обоих языках.
// У каждого адреса указаны его версии на других языках (hreflang).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const properties = await db.property.findMany({
    where: { status: { in: CATALOG_STATUSES } },
    select: { id: true, title: true, titleEn: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const latest = properties[0]?.updatedAt ?? new Date();

  const pages: { path: string; lastModified?: Date; changeFrequency: "daily" | "weekly" | "monthly" | "yearly"; priority: number }[] = [
    { path: "/", lastModified: latest, changeFrequency: "daily", priority: 1 },
    { path: "/catalog", lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { path: "/contacts", changeFrequency: "monthly", priority: 0.5 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
  ];

  const staticEntries = pages.flatMap((p) => {
    const languages = Object.fromEntries(LOCALES.map((l) => [l, `${base}${localizePath(l, p.path)}`]));
    return LOCALES.map((l) => ({
      url: `${base}${localizePath(l, p.path)}`,
      lastModified: p.lastModified,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
      alternates: { languages },
    }));
  });

  const propertyEntries = properties.flatMap((p) => {
    const languages = Object.fromEntries(LOCALES.map((l) => [l, `${base}${propertyPath(p, l)}`]));
    return LOCALES.map((l) => ({
      url: `${base}${propertyPath(p, l)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      alternates: { languages },
    }));
  });

  return [...staticEntries, ...propertyEntries];
}
