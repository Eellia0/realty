import type { Metadata } from "next";
import { contactLinks, getSettings, hasAnyContact } from "@/lib/settings";
import { getI18n } from "@/i18n/server";
import { languageAlternates } from "@/i18n/alternates";
import { LeadForm } from "@/components/LeadForm";
import { ClockIcon, MailIcon, PhoneIcon, PinIcon, TelegramIcon, WhatsAppIcon } from "@/components/icons";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.contacts, description: t.meta.contactsDescription, alternates: await languageAlternates("/contacts") };
}

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
  const [settings, { locale, t }] = await Promise.all([getSettings(), getI18n()]);
  const links = contactLinks(settings);
  const c = t.contacts;
  const en = locale === "en";
  const address = (en && settings.addressEn) || settings.address;
  const hours = (en && settings.workingHoursEn) || settings.workingHours;

  return (
    <div className="container-page py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">{c.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{c.lead}</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-4">
          {hasAnyContact(settings) || address ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {links.whatsapp && (
                <ContactCard href={links.whatsapp.href} external title={c.writeWhatsapp} value={c.whatsappReply}
                  icon={<WhatsAppIcon className="h-6 w-6" />} accent="bg-[#25d366]/15 text-[#128c4b]" />
              )}
              {links.telegram && (
                <ContactCard href={links.telegram.href} external title={c.writeTelegram} value={links.telegram.label}
                  icon={<TelegramIcon className="h-6 w-6" />} accent="bg-[#229ed9]/15 text-[#1a7fb0]" />
              )}
              {links.phone && (
                <ContactCard href={links.phone.href} title={c.call} value={links.phone.label}
                  icon={<PhoneIcon className="h-6 w-6" />} accent="bg-accent-soft text-accent-dark" />
              )}
              {links.email && (
                <ContactCard href={links.email.href} title={c.email} value={links.email.label}
                  icon={<MailIcon className="h-6 w-6" />} accent="bg-sea-soft text-sea" />
              )}
              {address && (
                <ContactCard title={c.office} value={address} icon={<PinIcon className="h-6 w-6" />} accent="bg-sun-soft text-[#9a6413]" />
              )}
              {hours && (
                <ContactCard title={c.hours} value={hours} icon={<ClockIcon className="h-6 w-6" />} accent="bg-warm text-ink" />
              )}
            </div>
          ) : (
            <div className="card p-6 text-muted">{c.fallback}</div>
          )}

          <div className="rounded-2xl bg-gradient-to-br from-accent-dark via-accent to-sea p-6 text-white">
            <h2 className="text-lg font-bold">{c.howTitle}</h2>
            <ol className="mt-3 space-y-2 text-sm text-white/90">
              <li>{c.how1}</li>
              <li>{c.how2}</li>
              <li>{c.how3}</li>
            </ol>
          </div>
        </div>

        <aside className="card h-fit space-y-3 p-6">
          <h2 className="text-lg font-bold">{c.formTitle}</h2>
          <p className="text-sm text-muted">{c.formText}</p>
          <LeadForm submitLabel={c.formSubmit} messagePlaceholder={c.formPlaceholder} />
        </aside>
      </div>
    </div>
  );
}
