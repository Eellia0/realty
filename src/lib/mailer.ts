import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

// Отправка писем через SMTP. Настройки в .env:
// SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM.
// Для Яндекс Почты: smtp.yandex.ru, порт 465, пароль приложения из настроек Яндекс ID.

let transporter: Transporter | null = null;

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transport() {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 15_000,
  });
  return transporter;
}

export type Mail = { to: string; subject: string; text: string; html?: string };

/** Отправляет письмо. Возвращает false, если почта не настроена. */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!isMailConfigured()) {
    // В режиме разработки показываем письмо в консоли, чтобы можно было проверить ссылки.
    if (process.env.NODE_ENV !== "production") {
      console.info(`[почта не настроена] Письмо для ${mail.to}: ${mail.subject}\n${mail.text}`);
    } else {
      console.warn(`[почта не настроена] Письмо «${mail.subject}» не отправлено`);
    }
    return false;
  }
  await transport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return true;
}

/** Простой HTML-шаблон письма в цветах сайта. Все значения должны быть уже экранированы. */
export function mailLayout({ title, body, button }: { title: string; body: string; button?: { url: string; label: string } }) {
  const btn = button
    ? `<p style="margin:28px 0"><a href="${button.url}" style="display:inline-block;padding:12px 22px;border-radius:12px;background:#0e7c7b;color:#ffffff;text-decoration:none;font-weight:700">${button.label}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f6f2ea;font-family:Arial,Helvetica,sans-serif;color:#1c2b31">
<div style="max-width:560px;margin:0 auto;padding:32px 16px">
  <div style="background:linear-gradient(120deg,#0a5c5c,#0e7c7b,#1767a0);border-radius:18px 18px 0 0;padding:20px 24px;color:#ffffff;font-weight:800;font-size:18px">Новый адрес</div>
  <div style="background:#ffffff;border-radius:0 0 18px 18px;padding:24px">
    <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
    ${body}
    ${btn}
  </div>
</div></body></html>`;
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
