import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-warm/60">
      <div className="container-page flex flex-col gap-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-bold text-ink">{SITE_NAME}</div>
          <div>{SITE_DESCRIPTION}</div>
        </div>
        <nav className="flex gap-4">
          <Link href="/catalog" className="hover:text-ink">Каталог</Link>
          <Link href="/favorites" className="hover:text-ink">Избранное</Link>
        </nav>
      </div>
    </footer>
  );
}
