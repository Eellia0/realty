import Link from "next/link";
import { contactLinks, getSettings } from "@/lib/settings";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";
import { MailIcon, PhoneIcon, TelegramIcon, WhatsAppIcon } from "./icons";

export async function Footer() {
  const settings = await getSettings();
  const links = contactLinks(settings);
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
          <div className="text-base font-bold text-ink">{SITE_NAME}</div>
          <p className="mt-1 max-w-sm">{SITE_DESCRIPTION}</p>
          {settings.address && <p className="mt-3">{settings.address}</p>}
          {settings.workingHours && <p>{settings.workingHours}</p>}
        </div>

        <nav className="flex flex-col gap-2">
          <span className="font-semibold text-ink">Разделы</span>
          <Link href="/catalog" className="hover:text-ink">Каталог</Link>
          <Link href="/contacts" className="hover:text-ink">Контакты</Link>
          <Link href="/favorites" className="hover:text-ink">Избранное</Link>
          <Link href="/privacy" className="hover:text-ink">Политика конфиденциальности</Link>
        </nav>

        {contacts.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-ink">Связаться</span>
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
        <div className="container-page py-4 text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}</div>
      </div>
    </footer>
  );
}
