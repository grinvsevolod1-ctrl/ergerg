#!/bin/bash

# NEXIK v3.0 Deploy Script
# Запускай из /var/www/netnext-new

set -e

echo "🚀 Deploying NEXIK v3.0..."

# 1. Pull latest code
echo "📥 Pulling latest code..."
git pull origin project-code-analysis

# 2. Install dependencies if needed
echo "📦 Checking dependencies..."
pnpm install --frozen-lockfile 2>/dev/null || true

# 3. Run database migrations
echo "🗄️ Running database migrations..."
psql $DATABASE_URL << 'SQL'

-- Таблица посетителей с долгосрочной памятью
CREATE TABLE IF NOT EXISTS nexik_visitors (
  visitor_id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  business_type TEXT,
  business_description TEXT,
  emotional_state TEXT DEFAULT 'neutral',
  total_interactions INT DEFAULT 0,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  notes TEXT[] DEFAULT '{}'
);

-- История сообщений с метаданными
CREATE TABLE IF NOT EXISTS nexik_messages (
  id SERIAL PRIMARY KEY,
  visitor_id TEXT REFERENCES nexik_visitors(visitor_id) ON DELETE CASCADE,
  conversation_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sentiment TEXT,
  intent TEXT,
  extracted_facts TEXT[] DEFAULT '{}',
  promises TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Фидбек для обучения (лайки/дизлайки)
CREATE TABLE IF NOT EXISTS nexik_feedback (
  id SERIAL PRIMARY KEY,
  message_id INT REFERENCES nexik_messages(id) ON DELETE CASCADE,
  visitor_id TEXT,
  reaction TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  comment TEXT,
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
  quality_score INT DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_nexik_messages_visitor ON nexik_messages(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_created ON nexik_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_conversation ON nexik_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexik_feedback_message ON nexik_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_nexik_visitors_last_seen ON nexik_visitors(last_seen DESC);

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
  
  -- nexik_messages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_messages' AND column_name = 'conversation_id') THEN
    ALTER TABLE nexik_messages ADD COLUMN conversation_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nexik_messages' AND column_name = 'extracted_facts') THEN
    ALTER TABLE nexik_messages ADD COLUMN extracted_facts TEXT[] DEFAULT '{}';
  END IF;
END $$;

SQL

echo "✅ Database migrations complete!"

# 4. Build the project
echo "🔨 Building project..."
pnpm build

# 5. Restart the server
echo "🔄 Restarting server..."
pm2 restart netnext || pm2 start npm --name netnext -- start

echo "✅ NEXIK v3.0 deployed successfully!"
echo ""
echo "Test with:"
echo "curl -X POST http://localhost:3000/api/nexik/analyze-input \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"input\": \"привет\", \"visitorId\": \"test_user_1\"}'"
