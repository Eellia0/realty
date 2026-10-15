import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { contactLinks, getSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { logoutAction } from "@/actions/auth";
import { getMoney } from "@/lib/currency";
import { rateDateLabel } from "@/lib/money";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { HeartIcon, HomeIcon, PhoneIcon, ShieldIcon, UserIcon } from "./icons";

export async function Header() {
  const [user, favIds, settings, money] = await Promise.all([getCurrentUser(), getFavoriteIds(), getSettings(), getMoney()]);
  const rateNote = money.rates ? `Курс ЦБ РФ на ${rateDateLabel(money.rates.date)}` : null;
  const phone = contactLinks(settings).phone;

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <HomeIcon className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm font-medium sm:ml-2">
          <Link href="/catalog" className="rounded-lg px-2.5 py-2 hover:bg-warm sm:px-3">
            Каталог
          </Link>
          <Link href="/contacts" className="hidden rounded-lg px-2.5 py-2 hover:bg-warm sm:block sm:px-3">
            Контакты
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" aria-label="Админ-панель" title="Админ-панель" className="rounded-lg px-2.5 py-2 whitespace-nowrap text-accent-dark hover:bg-warm sm:px-3">
              <ShieldIcon className="h-5 w-5 sm:hidden" />
              <span className="hidden sm:inline">Админ-панель</span>
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 text-sm sm:gap-1.5">
          <CurrencySwitcher current={money.unavailable ? "GBP" : money.code} rateNote={rateNote} unavailable={!money.rates} />
          {phone && (
            <a href={phone.href} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-accent-dark hover:bg-warm lg:flex">
              <PhoneIcon className="h-4 w-4" />
              {phone.label}
            </a>
          )}

          <Link href="/favorites" className={`relative items-center gap-1.5 rounded-lg px-2 py-2 font-medium hover:bg-warm sm:flex sm:px-2.5 ${user?.role === "ADMIN" ? "hidden" : "flex"}`} aria-label="Избранное">
            <HeartIcon className="h-5 w-5" />
            <span className="hidden md:inline">Избранное</span>
            {favIds.length > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-white">{favIds.length}</span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden items-center gap-1.5 px-2 text-muted xl:flex">
                <UserIcon className="h-4 w-4" />
                {user.name || user.email}
              </span>
              <form action={logoutAction}>
                <button className="rounded-lg px-2 py-2 font-medium text-muted hover:bg-warm hover:text-ink sm:px-2.5">Выйти</button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary px-3 py-2 sm:px-4">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
