import path from "node:path";
import { unlink } from "node:fs/promises";

export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "uploads");
/** Исходный файл может быть большим: после сжатия он всё равно станет лёгким. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const EXT_TO_MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Имя файла в папке uploads: основной файл или его уменьшенная копия с суффиксом -thumb. */
export const UPLOAD_NAME_RE = /^[0-9a-f-]{36}(-thumb)?\.(jpg|png|webp)$/;
/** Адрес основного фото, который хранится в базе. */
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

/** Удаляет файлы фото с диска: основной и уменьшенную копию. Отсутствующие файлы пропускаются. */
export async function deleteUploadFiles(urls: string[]) {
  const names = urls
    .filter((u) => UPLOAD_URL_RE.test(u))
    .flatMap((u) => {
      const name = u.slice("/uploads/".length);
      return [name, name.replace(/\.webp$/, "-thumb.webp")];
    })
    .filter((n, i, arr) => UPLOAD_NAME_RE.test(n) && arr.indexOf(n) === i);
  await Promise.all(
    names.map((n) =>
      unlink(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, n)).catch((e: NodeJS.ErrnoException) => {
        // Файла уже нет — это нормально. Остальные ошибки пишем в журнал, чтобы мусор на диске не копился молча.
        if (e.code !== "ENOENT") console.warn(`[фото] Не удалось удалить ${n}: ${e.code ?? e.message}`);
      }),
    ),
  );
}
