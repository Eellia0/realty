import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { CATALOG_STATUSES } from "@/lib/constants";
import { siteUrl } from "@/lib/site-url";
import { propertyPath } from "@/lib/slug";

// Карта собирается при каждом запросе, чтобы новые объекты сразу в неё попадали.
export const dynamic = "force-dynamic";

// Карта сайта для поисковиков: главные страницы и все опубликованные объекты.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const properties = await db.property.findMany({
    where: { status: { in: CATALOG_STATUSES } },
    select: { id: true, title: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  const latest = properties[0]?.updatedAt ?? new Date();

  return [
    { url: `${base}/`, lastModified: latest, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalog`, lastModified: latest, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/contacts`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...properties.map((p) => ({
      url: `${base}${propertyPath(p)}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
