#!/bin/bash

# Скрипт для деплоя на сервер через rsync
# Использование: ./scripts/deploy.sh [server_user] [server_host]
# Или задайте переменные в .env (см. .env.example)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$PROJECT_ROOT/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$PROJECT_ROOT/.env"
    set +a
fi

# Настройки: из .env или аргументы (обязательны user и host)
SERVER_USER=${1:-$DEPLOY_SERVER_USER}
SERVER_HOST=${2:-$DEPLOY_SERVER_HOST}
REMOTE_PATH=${DEPLOY_REMOTE_PATH:-/var/www/time-tracker}
LOCAL_DIST=${DEPLOY_LOCAL_DIST:-./dist}

if [ -z "$SERVER_USER" ] || [ -z "$SERVER_HOST" ]; then
    echo "❌ Укажите пользователя и хост: ./scripts/deploy.sh <user> <host>"
    echo "   или задайте DEPLOY_SERVER_USER и DEPLOY_SERVER_HOST в .env (см. .env.example)"
    exit 1
fi

cd "$PROJECT_ROOT" || exit 1

# Проверяем, что папка dist существует
if [ ! -d "$LOCAL_DIST" ]; then
    echo "❌ Папка $LOCAL_DIST не найдена. Сначала выполните npm run build"
    exit 1
fi

echo "🚀 Начинаем деплой на $SERVER_USER@$SERVER_HOST:$REMOTE_PATH"

# Синхронизируем файлы
rsync -avz --delete \
    --exclude=".git" \
    --exclude="node_modules" \
    --exclude=".env*" \
    --exclude="*.log" \
    "$LOCAL_DIST/" "$SERVER_USER@$SERVER_HOST:$REMOTE_PATH/"

# Проверяем результат
if [ $? -eq 0 ]; then
    echo "✅ Деплой успешно завершен!"
    echo "🌐 Сайт доступен по адресу: http://$SERVER_HOST"
else
    echo "❌ Ошибка при деплое"
    exit 1
fi
