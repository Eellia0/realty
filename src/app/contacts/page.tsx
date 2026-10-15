import type { Metadata } from "next";
import { contactLinks, getSettings, hasAnyContact } from "@/lib/settings";
import { LeadForm } from "@/components/LeadForm";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Свяжитесь с нами: подберём квартиру, дом или виллу на Северном Кипре и организуем показ.",
};

function ContactCard({ href, icon, title, value, accent, external }: {
  href?: string; icon: React.ReactNode; title: string; value: string; accent: string; external?: boolean;
}) {
  const inner = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm text-muted">{title}</span>
        <span className="block truncate font-semibold">{value}</span>
      </span>
    </>
  );
  const cls = "card flex items-center gap-3.5 p-4 transition";
  return href ? (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${cls} hover:-translate-y-0.5 hover:shadow-lg`}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default async function ContactsPage() {
  const settings = await getSettings();
  const links = contactLinks(settings);

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Контакты</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Расскажите, что ищете, и мы подберём варианты, организуем показ вживую или по видеосвязи и сопроводим сделку.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-4">
          {hasAnyContact(settings) || settings.address ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {links.whatsapp && (
                <ContactCard href={links.whatsapp.href} external title="Написать в WhatsApp" value="Ответим в течение часа"
                  icon={<WhatsAppIcon className="h-6 w-6" />} accent="bg-[#25d366]/15 text-[#128c4b]" />
              )}
              {links.telegram && (
                <ContactCard href={links.telegram.href} external title="Написать в Telegram" value={links.telegram.label}
                  icon={<TelegramIcon className="h-6 w-6" />} accent="bg-[#229ed9]/15 text-[#1a7fb0]" />
              )}
              {links.phone && (
                <ContactCard href={links.phone.href} title="Позвонить" value={links.phone.label}
                  icon={<PhoneIcon className="h-6 w-6" />} accent="bg-accent-soft text-accent-dark" />
              )}
              {links.email && (
                <ContactCard href={links.email.href} title="Почта" value={links.email.label}
                  icon={<MailIcon className="h-6 w-6" />} accent="bg-sea-soft text-sea" />
              )}
              {settings.address && (
                <ContactCard title="Офис" value={settings.address}
                  icon={<PinIcon className="h-6 w-6" />} accent="bg-sun-soft text-[#9a6413]" />
              )}
              {settings.workingHours && (
                <ContactCard title="Часы работы" value={settings.workingHours}
                  icon={<ClockIcon className="h-6 w-6" />} accent="bg-warm text-ink" />
              )}
            </div>
          ) : (
            <div className="card p-6 text-muted">Оставьте заявку, и мы свяжемся с вами.</div>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-accent-dark via-accent to-sea p-6 text-white">
            <h2 className="text-lg font-bold">Как мы работаем</h2>
            <ol className="mt-3 space-y-2 text-sm text-white/90">
              <li>1. Подбираем объекты под ваш бюджет и пожелания.</li>
              <li>2. Показываем вживую или по видеосвязи, если вы ещё не на Кипре.</li>
              <li>3. Проверяем документы и титул, сопровождаем сделку до получения ключей.</li>
            </ol>
          </div>
        </div>

        <aside className="card h-fit space-y-3 p-6">
          <h2 className="text-lg font-bold">Подберём объект для вас</h2>
          <p className="text-sm text-muted">Оставьте контакты и коротко опишите запрос: район, бюджет, сколько спален.</p>
          <LeadForm submitLabel="Отправить заявку" messagePlaceholder="Например: 2+1 у моря в Искеле до £150 000" />
        </aside>
      </div>
    </div>
  );
}
