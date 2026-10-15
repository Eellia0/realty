import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { decrypt, encrypt } from "@/lib/crypto";
import { newTotpSecret, totpQr } from "@/lib/totp";
import { logoutEverywhere } from "@/actions/admin";
import { ChangePasswordForm, TotpConfirmForm } from "@/components/admin/SecurityForms";
import { ShieldIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Безопасность", robots: { index: false } };

// Страница вне общего layout админки: она должна открываться и до включения 2FA.
export default async function SecurityPage() {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") redirect("/admin/login");
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });

  if (!user.totpEnabled) {
    let pending = user.totpPending;
    if (!pending) {
      pending = encrypt(newTotpSecret());
      await db.user.update({ where: { id: user.id }, data: { totpPending: pending } });
    }
    const secret = decrypt(pending);
    const qr = await totpQr(secret, user.email);

    return (
      <div className="container-page flex justify-center py-10">
        <div className="card w-full max-w-lg space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
              <ShieldIcon className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold">Включите двухфакторную защиту</h1>
              <p className="text-sm text-muted">Без неё админ-панель недоступна.</p>
            </div>
          </div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>Установите на телефон Яндекс Ключ, Google Authenticator или другое приложение для одноразовых кодов.</li>
            <li>Отсканируйте QR-код или введите ключ вручную.</li>
            <li>Введите шесть цифр, которые покажет приложение.</li>
          </ol>
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-bg p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR-код для приложения-аутентификатора" width={220} height={220} className="rounded-lg bg-white p-2" />
            <code className="rounded-lg bg-surface px-3 py-1.5 text-sm tracking-wider break-all ring-1 ring-line">
              {secret.match(/.{1,4}/g)?.join(" ")}
            </code>
          </div>
          <TotpConfirmForm />
        </div>
      </div>
    );
  }

  const sessions = await db.session.count({ where: { userId: user.id, expiresAt: { gt: new Date() } } });

  return (
    <div className="container-page max-w-3xl space-y-6 py-10">
      <Link href="/admin" className="text-sm font-medium text-muted hover:text-ink">← В админ-панель</Link>
      <h1 className="text-2xl font-extrabold">Безопасность</h1>

      <section className="card flex items-center gap-4 p-5">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
          <ShieldIcon className="h-6 w-6" />
        </span>
        <div className="text-sm">
          <div className="font-semibold">Двухфакторная защита включена</div>
          <div className="text-muted">
            Вход: {user.email}. Чтобы заново привязать телефон, выполните на сервере команду npm run admin -- reset-2fa.
          </div>
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="text-lg font-bold">Смена пароля</h2>
        <ChangePasswordForm />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="text-sm">
          <div className="font-semibold">Активные сеансы: {sessions}</div>
          <div className="text-muted">Если вы входили с чужого устройства, завершите все сеансы, кроме этого.</div>
        </div>
        <form action={logoutEverywhere}>
          <button className="btn btn-danger">Завершить другие сеансы</button>
        </form>
      </section>
    </div>
  );
}
