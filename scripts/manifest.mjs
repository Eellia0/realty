// Список файлов для выкладки на сервер без git (deploy/fetch.sh): SHA-256 и путь каждого файла из индекса git.
//
//   git add ...  →  node scripts/manifest.mjs  →  git add deploy/files.txt  →  коммит и push
//
// Печатает суммы списка и deploy/fetch.sh — они нужны для команды на сервере.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const MANIFEST = "deploy/files.txt";
const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

const entries = execFileSync("git", ["ls-files", "-s", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const lines = [];
let fetchHash = "";
for (const entry of entries) {
  const [meta, path] = entry.split("\t");
  const [mode, blob] = meta.split(" ");
  if (path === MANIFEST) continue;
  if (mode !== "100644" && mode !== "100755") throw new Error(`Неподдерживаемый тип файла: ${path} (${mode})`);
  const hash = sha256(execFileSync("git", ["cat-file", "blob", blob]));
  if (path === "deploy/fetch.sh") fetchHash = hash;
  lines.push(`${hash}  ${path}`);
}

const text = lines.join("\n") + "\n";
writeFileSync(MANIFEST, text);
console.log(`${MANIFEST}: ${lines.length} файлов`);
console.log(`sha256 списка:   ${sha256(Buffer.from(text))}`);
console.log(`sha256 fetch.sh: ${fetchHash}`);
