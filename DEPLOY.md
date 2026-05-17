# Инструкция по деплою NetNext + Nexik

Полное руководство по развёртыванию проекта на VPS.

**Домены:**
- `netnext.site` - основной сайт агентства
- `nexik.org` - AI-чат платформа Nexik

---

## Содержание

1. [Требования к серверу](#1-требования-к-серверу)
2. [Подготовка сервера](#2-подготовка-сервера)
3. [Установка зависимостей](#3-установка-зависимостей)
4. [Настройка PostgreSQL](#4-настройка-postgresql)
5. [Настройка Redis](#5-настройка-redis)
6. [Установка Ollama (AI)](#6-установка-ollama-ai)
7. [Клонирование проекта](#7-клонирование-проекта)
8. [Переменные окружения](#8-переменные-окружения)
9. [Инициализация базы данных](#9-инициализация-базы-данных)
10. [Сборка и запуск](#10-сборка-и-запуск)
11. [Настройка Nginx (Multi-Domain)](#11-настройка-nginx-multi-domain)
12. [SSL сертификаты](#12-ssl-сертификаты)
13. [PM2 и автозапуск](#13-pm2-и-автозапуск)
14. [Telegram Bot](#14-telegram-bot)
15. [Email Mailing System](#15-email-mailing-system)
16. [Admin Panel](#16-admin-panel)
17. [CI/CD настройка](#17-cicd-настройка)
18. [Health Check и мониторинг](#18-health-check-и-мониторинг)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Требования к серверу

| Параметр | Минимум | Рекомендуется |
|----------|---------|---------------|
| OS | Ubuntu 22.04 | Ubuntu 24.04 LTS |
| RAM | 4 GB | 8 GB (для Ollama) |
| CPU | 2 cores | 4 cores |
| Disk | 30 GB SSD | 60 GB SSD |
| Node.js | 20.x | 20.x LTS |
| Python | 3.10+ | 3.11+ |

**Важно:** 
- Ollama требует минимум 4GB RAM для модели qwen2.5:7b
- Playwright требует минимум 2GB RAM для headless Chrome

---

## 2. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка базовых утилит
sudo apt install -y curl wget git nano htop ufw python3 python3-pip python3-venv

# Настройка firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Создание пользователя для деплоя
sudo adduser deploy
sudo usermod -aG sudo deploy
```

---

## 3. Установка зависимостей

### Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node -v  # v20.x.x
npm -v
```

### pnpm

```bash
npm install -g pnpm
pnpm -v
```

### PostgreSQL 16

```bash
sudo apt install -y postgresql postgresql-contrib

sudo systemctl enable postgresql
sudo systemctl start postgresql
psql --version
```

### Redis

```bash
sudo apt install -y redis-server

sudo systemctl enable redis-server
sudo systemctl start redis-server
redis-cli ping  # PONG
```

### Зависимости Playwright

```bash
sudo apt install -y \
  libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 \
  libpango-1.0-0 libcairo2 libasound2 libxshmfence1 libx11-xcb1 \
  libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libatk1.0-0 libcups2
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 4. Настройка PostgreSQL

```bash
sudo -u postgres psql

CREATE USER netnext WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE netnext OWNER netnext;
GRANT ALL PRIVILEGES ON DATABASE netnext TO netnext;

\q
```

Генерация пароля:
```bash
openssl rand -base64 24
```

---

## 5. Настройка Redis

Redis по умолчанию работает на localhost - безопасно. Проверка:
```bash
redis-cli ping  # PONG
```

---

## 6. Установка Ollama (AI)

Ollama - локальный AI для Nexik чата.

### Установка

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Загрузка модели

```bash
# Рекомендуемая модель (7B параметров, ~4GB RAM)
ollama pull qwen2.5:7b

# Или более лёгкая (3B параметров, ~2GB RAM)
ollama pull qwen2.5:3b
```

### Настройка как systemd сервис

```bash
sudo nano /etc/systemd/system/ollama.service
```

```ini
[Unit]
Description=Ollama AI Server
After=network-online.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ollama serve
Restart=always
RestartSec=3
Environment="OLLAMA_HOST=127.0.0.1:11434"

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Проверка
curl http://localhost:11434/api/tags
```

---

## 7. Клонирование проекта

```bash
cd /var/www
sudo git clone https://github.com/grinvsevolod1-ctrl/netn.git netnext
cd netnext

sudo chown -R deploy:deploy /var/www/netnext

pnpm install
npx playwright install chromium
```

---

## 8. Переменные окружения

```bash
cp .env.example .env.local
nano .env.local
```

### Полный список переменных:

```env
# ========================================
# DATABASE
# ========================================
DATABASE_URL=postgresql://netnext:YOUR_DB_PASSWORD@localhost:5432/netnext

# ========================================
# REDIS
# ========================================
REDIS_URL=redis://localhost:6379

# ========================================
# SECURITY
# ========================================
# Генерация: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_key_here

# JWT для Nexik авторизации
NEXIK_JWT_SECRET=your_secure_jwt_secret_minimum_32_characters

# ========================================
# OLLAMA AI
# ========================================
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# ========================================
# NEXIK SETTINGS
# ========================================
NEXIK_AI_MODEL=qwen2.5:7b
NEXIK_MAX_TOKENS=1000
NEXIK_WIDGET_DOMAIN=https://nexik.org

# ========================================
# TELEGRAM BOT
# ========================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=-1001234567890
TELEGRAM_OWNER_ID=-1001234567890

# ========================================
# EMAIL (SMTP)
# ========================================
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_USER=hello@netnext.site
SMTP_PASS=your_smtp_password
SMTP_FROM=hello@netnext.site
SMTP_FROM_NAME=NetNext
FROM_EMAIL=hello@netnext.site

# DKIM (опционально)
DKIM_DOMAIN=netnext.site
DKIM_SELECTOR=vps
DKIM_KEY_PATH=/etc/opendkim/keys/vps.private

# ========================================
# ADMIN
# ========================================
ADMIN_API_TOKEN=your_secure_admin_token

# ========================================
# RATE LIMITS
# ========================================
MAILING_MAX_PER_HOUR=50
MAILING_DELAY_MS=5000

# ========================================
# URLS
# ========================================
NEXT_PUBLIC_BASE_URL=https://netnext.site
NEXT_PUBLIC_NEXIK_URL=https://nexik.org

# ========================================
# LOGGING
# ========================================
LOG_LEVEL=info
NODE_ENV=production
```

---

## 9. Инициализация базы данных

```bash
# Инициализация схемы
pnpm db:init

# Или вручную
node --env-file=.env.local scripts/db-init.js
```

### Таблицы:

**Основные (NetNext):**
- `leads` - заявки с сайта
- `analytics_events` - события аналитики
- `chat_sessions`, `chat_messages` - чат сайта
- `mailing_campaigns`, `mailing_recipients` - рассылки

**Nexik:**
- `nexik_organizations` - организации клиентов
- `nexik_org_members` - пользователи организаций
- `nexik_widgets` - виджеты чата
- `nexik_conversations` - диалоги с посетителями
- `nexik_messages` - сообщения
- `nexik_knowledge_documents`, `nexik_knowledge_chunks` - база знаний

---

## 10. Сборка и запуск

```bash
pnpm build

# Тест
pnpm start
# Открыть http://YOUR_IP:3000
```

---

## 11. Настройка Nginx (Multi-Domain)

### Основной сайт (netnext.site)

```bash
sudo nano /etc/nginx/sites-available/netnext
```

```nginx
server {
    listen 80;
    server_name netnext.site www.netnext.site;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Таймауты для долгих операций
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Nexik (nexik.org)

```bash
sudo nano /etc/nginx/sites-available/nexik
```

```nginx
server {
    listen 80;
    server_name nexik.org www.nexik.org;

    # Редирект на /nexik пути
    location / {
        proxy_pass http://127.0.0.1:3000/nexik;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Nexik-Domain "true";
        proxy_cache_bypass $http_upgrade;
    }

    # API для виджетов (CORS enabled)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/nexik/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers для виджетов на других сайтах
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,Content-Type,Authorization' always;
        
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Embed скрипт для виджета
    location /embed.js {
        proxy_pass http://127.0.0.1:3000/nexik/embed.js;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600";
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

### Активация

```bash
sudo ln -s /etc/nginx/sites-available/netnext /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/nexik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. SSL сертификаты

```bash
sudo apt install -y certbot python3-certbot-nginx

# Для обоих доменов
sudo certbot --nginx -d netnext.site -d www.netnext.site
sudo certbot --nginx -d nexik.org -d www.nexik.org

# Автообновление
sudo certbot renew --dry-run
```

---

## 13. PM2 и автозапуск

```bash
npm install -g pm2

cd /var/www/netnext
pm2 start ecosystem.config.js

pm2 save
pm2 startup
# Выполните команду которую выведет pm2 startup
```

### ecosystem.config.js

```javascript
module.exports = {
  apps: [
    {
      name: 'netnext',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/netnext',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'netnext-telegram',
      script: 'telegram-bot/bot.py',
      interpreter: 'python3',
      cwd: '/var/www/netnext',
      instances: 1,
      autorestart: true,
      env: {
        PYTHONUNBUFFERED: '1'
      }
    },
    {
      name: 'netnext-email-worker',
      script: 'worker.js',
      cwd: '/var/www/netnext',
      instances: 1,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
```

### Команды PM2

```bash
pm2 status          # Статус
pm2 logs            # Все логи
pm2 logs netnext    # Логи Next.js
pm2 restart all     # Перезапуск
pm2 reload all      # Graceful reload
pm2 monit           # Мониторинг
```

---

## 14. Telegram Bot

### Настройка

1. Создайте бота через @BotFather
2. Получите токен
3. Узнайте ID чата через @userinfobot
4. Добавьте в `.env.local`

### Python зависимости

```bash
cd /var/www/netnext/telegram-bot
python3 -m venv venv
source venv/bin/activate
pip install python-telegram-bot psycopg2-binary python-dotenv
```

---

## 15. Email Mailing System

### Anti-Spam рекомендации

1. **DKIM** - обязательно для доставляемости
2. **SPF** - добавьте DNS запись
3. **Лимиты** - 50 писем/час
4. **Отписка** - в каждом письме

### Настройка DKIM

```bash
sudo mkdir -p /etc/opendkim/keys
sudo opendkim-genkey -b 2048 -d netnext.site -s vps -D /etc/opendkim/keys

# DNS запись
cat /etc/opendkim/keys/vps.txt
```

---

## 16. Admin Panel

Админ-панель: `https://netnext.site/admin`

- Dashboard - статистика, заявки, чаты
- Mailings - email-кампании
- Settings - SMTP, Telegram

---

## 17. CI/CD настройка

### GitHub Secrets

| Secret | Значение |
|--------|----------|
| `VPS_HOST` | IP или домен сервера |
| `VPS_USER` | SSH пользователь |
| `VPS_SSH_KEY` | Приватный SSH ключ |

### SSH ключ для деплоя

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy
ssh-copy-id -i ~/.ssh/github_deploy.pub deploy@YOUR_SERVER
cat ~/.ssh/github_deploy  # -> GitHub Secret
```

---

## 18. Health Check и мониторинг

### Endpoints

```bash
# Health check
curl https://netnext.site/api/health
curl https://nexik.org/api/health

# Ответ:
# {
#   "status": "healthy",
#   "checks": {
#     "database": { "status": "ok", "latencyMs": 5 },
#     "memory": { "status": "ok", "usedMB": 256, "percentUsed": 45 }
#   }
# }
```

### Чеклист после деплоя

```bash
# 1. PostgreSQL
psql -U netnext -d netnext -c "SELECT 1;"

# 2. Redis
redis-cli ping

# 3. Ollama
curl http://localhost:11434/api/tags

# 4. Next.js
curl http://localhost:3000

# 5. Nginx + SSL
curl https://netnext.site
curl https://nexik.org

# 6. PM2
pm2 status

# 7. Health API
curl https://netnext.site/api/health
```

---

## 19. Troubleshooting

### Ollama не отвечает

```bash
sudo systemctl status ollama
sudo journalctl -u ollama -n 50

# Перезапуск
sudo systemctl restart ollama
```

### Playwright не работает

```bash
npx playwright install-deps chromium
npx playwright install chromium --force
```

### PostgreSQL connection refused

```bash
sudo systemctl status postgresql
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Telegram бот не отвечает

```bash
pm2 logs netnext-telegram --lines 50
```

### Email не отправляются

```bash
pm2 logs netnext-email-worker --lines 50
# Проверьте mail-tester.com
```

### Next.js build fails

```bash
rm -rf .next node_modules/.cache
pnpm install
pnpm build
```

### Nexik виджет не загружается

```bash
# Проверьте CORS
curl -I https://nexik.org/embed.js
# Должен быть Access-Control-Allow-Origin: *
```

---

## DNS записи

### netnext.site

```
A     @       YOUR_SERVER_IP
A     www     YOUR_SERVER_IP
TXT   @       v=spf1 ip4:YOUR_SERVER_IP ~all
TXT   vps._domainkey   (DKIM запись)
```

### nexik.org

```
A     @       YOUR_SERVER_IP
A     www     YOUR_SERVER_IP
```

---

## Контакты

При проблемах обращайтесь к техническому руководителю проекта.
