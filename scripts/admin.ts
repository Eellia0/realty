// Управление администратором из консоли сервера. Через сайт стать администратором нельзя.
//
//   npm run admin -- create       создать администратора или сменить пароль существующему
//   npm run admin -- reset-2fa    сбросить двухфакторную защиту (если потерян телефон)
//   npm run admin -- list         показать администраторов
//
// Email и пароль спрашиваются интерактивно, пароль при вводе не отображается.
// Для автоматизации их можно передать через переменные ADMIN_EMAIL и ADMIN_PASSWORD.

import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function ask(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, _enc, cb) {
      if (!muted) process.stdout.write(chunk);
      cb();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

function checkPassword(p: string) {
  if (p.length < 12) return "Пароль должен быть не короче 12 символов";
  if (!/[a-zа-я]/i.test(p) || !/\d/.test(p)) return "Пароль должен содержать буквы и цифры";
  return null;
}

async function create() {
  const email = (process.env.ADMIN_EMAIL || (await ask("Email администратора: "))).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Некорректный email");

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await ask("Пароль (не короче 12 символов): ", true);
    if ((await ask("Повторите пароль: ", true)) !== password) throw new Error("Пароли не совпадают");
  }
  const err = checkPassword(password);
  if (err) throw new Error(err);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: { email, role: "ADMIN", passwordHash, name: "Администратор" },
  });
  // Новый пароль: все открытые сеансы завершаются.
  await db.session.deleteMany({ where: { userId: user.id } });
  console.log(`Готово: ${email} — администратор. При первом входе нужно будет подключить приложение для кодов.`);
}

async function reset2fa() {
  const email = (process.env.ADMIN_EMAIL || (await ask("Email администратора: "))).toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.role !== "ADMIN") throw new Error("Администратор не найден");
  await db.user.update({
    where: { id: user.id },
    data: { totpEnabled: false, totpSecret: null, totpPending: null, totpLastStep: null },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  console.log("Двухфакторная защита сброшена. Войдите на сайт и подключите приложение заново.");
}

async function list() {
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { email: true, totpEnabled: true } });
  if (!admins.length) console.log("Администраторов нет.");
  for (const a of admins) console.log(`${a.email}  2FA: ${a.totpEnabled ? "включена" : "не настроена"}`);
}

const commands: Record<string, () => Promise<void>> = { create, "reset-2fa": reset2fa, list };
const cmd = process.argv[2];

(commands[cmd] ?? (async () => console.log("Команды: create | reset-2fa | list")))()
  .catch((e) => {
    console.error("Ошибка:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
