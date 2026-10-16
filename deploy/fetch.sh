#!/usr/bin/env bash
# Загрузка кода сайта на сервер без git. Нужна потому, что из сети сервера github.com недоступен,
# а raw.githubusercontent.com и jsDelivr работают.
#
#   bash fetch.sh <коммит> <sha256 файла deploy/files.txt>
#
# Список файлов deploy/files.txt содержит SHA-256 каждого файла; его собственная сумма передаётся
# вторым аргументом. Повреждённый или подменённый файл — остановка, рабочая папка не меняется.
# В рабочей папке не трогаются .env, uploads, node_modules и .next; файлы, удалённые из репозитория, удаляются.

set -euo pipefail

REPO=Eellia0/realty
APP_DIR=${APP_DIR:-/opt/realty}
SHA=${1:-}
MANIFEST_SHA=${2:-}

[[ $SHA =~ ^[0-9a-f]{40}$ ]] || { echo "Первый аргумент — полный хэш коммита (40 символов)"; exit 1; }
[[ $MANIFEST_SHA =~ ^[0-9a-f]{64}$ ]] || { echo "Второй аргумент — SHA-256 списка файлов (64 символа)"; exit 1; }
command -v rsync >/dev/null || apt-get install -y rsync >/dev/null

SOURCES=("https://raw.githubusercontent.com/$REPO/$SHA" "https://cdn.jsdelivr.net/gh/$REPO@$SHA")

# Скачать файл: три круга по всем источникам.
get() {
  local path=$1 out=$2 enc src
  enc=$(python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1]))' "$path")
  for _ in 1 2 3; do
    for src in "${SOURCES[@]}"; do
      curl -fsSg --retry 2 --connect-timeout 15 -m 120 "$src/$enc" -o "$out" && return 0
    done
  done
  echo "Не удалось скачать $path"
  return 1
}

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/src/deploy"

get deploy/files.txt "$TMP/src/deploy/files.txt"
echo "$MANIFEST_SHA  $TMP/src/deploy/files.txt" | sha256sum -c --quiet \
  || { echo "Список файлов не совпадает с ожидаемым — остановка"; exit 1; }

total=$(wc -l < "$TMP/src/deploy/files.txt")
n=0
while IFS= read -r line; do
  hash=${line%%  *}
  path=${line#*  }
  case "$path" in /*|*..*|"") echo "Недопустимый путь в списке: $path"; exit 1 ;; esac
  mkdir -p "$TMP/src/$(dirname "$path")"
  get "$path" "$TMP/src/$path"
  echo "$hash  $TMP/src/$path" | sha256sum -c --quiet || { echo "Файл повреждён: $path"; exit 1; }
  n=$((n + 1))
  printf '\rСкачано файлов: %d из %d' "$n" "$total"
done < "$TMP/src/deploy/files.txt"
echo

mkdir -p "$APP_DIR"
rsync -a --delete \
  --exclude=/.env --exclude=/uploads/ --exclude=/node_modules/ --exclude=/.next/ --exclude=/.commit \
  "$TMP/src/" "$APP_DIR/"
echo "$SHA" > "$APP_DIR/.commit"
echo "Код сайта: версия ${SHA:0:7}"
