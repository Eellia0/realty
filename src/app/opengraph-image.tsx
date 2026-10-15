import { ImageResponse } from "next/og";
import { OG_COLORS, OG_FONT_FAMILY, OG_SIZE, ogFonts } from "@/lib/og";
import { OgBrand } from "@/components/og/OgBrand";

// Картинка-превью сайта по умолчанию: главная, каталог, контакты.
export const alt = "Новый адрес — недвижимость на Северном Кипре";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 72, background: OG_COLORS.gradient, color: "#ffffff", fontFamily: OG_FONT_FAMILY }}>
        <OgBrand />
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>Дом у Средиземного моря</div>
          <div style={{ fontSize: 34, fontWeight: 500, opacity: 0.88 }}>Апартаменты, пентхаусы и виллы на Северном Кипре</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {["Кирения", "Искеле", "Фамагуста", "Никосия"].map((c) => (
            <div key={c} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "rgba(255,255,255,0.16)", fontSize: 26, fontWeight: 700 }}>
              {c}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
