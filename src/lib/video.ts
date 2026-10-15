// Видео объекта: принимаем ссылки только на YouTube, RuTube и VK Видео
// и превращаем их в адрес для встраивания. Любые другие ссылки отклоняются,
// поэтому в iframe на странице не может попасть посторонний сайт.

export type VideoEmbed = { provider: "YouTube" | "RuTube" | "VK Видео"; src: string };

export function videoEmbed(url: string | null | undefined): VideoEmbed | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.toLowerCase().replace(/^(www|m)\./, "");

  if (host === "youtube.com" || host === "youtube-nocookie.com" || host === "youtu.be") {
    let id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
    const m = u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/);
    if (m) id = m[1];
    if (id && /^[\w-]{11}$/.test(id)) {
      // Вариант без cookie: YouTube не отслеживает посетителя, пока тот не запустит видео.
      return { provider: "YouTube", src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
    }
  }

  if (host === "rutube.ru") {
    const m = u.pathname.match(/^\/(?:video|play\/embed|shorts)\/([0-9a-f]{32})/);
    if (m) return { provider: "RuTube", src: `https://rutube.ru/play/embed/${m[1]}` };
  }

  if (host === "vk.com" || host === "vk.ru" || host === "vkvideo.ru") {
    const raw = `${u.pathname}${u.searchParams.get("z") ?? ""}`;
    const m = raw.match(/video(-?\d+)_(\d+)/);
    if (m) return { provider: "VK Видео", src: `https://vkvideo.ru/video_ext.php?oid=${m[1]}&id=${m[2]}&hd=2` };
  }
  return null;
}
