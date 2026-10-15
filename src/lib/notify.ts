import "server-only";
import { db } from "./db";
import { REGIONS, labelOf } from "./constants";
import { escapeHtml, mailLayout, sendMail } from "./mailer";
import { getSettings } from "./settings";
import { escapeTg, sendTelegram } from "./telegram";
import { CURRENCY } from "./site";
import { propertyPath } from "./slug";

const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

/**
 * Уведомляет о новой заявке во все настроенные каналы: Telegram и почту.
 * Вызывается после ответа посетителю, поэтому ошибки отправки ему не видны, а пишутся в лог.
 */
export async function notifyNewLead(leadId: number, baseUrl: string | null) {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { property: { select: { id: true, title: true, price: true, region: true, district: true } } },
  });
  if (!lead) return;
  const settings = await getSettings();

  const p = lead.property;
  const propertyLine = p
    ? `${p.title}, ${CURRENCY.symbol}${nf.format(p.price)}, ${[p.district, labelOf(REGIONS, p.region)].filter(Boolean).join(", ")}`
    : lead.source === "CONTACTS"
      ? "Общая заявка со страницы контактов"
      : "Объект удалён";
  const propertyUrl = p && baseUrl ? `${baseUrl}${propertyPath(p)}` : null;
  const adminUrl = baseUrl ? `${baseUrl}/admin/leads` : null;

  const tg = [
    "🏠 <b>Новая заявка</b>",
    "",
    `<b>Имя:</b> ${escapeTg(lead.name)}`,
    `<b>Телефон:</b> ${escapeTg(lead.phone)}`,
    lead.message ? `<b>Сообщение:</b> ${escapeTg(lead.message)}` : null,
    `<b>Объект:</b> ${escapeTg(propertyLine)}`,
    propertyUrl ? `<a href="${propertyUrl}">Открыть объект</a>` : null,
    adminUrl ? `<a href="${adminUrl}">Все заявки в админке</a>` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const text = [
    "Новая заявка на сайте",
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.message ? `Сообщение: ${lead.message}` : null,
    `Объект: ${propertyLine}`,
    propertyUrl ? `Объект на сайте: ${propertyUrl}` : null,
    adminUrl ? `Все заявки: ${adminUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const html = mailLayout({
    title: "Новая заявка",
    body: `<table style="border-collapse:collapse;font-size:15px;line-height:1.5">
      <tr><td style="padding:4px 12px 4px 0;color:#5f6f76">Имя</td><td><b>${escapeHtml(lead.name)}</b></td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#5f6f76">Телефон</td><td><b>${escapeHtml(lead.phone)}</b></td></tr>
      ${lead.message ? `<tr><td style="padding:4px 12px 4px 0;color:#5f6f76;vertical-align:top">Сообщение</td><td>${escapeHtml(lead.message)}</td></tr>` : ""}
      <tr><td style="padding:4px 12px 4px 0;color:#5f6f76;vertical-align:top">Объект</td><td>${escapeHtml(propertyLine)}</td></tr>
    </table>`,
    button: adminUrl ? { url: adminUrl, label: "Открыть заявки" } : undefined,
  });

  const results = await Promise.allSettled([
    sendTelegram(tg),
    settings.notifyEmail
      ? sendMail({ to: settings.notifyEmail, subject: `Новая заявка: ${lead.name}, ${lead.phone}`, text, html })
      : Promise.resolve(false),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("[уведомления] Не удалось отправить уведомление о заявке:", r.reason);
  }
}
