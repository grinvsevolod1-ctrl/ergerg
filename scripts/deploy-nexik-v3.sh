#!/bin/bash

# NEXIK v3.0 Deploy Script
# Запускай: ./scripts/deploy-nexik-v3.sh

set -e

echo "=== Deploying NEXIK v3.0 ==="

cd /var/www/netnext-new

# Загружаем переменные окружения
source .env 2>/dev/null || true

# Формируем DATABASE_URL, если не задан
if [ -z "$DATABASE_URL" ]; then
    DATABASE_URL="postgresql://netnext:${DB_PASSWORD:-P1fcAI+RagRQWmE1Oq6Xlg==}@localhost:5432/netnext"
fi

export DATABASE_URL

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin project-code-analysis

# 2. Install dependencies
echo "[2/5] Installing dependencies..."
pnpm install || pnpm install --no-frozen-lockfile

# 3. Run database migrations
echo "[3/5] Running database migrations..."

# Проверяем подключение
if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "ERROR: Cannot connect to database with DATABASE_URL"
    echo "Trying with explicit credentials..."
    DATABASE_URL="postgresql://netnext:P1fcAI+RagRQWmE1Oq6Xlg==@localhost:5432/netnext"
    if ! psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo "FATAL: Database connection failed. Run migrations manually."
        echo "psql -U netnext -d netnext -f scripts/migrations/001_nexik_v3.sql"
        exit 1
    fi
fi

psql "$DATABASE_URL" << 'SQL'

-- ============================================
-- NEXIK v3.0 Database Schema
-- ============================================

-- Таблица посетителей с долгосрочной памятью
CREATE TABLE IF NOT EXISTS nexik_visitors (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  business_type TEXT,
  business_description TEXT,
  emotional_state TEXT DEFAULT 'neutral',
  emotions JSONB DEFAULT '[]'::jsonb,
  total_interactions INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  notes TEXT[] DEFAULT '{}'
);

-- История сообщений с метаданными
CREATE TABLE IF NOT EXISTS nexik_messages (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT REFERENCES nexik_visitors(id) ON DELETE CASCADE,
  conversation_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sentiment TEXT,
  intent TEXT,
  extracted_facts TEXT[] DEFAULT '{}',
  facts JSONB DEFAULT '{}'::jsonb,
  promises TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Фидбек для обучения (лайки/дизлайки)
CREATE TABLE IF NOT EXISTS nexik_feedback (
  id SERIAL PRIMARY KEY,
  message_id TEXT NOT NULL,
  visitor_id TEXT,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  comment TEXT,
  user_message TEXT,
  ai_response TEXT,
  intent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Обучающие примеры (хорошие ответы)
CREATE TABLE IF NOT EXISTS nexik_training_examples (
  id SERIAL PRIMARY KEY,
  user_message TEXT NOT NULL,
  ideal_response TEXT NOT NULL,
  context TEXT,
  intent TEXT,
  tags TEXT[] DEFAULT '{}',
  quality_score INT DEFAULT 5 CHECK (quality_score >= 1 AND quality_score <= 5),
  source TEXT DEFAULT 'feedback',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Логи чата NetNext (для главной страницы)
CREATE TABLE IF NOT EXISTS netnext_chat_logs (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent TEXT,
  source TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Фидбек чата NetNext
CREATE TABLE IF NOT EXISTS netnext_chat_feedback (
  id SERIAL PRIMARY KEY,
  message_id TEXT NOT NULL,
  reaction TEXT NOT NULL,
  visitor_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTP коды для авторизации
CREATE TABLE IF NOT EXISTS nexik_otp_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  attempts INT DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OAuth колонки для членов организации
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_org_members' AND column_name = 'google_id') THEN
    ALTER TABLE nexik_org_members ADD COLUMN google_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_org_members' AND column_name = 'yandex_id') THEN
    ALTER TABLE nexik_org_members ADD COLUMN yandex_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_org_members' AND column_name = 'avatar_url') THEN
    ALTER TABLE nexik_org_members ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_nexik_messages_visitor ON nexik_messages(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_created ON nexik_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_conversation ON nexik_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexik_feedback_reaction ON nexik_feedback(reaction);
CREATE INDEX IF NOT EXISTS idx_nexik_visitors_last_seen ON nexik_visitors(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_nexik_training_intent ON nexik_training_examples(intent);
CREATE INDEX IF NOT EXISTS idx_nexik_training_quality ON nexik_training_examples(quality_score DESC);

-- Добавляем колонки если их нет (для существующих таблиц)
DO $$
BEGIN
  -- nexik_visitors
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_visitors' AND column_name = 'company') THEN
    ALTER TABLE nexik_visitors ADD COLUMN company TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_visitors' AND column_name = 'notes') THEN
    ALTER TABLE nexik_visitors ADD COLUMN notes TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_visitors' AND column_name = 'emotions') THEN
    ALTER TABLE nexik_visitors ADD COLUMN emotions JSONB DEFAULT '[]'::jsonb;
  END IF;
  
  -- nexik_messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_messages' AND column_name = 'conversation_id') THEN
    ALTER TABLE nexik_messages ADD COLUMN conversation_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_messages' AND column_name = 'extracted_facts') THEN
    ALTER TABLE nexik_messages ADD COLUMN extracted_facts TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_messages' AND column_name = 'facts') THEN
    ALTER TABLE nexik_messages ADD COLUMN facts JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

SELECT 'Migrations complete!' as status;

SQL

echo "[3/5] Database migrations complete!"

# 4. Build the project
echo "[4/5] Building project..."
pnpm build

# 5. Restart the server
echo "[5/5] Restarting server..."
pm2 restart netnext || pm2 start ecosystem.config.js || pm2 start npm --name netnext -- start

# Ждём старта
echo "Waiting for server to start..."
sleep 5

# Проверяем что сервер поднялся
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo ""
    echo "=== NEXIK v3.0 deployed successfully! ==="
    echo ""
    echo "Test:"
    echo "curl -X POST http://localhost:3000/api/nexik/analyze-input -H 'Content-Type: application/json' -d '{\"input\": \"привет\", \"visitorId\": \"test\"}'"
else
    echo ""
    echo "WARNING: Server may not be ready. Check logs:"
    echo "pm2 logs netnext --lines 50"
fi
