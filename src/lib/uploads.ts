import path from "node:path";

export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const EXT_TO_MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

export const UPLOAD_NAME_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;
export const UPLOAD_URL_RE = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * Определяет тип картинки по первым байтам файла, а не по заявленному MIME-типу,
 * который клиент может подделать. Всё, что не JPEG, PNG или WEBP, отклоняется.
 */
export function detectImageType(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}
