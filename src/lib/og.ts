import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { UPLOAD_DIR, UPLOAD_URL_RE } from "./uploads";

// Общее для картинок-превью (Open Graph): шрифт сайта и фото объекта.

type OgFont = { name: string; data: ArrayBuffer; weight: 500 | 700 | 800; style: "normal" };

const FONT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "node_modules", "@fontsource", "manrope", "files");
let fonts: Promise<OgFont[]> | null = null;

/**
 * Manrope с латиницей и кириллицей в трёх начертаниях. Файлы читаются один раз.
 * Наборы символов подключаются под разными именами: с одинаковым именем генератор картинок
 * берёт только первый файл, и кириллица рисуется запасным шрифтом. В разметке используйте OG_FONT_FAMILY.
 */
export function ogFonts() {
  fonts ??= Promise.all(
    ([500, 700, 800] as const).flatMap((weight) =>
      ["latin", "cyrillic"].map(async (subset) => {
        const buf = await readFile(path.join(/*turbopackIgnore: true*/ FONT_DIR, `manrope-${subset}-${weight}-normal.woff`));
        return {
          name: subset === "latin" ? "Manrope" : "Manrope Cyrillic",
          data: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer,
          weight,
          style: "normal" as const,
        };
      }),
    ),
  );
  return fonts;
}

/** Фото объекта, обрезанное под размер превью, в виде data:-адреса для картинки. */
export async function ogPhoto(url: string, width: number, height: number): Promise<string | null> {
  if (!UPLOAD_URL_RE.test(url)) return null;
  try {
    const file = path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, url.slice("/uploads/".length));
    // Файл читается в память целиком: если отдать sharp путь, на Windows файл остаётся открытым
    // в кэше библиотеки и его потом нельзя удалить при удалении фото из объекта.
    const jpeg = await sharp(await readFile(file)).resize(width, height, { fit: "cover" }).jpeg({ quality: 82 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_FONT_FAMILY = "Manrope, 'Manrope Cyrillic'";
export const OG_COLORS = {
  bg: "#f6f2ea",
  ink: "#1c2b31",
  muted: "#5f6f76",
  accent: "#0e7c7b",
  accentDark: "#0a5c5c",
  sea: "#1767a0",
  seaSoft: "#e0eef8",
  sun: "#e3a03a",
  sunSoft: "#fbf0db",
  gradient: "linear-gradient(135deg, #0a5c5c 0%, #0e7c7b 45%, #1767a0 100%)",
};
