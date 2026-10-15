// Помощник для настройки уведомлений в Telegram.
//
//   npm run telegram -- chat-id   показать чаты, которые писали боту (нужно для TELEGRAM_CHAT_ID)
//
// Перед запуском заполните TELEGRAM_BOT_TOKEN в .env и напишите боту любое сообщение.

const token = process.env.TELEGRAM_BOT_TOKEN;

type Update = {
  message?: { chat: { id: number; type: string; title?: string; username?: string; first_name?: string } };
  my_chat_member?: { chat: { id: number; type: string; title?: string; username?: string } };
};

async function chatId() {
  if (!token) throw new Error("Сначала впишите TELEGRAM_BOT_TOKEN в файл .env");
  const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
  const data = (await res.json()) as { ok: boolean; description?: string; result?: Update[] };
  if (!data.ok) throw new Error(`Telegram ответил ошибкой: ${data.description ?? "неизвестно"}`);

  const chats = new Map<number, string>();
  for (const u of data.result ?? []) {
    const chat = u.message?.chat ?? u.my_chat_member?.chat;
    if (!chat) continue;
    const name = "title" in chat && chat.title ? `группа «${chat.title}»` : `личный чат ${chat.username ? "@" + chat.username : ""}`.trim();
    chats.set(chat.id, name);
  }
  if (!chats.size) {
    console.log("Сообщений пока нет. Напишите боту любое сообщение (или добавьте его в группу и напишите там) и запустите команду снова.");
    return;
  }
  console.log("Найденные чаты. Скопируйте нужный номер в TELEGRAM_CHAT_ID в файле .env:\n");
  for (const [id, name] of chats) console.log(`  ${id}   ${name}`);
}

const commands: Record<string, () => Promise<void>> = { "chat-id": chatId };
(commands[process.argv[2]] ?? (async () => console.log("Команды: chat-id")))().catch((e) => {
  console.error("Ошибка:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
