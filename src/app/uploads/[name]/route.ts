import path from "node:path";
import { readFile } from "node:fs/promises";
import { EXT_TO_MIME, UPLOAD_DIR, UPLOAD_NAME_RE } from "@/lib/uploads";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!UPLOAD_NAME_RE.test(name)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
    const ext = name.split(".").pop()!;
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": EXT_TO_MIME[ext],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
