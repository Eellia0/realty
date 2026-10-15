import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { contactLinks, getSettings } from "@/lib/settings";
import { logoutAction } from "@/actions/auth";
import { getMoney } from "@/lib/currency";
import { rateDateLabel } from "@/lib/money";
import { fmt } from "@/i18n/config";
import { getCurrentPath, getI18n } from "@/i18n/server";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HeartIcon, HomeIcon, PhoneIcon, ShieldIcon, UserIcon } from "./icons";

export async function Header() {
  const [user, favIds, settings, money, { locale, t, lp }, path] = await Promise.all([
    getCurrentUser(),
    getFavoriteIds(),
    getSettings(),
    getMoney(),
    getI18n(),
    getCurrentPath(),
  ]);
  const rateNote = money.rates ? fmt(t.currency.rateNote, { date: rateDateLabel(money.rates.date, locale) }) : null;
  const phone = contactLinks(settings).phone;
  const isAdmin = user?.role === "ADMIN";
  // Админка только на русском, переключатель языка там не нужен.
  const inAdmin = path.startsWith("/admin");
  const switchers = (
    <>
      {!inAdmin && <LanguageSwitcher locale={locale} path={path} label={t.nav.language} />}
      <CurrencySwitcher current={money.unavailable ? "GBP" : money.code} rateNote={rateNote} unavailable={!money.rates} />
    </>
  );

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3">
        <Link href={lp("/")} className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <HomeIcon className="h-5 w-5" />
          </span>
          <span className="hidden lg:inline">{t.meta.siteName}</span>
        </Link>

        <nav className="flex items-center gap-0.5 text-sm font-medium sm:ml-1">
          <Link href={lp("/catalog")} className="rounded-lg px-2 py-2 hover:bg-warm sm:px-3">
            {t.nav.catalog}
          </Link>
          <Link href={lp("/contacts")} className="hidden rounded-lg px-2.5 py-2 hover:bg-warm md:block md:px-3">
            {t.nav.contacts}
          </Link>
          {isAdmin && (
            <Link href="/admin" aria-label={t.nav.admin} title={t.nav.admin} className="rounded-lg px-2 py-2 whitespace-nowrap text-accent-dark hover:bg-warm sm:px-3">
              <ShieldIcon className="h-5 w-5 xl:hidden" />
              <span className="hidden xl:inline">{t.nav.admin}</span>
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 text-sm sm:gap-1.5">
          {/* На широком экране переключатели в основной строке, на телефоне — во второй строке ниже */}
          <div className="hidden items-center gap-1.5 sm:flex">{switchers}</div>
          {phone && (
            <a href={phone.href} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-accent-dark hover:bg-warm xl:flex">
              <PhoneIcon className="h-4 w-4" />
              {phone.label}
            </a>
          )}

          <Link
            href={lp("/favorites")}
            className={`relative items-center gap-1.5 rounded-lg px-2 py-2 font-medium hover:bg-warm sm:flex sm:px-2.5 ${isAdmin ? "hidden" : "flex"}`}
            aria-label={t.nav.favorites}
          >
            <HeartIcon className="h-5 w-5" />
            <span className="hidden lg:inline">{t.nav.favorites}</span>
            {favIds.length > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-white">{favIds.length}</span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden items-center gap-1.5 px-2 text-muted 2xl:flex">
                <UserIcon className="h-4 w-4" />
                {user.name || user.email}
              </span>
              <form action={logoutAction}>
                <button className="rounded-lg px-2 py-2 font-medium text-muted hover:bg-warm hover:text-ink sm:px-2.5">{t.nav.logout}</button>
              </form>
            </div>
          ) : (
            <Link href={lp("/login")} className="btn btn-primary px-3 py-2 whitespace-nowrap sm:px-4">
              {t.nav.login}
            </Link>
          )}
        </div>
      </div>
      <div className="container-page flex items-center justify-end gap-1.5 border-t border-line/70 py-1.5 sm:hidden">{switchers}</div>
    </header>
  );
}
