import type { NextConfig } from "next";

const securityHeaders = [
  // Запрет показа сайта во фрейме на чужих страницах (кликджекинг).
  { key: "X-Frame-Options", value: "DENY" },
  // Браузер не угадывает тип файла по содержимому.
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Сайту не нужны камера и микрофон. Геолокация разрешена только своему домену.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=(), geolocation=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS на год вперёд. Браузеры учитывают заголовок только при работе по HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
