import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Собирается при запросе: адрес сайта берётся из настроек на момент работы, а не сборки.
export const dynamic = "force-dynamic";

// Поисковикам открыт каталог и страницы объектов. Админка, вход и личные страницы закрыты.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/favorites", "/login", "/register", "/forgot-password", "/reset-password"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
