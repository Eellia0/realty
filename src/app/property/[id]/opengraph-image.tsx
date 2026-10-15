import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { PROPERTY_TYPES, REGIONS, labelOf } from "@/lib/constants";
import { formatPrice, propertyMeta, seaDistanceLabel } from "@/lib/format";
import { OG_COLORS, OG_FONT_FAMILY, OG_SIZE, ogFonts, ogPhoto } from "@/lib/og";
import { withCover } from "@/lib/properties";
import { parsePropertyParam } from "@/lib/slug";
import { OgBrand } from "@/components/og/OgBrand";

// Картинка-превью объекта для мессенджеров и соцсетей: фото слева, цена и главное справа.
export const alt = "Объект недвижимости на Северном Кипре";
export const size = OG_SIZE;
export const contentType = "image/png";
// Цена и фото могут поменяться, поэтому картинка собирается заново при каждом запросе.
export const dynamic = "force-dynamic";

const PHOTO_W = 560;

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

function Chip({ children, bg, color }: { children: string; bg: string; color: string }) {
  return (
    <div style={{ display: "flex", padding: "8px 18px", borderRadius: 12, background: bg, color, fontSize: 24, fontWeight: 700 }}>
      {children}
    </div>
  );
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = parsePropertyParam((await params).id);
  const p = id ? await db.property.findFirst({ where: { id, status: { not: "DRAFT" } }, include: withCover }) : null;
  const fonts = await ogFonts();

  if (!p) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: "100%", padding: 72, background: OG_COLORS.gradient, fontFamily: OG_FONT_FAMILY }}>
          <OgBrand />
        </div>
      ),
      { ...size, fonts },
    );
  }

  const photo = p.images[0] ? await ogPhoto(p.images[0].url, PHOTO_W, size.height) : null;
  const sea = seaDistanceLabel(p.seaDistance);
  const place = [p.district, labelOf(REGIONS, p.region)].filter(Boolean).join(", ");

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: OG_COLORS.bg, fontFamily: OG_FONT_FAMILY }}>
        <div style={{ display: "flex", position: "relative", width: PHOTO_W, height: size.height, background: OG_COLORS.gradient }}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} width={PHOTO_W} height={size.height} alt="" style={{ objectFit: "cover" }} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
              <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2">
                <path strokeLinejoin="round" d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z" />
              </svg>
            </div>
          )}
          <div style={{ display: "flex", position: "absolute", left: 28, bottom: 28, padding: "10px 20px", borderRadius: 999, background: "rgba(28,43,49,0.78)", color: "#ffffff", fontSize: 26, fontWeight: 700 }}>
            {labelOf(PROPERTY_TYPES, p.propertyType)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "44px 52px" }}>
          <OgBrand color={OG_COLORS.accentDark} tile={OG_COLORS.accent} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 66, fontWeight: 800, color: OG_COLORS.accentDark, lineHeight: 1 }}>{formatPrice(p.price, p.dealType)}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: OG_COLORS.ink, lineHeight: 1.2 }}>{clip(p.title, 64)}</div>
            <div style={{ fontSize: 27, fontWeight: 500, color: OG_COLORS.muted }}>{propertyMeta(p)}</div>
            <div style={{ fontSize: 27, fontWeight: 500, color: OG_COLORS.muted }}>{clip(place, 48)}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {sea && <Chip bg={OG_COLORS.seaSoft} color={OG_COLORS.sea}>{sea}</Chip>}
            {p.seaView && <Chip bg={OG_COLORS.seaSoft} color={OG_COLORS.sea}>Вид на море</Chip>}
            {p.installment && <Chip bg={OG_COLORS.sunSoft} color="#7a5210">Рассрочка</Chip>}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
