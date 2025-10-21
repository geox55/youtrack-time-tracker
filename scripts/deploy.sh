#!/bin/bash

# Скрипт для деплоя на сервер через rsync
# Использование: ./scripts/deploy.sh [server_user@server_host]

# Настройки по умолчанию
SERVER_USER=${1:-"root"}
SERVER_HOST=${2:-"185.246.220.206"}
REMOTE_PATH="/var/www/youtrack-time-tracker"
LOCAL_DIST="./dist"

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
