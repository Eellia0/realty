import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request";
import { MAX_UPLOAD_BYTES, UPLOAD_DIR, detectImageType } from "@/lib/uploads";

// Загрузка фото объектов. Файлы лежат на диске в папке uploads.
// Позже можно заменить на S3-хранилище, не меняя остальной код.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Запрос отклонён" }, { status: 403 });
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN" || !user.totpEnabled) {
    return NextResponse.json({ error: "Нет доступа" }, { status: 403 });
  }

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "Файл больше 10 МБ" }, { status: 413 });
  }

  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Файл больше 10 МБ" }, { status: 413 });

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = detectImageType(buf);
  if (!ext) return NextResponse.json({ error: "Поддерживаются только JPG, PNG и WEBP" }, { status: 400 });

  const name = `${crypto.randomUUID()}.${ext}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), buf, { flag: "wx" });
  return NextResponse.json({ url: `/uploads/${name}` });
}
