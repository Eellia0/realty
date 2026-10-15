import { getSettings, contactLinks } from "@/lib/settings";
import { PhoneIcon, TelegramIcon, WhatsAppIcon } from "./icons";

/**
 * Кнопки связи: позвонить, WhatsApp, Telegram. Показываются только заполненные в настройках.
 * message — готовый текст для WhatsApp, например «Интересует объект …».
 */
export async function ContactButtons({ message, compact = false }: { message?: string; compact?: boolean }) {
  const links = contactLinks(await getSettings());
  if (!links.phone && !links.whatsapp && !links.telegram) return null;

  const wa = links.whatsapp && message ? `${links.whatsapp.href}?text=${encodeURIComponent(message)}` : links.whatsapp?.href;
  const base = "btn flex-1 min-w-0 whitespace-nowrap";

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "flex-col sm:flex-row"}`}>
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${base} bg-[#25d366] text-white hover:bg-[#1ebe5b]`}>
          <WhatsAppIcon className="h-5 w-5" />
          WhatsApp
        </a>
      )}
      {links.telegram && (
        <a href={links.telegram.href} target="_blank" rel="noopener noreferrer" className={`${base} bg-[#229ed9] text-white hover:bg-[#1c8cc2]`}>
          <TelegramIcon className="h-5 w-5" />
          Telegram
        </a>
      )}
      {links.phone && (
        <a href={links.phone.href} className={`${base} btn-secondary`}>
          <PhoneIcon className="h-5 w-5" />
          {compact ? "Позвонить" : links.phone.label}
        </a>
      )}
    </div>
  );
}
