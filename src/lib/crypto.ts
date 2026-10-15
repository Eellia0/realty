import "server-only";
import crypto from "node:crypto";

// AES-256-GCM для секретов, которые нельзя хранить в БД открытым текстом (секрет 2FA).
// Даже если дамп базы утечёт, без APP_SECRET из .env секреты не расшифровать.

function key() {
  const hex = process.env.APP_SECRET ?? "";
  if (!/^[0-9a-f]{64}$/i.test(hex)) throw new Error("APP_SECRET должен быть 64 hex-символа (32 байта)");
  return Buffer.from(hex, "hex");
}

export function encrypt(plain: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(payload: string) {
  const [iv, tag, data] = payload.split(".").map((p) => Buffer.from(p, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

export function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}
