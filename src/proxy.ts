import { NextResponse, type NextRequest } from "next/server";

// Выполняется перед каждой страницей:
// 1. Язык: адреса /en/… отдаются английской версией. Префикс снимается (страницы общие для обоих языков),
//    а язык передаётся странице в заголовке x-locale. Админка только на русском: /en/admin → /admin.
// 2. Ставит Content-Security-Policy с одноразовым nonce. Браузер выполнит только скрипты Next.js
//    и то, что они подгрузили сами (Яндекс Карты). Внедрённый посторонний скрипт не запустится.
// 3. Быстро отсекает анонимные запросы к админке. Полная проверка прав остаётся в layout и в каждом действии.

const isDev = process.env.NODE_ENV === "development";

function csp(nonce: string, https: boolean) {
  const yandex = "https://yandex.ru https://*.yandex.ru https://*.yandex.net https://yastatic.net https://*.yandex.com";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${yandex}${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${yandex}`,
    `font-src 'self' data: ${yandex}`,
    `connect-src 'self' ${yandex}${isDev ? " ws:" : ""}`,
    // Видео объектов: только YouTube (без cookie), RuTube и VK Видео.
    `frame-src ${yandex} https://www.youtube-nocookie.com https://rutube.ru https://vkvideo.ru https://vk.com`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  let pathname = url.pathname;
  let locale = "ru";

  if (pathname === "/en" || pathname.startsWith("/en/")) {
    locale = "en";
    pathname = pathname.slice(3) || "/";
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL(pathname + url.search, request.url));
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const hasSession = request.cookies.has("session") || request.cookies.has("__Host-session");
    if (!hasSession) return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const https = url.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const policy = csp(nonce, https);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  requestHeaders.set("x-locale", locale);
  // Адрес без языкового префикса: по нему переключатель языка строит ссылку на ту же страницу.
  requestHeaders.set("x-path", pathname + url.search);

  let response: NextResponse;
  if (locale !== "ru") {
    const target = url.clone();
    target.pathname = pathname;
    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } });
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

// Все страницы, включая предзагрузку: иначе английские ссылки предзагружались бы без перевода адреса.
export const config = {
  matcher: ["/((?!api|uploads|_next/static|_next/image|favicon.ico).*)"],
};
