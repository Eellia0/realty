#!/usr/bin/env bash
# Обновление сайта на сервере до последней версии из GitHub. Запуск от root:
#
#   realty-update
#
# Изменения базы, при которых могут пропасть данные, не применяются: prisma db push остановится с ошибкой.

set -euo pipefail

APP_DIR=/opt/realty
APP_USER=realty

cd "$APP_DIR"
git pull --ff-only
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
sudo -u "$APP_USER" -H bash -c "cd $APP_DIR && npm ci --no-audit --no-fund && npx prisma db push && npm run build"
install -m 755 "$APP_DIR/deploy/update.sh" /usr/local/bin/realty-update
systemctl restart realty
sleep 3
systemctl is-active realty
echo "Сайт обновлён: $(git log -1 --format='%h %s')"
