import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <div className="text-6xl font-extrabold text-sand">404</div>
      <h1 className="mt-4 text-2xl font-bold">Страница не найдена</h1>
      <p className="mt-2 text-muted">Возможно, объект уже снят с продажи.</p>
      <Link href="/catalog" className="btn btn-primary mt-6">Перейти в каталог</Link>
    </div>
  );
}
