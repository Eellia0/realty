import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { MAX_UPLOAD_BYTES, UPLOAD_DIR, detectImageType } from "@/lib/uploads";

// Загрузка фото объектов. Каждое фото сжимается:
// основной файл до 2000 px по длинной стороне и уменьшенная копия до 720 px для карточек, обе в WebP.
// Ориентация берётся из данных камеры, а сами данные (включая GPS) удаляются.
// Файлы лежат на диске в папке uploads; позже их можно перенести в облачное хранилище.

const MAIN_SIZE = 2000;
const THUMB_SIZE = 720;
const MAX_PIXELS = 60_000_000; // защита от «картинок-бомб» огромного разрешения

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN" || !user.totpEnabled) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Файл больше 20 МБ" }, { status: 413 });
  }

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Файл больше 20 МБ" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  if (!detectImageType(buf)) return NextResponse.json({ error: "Поддерживаются только JPG, PNG и WEBP" }, { status: 400 });

  let main: Buffer;
  let thumb: Buffer;
  try {
    const image = sharp(buf, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
    [main, thumb] = await Promise.all([
      image.clone().resize({ width: MAIN_SIZE, height: MAIN_SIZE, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
      image.clone().resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer(),
    ]);
  } catch {
    return NextResponse.json({ error: "Не удалось прочитать изображение. Попробуйте другой файл." }, { status: 400 });
  }

  const id = crypto.randomUUID();
  await mkdir(UPLOAD_DIR, { recursive: true });
  await Promise.all([
    writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, `${id}.webp`), main, { flag: "wx" }),
    writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, `${id}-thumb.webp`), thumb, { flag: "wx" }),
  ]);
  return NextResponse.json({ url: `/uploads/${id}.webp`, size: main.length });
}
