import Link from "next/link";
import { contactLinks, getSettings } from "@/lib/settings";
import { fmt } from "@/i18n/config";
import { getI18n } from "@/i18n/server";
import { MailIcon, PhoneIcon, TelegramIcon, WhatsAppIcon } from "./icons";

export async function Footer() {
  const [settings, { locale, t, lp }] = await Promise.all([getSettings(), getI18n()]);
  const links = contactLinks(settings);
  const en = locale === "en";
  const address = (en && settings.addressEn) || settings.address;
  const hours = (en && settings.workingHoursEn) || settings.workingHours;
  const contacts = [
    links.phone && { ...links.phone, icon: <PhoneIcon className="h-4 w-4" />, external: false },
    links.whatsapp && { ...links.whatsapp, icon: <WhatsAppIcon className="h-4 w-4" />, external: true },
    links.telegram && { ...links.telegram, icon: <TelegramIcon className="h-4 w-4" />, external: true },
    links.email && { ...links.email, icon: <MailIcon className="h-4 w-4" />, external: false },
  ].filter(Boolean) as { label: string; href: string; icon: React.ReactNode; external: boolean }[];

  return (
    <footer className="mt-16 border-t border-line bg-warm/60">
      <div className="container-page grid gap-8 py-10 text-sm text-muted sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="text-base font-bold text-ink">{t.meta.siteName}</div>
          <p className="mt-1 max-w-sm">{t.meta.description}</p>
          {address && <p className="mt-3">{address}</p>}
          {hours && <p>{hours}</p>}
        </div>

        <nav className="flex flex-col gap-2">
          <span className="font-semibold text-ink">{t.nav.sections}</span>
          <Link href={lp("/catalog")} className="hover:text-ink">{t.nav.catalog}</Link>
          <Link href={lp("/contacts")} className="hover:text-ink">{t.nav.contacts}</Link>
          <Link href={lp("/favorites")} className="hover:text-ink">{t.nav.favorites}</Link>
          <Link href={lp("/privacy")} className="hover:text-ink">{t.nav.privacy}</Link>
        </nav>

        {contacts.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink">{t.nav.contactUs}</span>
            {contacts.map((c) => (
              <a
                key={c.href}
                href={c.href}
                {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-2 hover:text-ink"
              >
                {c.icon}
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-line">
        <div className="container-page py-4 text-xs text-muted">{fmt(t.footer.rights, { year: new Date().getFullYear() })}</div>
      </div>
    </footer>
  );
}
