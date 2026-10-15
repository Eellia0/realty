import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getFavoriteIds } from "@/lib/favorites";
import { contactLinks, getSettings } from "@/lib/settings";
import { SITE_NAME } from "@/lib/site";
import { logoutAction } from "@/actions/auth";
import { HeartIcon, HomeIcon, PhoneIcon, UserIcon } from "./icons";

export async function Header() {
  const [user, favIds, settings] = await Promise.all([getCurrentUser(), getFavoriteIds(), getSettings()]);
  const phone = contactLinks(settings).phone;

  return (
    <header className="sticky top-0 z-[1000] border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
            <HomeIcon className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">{SITE_NAME}</span>
        </Link>

        <nav className="ml-1 flex items-center gap-0.5 text-sm font-medium sm:ml-2">
          <Link href="/catalog" className="rounded-lg px-2.5 py-2 hover:bg-warm sm:px-3">
            Каталог
          </Link>
          <Link href="/contacts" className="rounded-lg px-2.5 py-2 hover:bg-warm sm:px-3">
            Контакты
          </Link>
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded-lg px-2.5 py-2 whitespace-nowrap text-accent-dark hover:bg-warm sm:px-3">
              <span className="sm:hidden">Админка</span>
              <span className="hidden sm:inline">Админ-панель</span>
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 text-sm">
          {phone && (
            <a href={phone.href} className="hidden items-center gap-1.5 rounded-lg px-3 py-2 font-semibold text-accent-dark hover:bg-warm lg:flex">
              <PhoneIcon className="h-4 w-4" />
              {phone.label}
            </a>
          )}

          <Link href="/favorites" className="relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 font-medium hover:bg-warm" aria-label="Избранное">
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
                <button className="rounded-lg px-2.5 py-2 font-medium text-muted hover:bg-warm hover:text-ink">Выйти</button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary py-2">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
