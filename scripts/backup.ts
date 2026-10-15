// Резервная копия: база данных и фото объектов.
//
//   npm run backup
//
// Каждая копия — папка backups/ГГГГ-ММ-ДД_ЧЧ-ММ с файлами:
//   db.dump   — база в сжатом формате PostgreSQL (восстановление через pg_restore, см. ИНСТРУКЦИЯ.md)
//   uploads/  — фото объектов
// Хранятся последние BACKUP_KEEP копий (по умолчанию 14), старые удаляются.
// Папку можно поменять через BACKUP_DIR в .env, например на диск, который синхронизируется с облаком.

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BACKUP_DIR = path.resolve(ROOT, process.env.BACKUP_DIR || "backups");
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const WINDOWS_PG_DUMP = "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe";

function pgDumpPath() {
  if (process.env.PG_DUMP) return process.env.PG_DUMP;
  if (process.platform === "win32" && existsSync(WINDOWS_PG_DUMP)) return WINDOWS_PG_DUMP;
  return "pg_dump";
}

function stamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function sizeOf(p: string): number {
  const st = statSync(p);
  return st.isDirectory() ? readdirSync(p).reduce((sum, f) => sum + sizeOf(path.join(p, f)), 0) : st.size;
}

function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error("Нет DATABASE_URL в .env");
  const url = new URL(dbUrl);

  const target = path.join(BACKUP_DIR, stamp());
  mkdirSync(target, { recursive: true });

  // Пароль передаётся через переменную окружения, а не в командной строке.
  const dump = path.join(target, "db.dump");
  const res = spawnSync(
    pgDumpPath(),
    ["-h", url.hostname, "-p", url.port || "5432", "-U", decodeURIComponent(url.username), "-d", url.pathname.slice(1), "-F", "c", "-f", dump],
    { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) }, encoding: "utf8" },
  );
  if (res.status !== 0) {
    rmSync(target, { recursive: true, force: true });
    throw new Error(`pg_dump завершился с ошибкой: ${res.stderr || res.error?.message}`);
  }

  const uploads = path.join(ROOT, "uploads");
  if (existsSync(uploads)) cpSync(uploads, path.join(target, "uploads"), { recursive: true });

  writeFileSync(
    path.join(target, "info.txt"),
    `Резервная копия от ${new Date().toLocaleString("ru-RU")}\nБаза: ${url.pathname.slice(1)}\nВосстановление: см. раздел «Резервные копии» в ИНСТРУКЦИЯ.md\n`,
  );

  // Удаляем старые копии сверх лимита.
  const all = readdirSync(BACKUP_DIR)
    .filter((n) => /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/.test(n))
    .sort();
  for (const old of all.slice(0, Math.max(0, all.length - KEEP))) {
    rmSync(path.join(BACKUP_DIR, old), { recursive: true, force: true });
  }

  const mb = (sizeOf(target) / 1024 / 1024).toFixed(1);
  console.log(`Копия готова: ${target} (${mb} МБ). Хранится копий: ${Math.min(all.length, KEEP)}.`);
}

try {
  main();
} catch (e) {
  console.error("Ошибка резервного копирования:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
