import Link from "next/link";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t, lp } = await getI18n();
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="text-6xl font-extrabold text-sand">404</div>
      <h1 className="mt-4 text-2xl font-bold">{t.notFound.title}</h1>
      <p className="mt-2 text-muted">{t.notFound.text}</p>
      <Link href={lp("/catalog")} className="btn btn-primary mt-6">{t.notFound.toCatalog}</Link>
    </div>
  );
}
