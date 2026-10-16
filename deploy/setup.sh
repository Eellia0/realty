#!/usr/bin/env bash
# Первичная настройка сервера Ubuntu 24.04 для сайта. Запускается от root один раз,
# после того как код скачан в /opt/realty (deploy/fetch.sh):
#
#   bash /opt/realty/deploy/setup.sh
#
# Что делает: swap, обновления системы, Node.js 22, PostgreSQL, Caddy, брандмауэр,
# база и пользователь realty_app, файл .env со случайными паролями, сборка сайта,
# служба realty (автозапуск), ежедневная резервная копия и команда realty-update.
# Повторный запуск безопасен: уже сделанные шаги пропускаются, .env и база не пересоздаются.

set -euo pipefail

APP_DIR=/opt/realty
APP_USER=realty
BACKUP_DIR=/var/backups/realty
export DEBIAN_FRONTEND=noninteractive
# needrestart не перезапускает службы посреди установки и ничего не спрашивает.
export NEEDRESTART_SUSPEND=1

step() { printf '\n\033[1;32m=== %s ===\033[0m\n' "$*"; }

[ "$(id -u)" = 0 ] || { echo "Запускайте от root"; exit 1; }
[ -f "$APP_DIR/package.json" ] || { echo "В $APP_DIR нет кода сайта — сначала deploy/fetch.sh"; exit 1; }

step "Файл подкачки 2 ГБ (нужен для сборки)"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

step "Обновление системы и пакеты"
apt-get update
apt-get -y -o Dpkg::Options::=--force-confold upgrade
apt-get install -y curl ca-certificates gnupg rsync ufw caddy postgresql unattended-upgrades
printf 'APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "1";\n' > /etc/apt/apt.conf.d/20auto-upgrades

step "Node.js 22"
if ! node -v 2>/dev/null | grep -q '^v22\.'; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
node -v

step "PostgreSQL (из репозитория Ubuntu)"
systemctl enable --now postgresql
psql --version

step "Пользователь $APP_USER"
id "$APP_USER" >/dev/null 2>&1 || useradd --system --create-home --home-dir /home/$APP_USER --shell /usr/sbin/nologin "$APP_USER"

FIRST_RUN=0
if [ ! -f "$APP_DIR/.env" ]; then
  step "База данных и .env"
  FIRST_RUN=1
  DB_PASS=$(openssl rand -hex 24)
  APP_SECRET=$(openssl rand -hex 32)
  IP=$(hostname -I | awk '{print $1}')
  sudo -u postgres psql -v ON_ERROR_STOP=1 -q \
    -c "CREATE ROLE realty_app LOGIN PASSWORD '$DB_PASS';" \
    -c "CREATE DATABASE realty OWNER realty_app;" \
    -c "REVOKE ALL ON DATABASE realty FROM PUBLIC;"
  cat > "$APP_DIR/.env" <<EOF
DATABASE_URL="postgresql://realty_app:$DB_PASS@localhost:5432/realty?schema=public"
APP_SECRET="$APP_SECRET"
SITE_URL="http://$IP"
NEXT_PUBLIC_YANDEX_MAPS_API_KEY=""
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
SMTP_HOST="smtp.yandex.ru"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM=""
BACKUP_DIR="$BACKUP_DIR"
EOF
fi
mkdir -p "$APP_DIR/uploads" "$BACKUP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR" "$BACKUP_DIR"
chmod 600 "$APP_DIR/.env"
chmod 700 "$BACKUP_DIR"

step "Установка зависимостей и сборка сайта (5–15 минут)"
sudo -u "$APP_USER" -H bash -c "cd $APP_DIR && npm ci --no-audit --no-fund && npx prisma db push"
if [ "$FIRST_RUN" = 1 ]; then
  sudo -u "$APP_USER" -H bash -c "cd $APP_DIR && npx prisma db seed"
fi
sudo -u "$APP_USER" -H bash -c "cd $APP_DIR && npm run build"

step "Служба сайта"
install -m 644 "$APP_DIR/deploy/realty.service" /etc/systemd/system/realty.service
systemctl daemon-reload
systemctl enable realty
systemctl restart realty

step "Caddy (веб-сервер перед сайтом)"
if ! grep -q 'reverse_proxy 127.0.0.1:3000' /etc/caddy/Caddyfile 2>/dev/null; then
  install -m 644 "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
fi
systemctl enable caddy
systemctl reload caddy || systemctl restart caddy

step "SSH: порты 22 и 8443 (443 освобождается для сайта)"
printf 'Port 22\nPort 8443\n' > /etc/ssh/sshd_config.d/10-ports.conf
sshd -t
systemctl daemon-reload
systemctl restart ssh.socket 2>/dev/null || systemctl restart ssh

step "Брандмауэр"
ufw default deny incoming
ufw default allow outgoing
ufw limit 22/tcp
ufw limit 8443/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

step "Резервные копии и команда обновления"
touch /var/log/realty-backup.log
chown "$APP_USER:$APP_USER" /var/log/realty-backup.log
cat > /etc/cron.d/realty-backup <<EOF
30 3 * * * $APP_USER cd $APP_DIR && /usr/bin/npm run backup >> /var/log/realty-backup.log 2>&1
EOF
install -m 755 "$APP_DIR/deploy/update.sh" /usr/local/bin/realty-update

step "Проверка"
sleep 5
systemctl is-active realty caddy postgresql || true
code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ || true)
echo "Главная страница через Caddy: HTTP $code"
echo
echo "ГОТОВО. Сайт: http://$(hostname -I | awk '{print $1}')"
