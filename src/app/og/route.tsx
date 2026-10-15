import { ImageResponse } from "next/og";
import { OG_COLORS, OG_FONT_FAMILY, OG_SIZE, ogFonts } from "@/lib/og";
import { getI18n } from "@/i18n/server";
import { OgBrand } from "@/components/og/OgBrand";

// Картинка-превью сайта по умолчанию (главная, каталог, контакты) на языке адреса: /og или /en/og.
export async function GET() {
  const { t } = await getI18n();
  const cities = Object.values(t.labels.regions).slice(0, 4).map((r) => r.split(" (")[0]);
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: OG_COLORS.gradient, color: "#ffffff", fontFamily: OG_FONT_FAMILY }}>
        <OgBrand name={t.meta.siteName} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>{t.home.ogTitle}</div>
          <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.88 }}>{t.home.ogSubtitle}</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {cities.map((c) => (
            <div key={c} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.16)", fontSize: 26, fontWeight: 700 }}>
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
