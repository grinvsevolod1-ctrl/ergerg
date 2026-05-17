#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# NetNext Setup Script
# Запуск: chmod +x scripts/setup.sh && ./scripts/setup.sh
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  NetNext Setup Script"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция проверки команды
check_command() {
  if command -v $1 &> /dev/null; then
    echo -e "${GREEN}✓${NC} $1 установлен"
    return 0
  else
    echo -e "${RED}✗${NC} $1 не найден"
    return 1
  fi
}

# Функция проверки сервиса
check_service() {
  if systemctl is-active --quiet $1 2>/dev/null; then
    echo -e "${GREEN}✓${NC} $1 запущен"
    return 0
  else
    echo -e "${YELLOW}!${NC} $1 не запущен"
    return 1
  fi
}

echo "1. Проверка зависимостей системы..."
echo "─────────────────────────────────────────────────────────────────"

check_command node
check_command npm
check_command pnpm || npm install -g pnpm
check_command psql
check_command redis-cli

echo ""
echo "2. Проверка сервисов..."
echo "─────────────────────────────────────────────────────────────────"

check_service postgresql || sudo systemctl start postgresql
check_service redis-server || sudo systemctl start redis-server

echo ""
echo "3. Установка Node.js зависимостей..."
echo "─────────────────────────────────────────────────────────────────"

pnpm install

echo ""
echo "4. Установка Playwright браузера..."
echo "─────────────────────────────────────────────────────────────────"

npx playwright install chromium

echo ""
echo "5. Проверка .env.local..."
echo "─────────────────────────────────────────────────────────────────"

if [ -f .env.local ]; then
  echo -e "${GREEN}✓${NC} .env.local существует"
else
  echo -e "${YELLOW}!${NC} .env.local не найден"
  echo "  Копирую .env.example -> .env.local"
  cp .env.example .env.local
  echo -e "${YELLOW}!${NC} Отредактируйте .env.local и заполните значения!"
fi

echo ""
echo "6. Инициализация базы данных..."
echo "─────────────────────────────────────────────────────────────────"

# Загружаем переменные
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ -n "$DATABASE_URL" ]; then
  echo "Запуск миграций..."
  psql "$DATABASE_URL" -f scripts/init-db.sql 2>/dev/null && \
    echo -e "${GREEN}✓${NC} База данных инициализирована" || \
    echo -e "${YELLOW}!${NC} Ошибка инициализации БД (возможно уже создана)"
else
  echo -e "${YELLOW}!${NC} DATABASE_URL не задан в .env.local"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}  Setup завершён!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Следующие шаги:"
echo "  1. Отредактируйте .env.local"
echo "  2. pnpm build"
echo "  3. pnpm start (или pm2 start ecosystem.config.js)"
echo ""
