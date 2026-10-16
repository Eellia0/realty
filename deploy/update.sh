#!/usr/bin/env bash
# Обновление сайта на сервере. Запуск от root:
#
#   realty-update <коммит> <sha256 списка файлов>
#
# Оба значения печатает scripts/manifest.mjs при подготовке выкладки.
# Изменения базы, при которых могут пропасть данные, не применяются: prisma db push остановится с ошибкой.

set -euo pipefail

APP_DIR=/opt/realty
APP_USER=realty

[ $# -eq 2 ] || { echo "Использование: realty-update <коммит> <sha256 списка файлов>"; exit 1; }

bash "$APP_DIR/deploy/fetch.sh" "$1" "$2"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" -H bash -c "cd $APP_DIR && npm ci --no-audit --no-fund && npx prisma db push && npm run build"
install -m 755 "$APP_DIR/deploy/update.sh" /usr/local/bin/realty-update
systemctl restart realty
sleep 3
systemctl is-active realty
echo "Сайт обновлён до версии ${1:0:7}"
