import { SITE_NAME } from "@/lib/site";

/** Логотип для картинок-превью: квадрат с домиком и название сайта. */
export function OgBrand({ color = "#ffffff", tile = "rgba(255,255,255,0.18)", iconColor = "#ffffff" }: {
  color?: string; tile?: string; iconColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, color, fontSize: 30, fontWeight: 800 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: 16, background: tile }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8">
          <path strokeLinejoin="round" d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      </div>
      {SITE_NAME}
    </div>
  );
}
