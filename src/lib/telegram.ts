import "server-only";

// Уведомления в Telegram через бота. Настройки в .env:
// TELEGRAM_BOT_TOKEN — токен от @BotFather, TELEGRAM_CHAT_ID — куда писать (ваш чат или группа).
// Узнать TELEGRAM_CHAT_ID: напишите боту любое сообщение и выполните npm run telegram -- chat-id.

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

function api(method: string) {
  return `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`;
}

/** Экранирование для parse_mode=HTML. */
export function escapeTg(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
}

/** Отправляет сообщение. Возвращает false, если Telegram не настроен. */
export async function sendTelegram(html: string): Promise<boolean> {
  if (!isTelegramConfigured()) return false;
  const res = await fetch(api("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: html,
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { description?: string };
    throw new Error(`Telegram ответил ${res.status}: ${data.description ?? "без описания"}`);
  }
  return true;
}

/** Имя бота для страницы настроек. */
export async function getBotUsername(): Promise<string | null> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(api("getMe"), { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    const data = (await res.json()) as { ok: boolean; result?: { username?: string } };
    return data.ok ? (data.result?.username ?? null) : null;
  } catch {
    return null;
  }
}
