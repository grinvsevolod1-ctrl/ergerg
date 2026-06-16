-- Migration 004: auto-response rules, quick replies, and AI learning storage
-- Safe to run multiple times (idempotent). Run on the VPS with:
--   psql "$DATABASE_URL" -f scripts/migrate-004-auto-responses-learning.sql

-- 1. Auto-response rules (admin /auto-responses -> "Правила бота")
CREATE TABLE IF NOT EXISTS auto_response_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(20) NOT NULL DEFAULT 'keywords',
  trigger_keywords TEXT[],
  trigger_pattern TEXT,
  response_text TEXT NOT NULL,
  response_buttons JSONB DEFAULT '[]'::jsonb,
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Quick reply templates (admin /auto-responses -> "Быстрые ответы")
CREATE TABLE IF NOT EXISTS quick_reply_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL DEFAULT 'Общее',
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50),
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. AI learning logs (every dialog turn) + feedback
CREATE TABLE IF NOT EXISTS netnext_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(255),
  visitor_id VARCHAR(255),
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  intent VARCHAR(100),
  source VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
ALTER TABLE netnext_chat_logs ADD COLUMN IF NOT EXISTS message_id VARCHAR(255);

CREATE TABLE IF NOT EXISTS netnext_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id VARCHAR(255) NOT NULL,
  reaction VARCHAR(20) NOT NULL,
  visitor_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Indexes for fast lookups / learning
CREATE INDEX IF NOT EXISTS idx_auto_response_enabled ON auto_response_rules(enabled, priority DESC);
CREATE INDEX IF NOT EXISTS idx_chat_logs_message ON netnext_chat_logs(lower(user_message));
CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON netnext_chat_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_feedback_msg ON netnext_chat_feedback(message_id);
