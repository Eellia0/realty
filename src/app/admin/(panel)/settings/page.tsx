import { getSettings } from "@/lib/settings";
import { isMailConfigured } from "@/lib/mailer";
import { getBotUsername, isTelegramConfigured } from "@/lib/telegram";
import { trustedSiteUrl } from "@/lib/site-url";
import { SettingsForm, TestNotificationButton } from "@/components/admin/SettingsForms";
import { MailIcon, TelegramIcon } from "@/components/icons";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`badge ${ok ? "bg-accent-soft text-accent-dark" : "bg-sun-soft text-[#9a6413]"}`}>
      {ok ? "✓ " : ""}
      {label}
    </span>
  );
}

export default async function AdminSettingsPage() {
  const [settings, botName] = await Promise.all([getSettings(), getBotUsername()]);
  const tgReady = isTelegramConfigured();
  const mailReady = isMailConfigured();
  const siteUrlReady = Boolean(trustedSiteUrl());

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-extrabold">Настройки</h1>

      <SettingsForm settings={settings} />

      <section className="card space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-bold">Уведомления о заявках</h2>
          <p className="mt-0.5 text-sm text-muted">
            Ключи для Telegram и почты хранятся в файле .env, а не в базе: так они не попадут в резервные копии и не видны в админке.
            После изменения .env сайт нужно перезапустить.
          </p>
        </div>

        {!siteUrlReady && (
          <p className="rounded-xl bg-sun-soft px-3 py-2 text-sm text-[#9a6413]">
            Не задан SITE_URL в .env. Без него в уведомлениях не будет ссылок, а восстановление пароля не отправит письмо.
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl bg-bg p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <TelegramIcon className="h-5 w-5 text-[#229ed9]" /> Telegram
              </span>
              <Status ok={tgReady} label={tgReady ? `бот @${botName ?? "?"}` : "не настроен"} />
            </div>
            <TestNotificationButton channel="telegram" label="Отправить проверку" />
            <details className="text-sm text-muted">
              <summary className="cursor-pointer font-medium text-accent-dark">Как подключить</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>В Telegram откройте @BotFather, отправьте /newbot и придумайте имя боту.</li>
                <li>Скопируйте токен в .env: TELEGRAM_BOT_TOKEN.</li>
                <li>Напишите своему боту любое сообщение. Для группы добавьте бота в группу и напишите там.</li>
                <li>В папке проекта выполните npm run telegram -- chat-id и скопируйте номер в TELEGRAM_CHAT_ID.</li>
                <li>Перезапустите сайт и нажмите «Отправить проверку».</li>
              </ol>
            </details>
          </div>

          <div className="space-y-3 rounded-2xl bg-bg p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                <MailIcon className="h-5 w-5 text-sea" /> Почта
              </span>
              <Status ok={mailReady} label={mailReady ? "настроена" : "не настроена"} />
            </div>
            <TestNotificationButton channel="email" label="Отправить проверку" />
            <details className="text-sm text-muted">
              <summary className="cursor-pointer font-medium text-accent-dark">Как подключить Яндекс Почту</summary>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Откройте id.yandex.ru, раздел «Безопасность», затем «Пароли приложений».</li>
                <li>Создайте пароль для приложения «Почта».</li>
                <li>
                  Заполните в .env: SMTP_HOST=smtp.yandex.ru, SMTP_PORT=465, SMTP_USER и MAIL_FROM — ваш адрес на Яндексе,
                  SMTP_PASS — пароль приложения.
                </li>
                <li>Выше укажите «Почту для заявок», сохраните, перезапустите сайт и нажмите «Отправить проверку».</li>
              </ol>
              <p className="mt-2">Эта же почта отправляет пользователям письма для восстановления пароля.</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
