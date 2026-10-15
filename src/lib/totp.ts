import "server-only";
import { Secret, TOTP } from "otpauth";
import QRCode from "qrcode";
import { SITE_NAME } from "./site";

const PERIOD = 30;

function totpFor(secretBase32: string, label = "admin") {
  return new TOTP({
    issuer: SITE_NAME,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });
}

export function newTotpSecret() {
  return new Secret({ size: 20 }).base32;
}

/** Возвращает номер 30-секундного интервала принятого кода или null, если код неверный. */
export function verifyTotp(secretBase32: string, token: string): number | null {
  const clean = token.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const delta = totpFor(secretBase32).validate({ token: clean, window: 1 });
  if (delta === null) return null;
  return Math.floor(Date.now() / 1000 / PERIOD) + delta;
}

export async function totpQr(secretBase32: string, email: string) {
  const uri = totpFor(secretBase32, email).toString();
  return QRCode.toDataURL(uri, { margin: 1, width: 220 });
}
