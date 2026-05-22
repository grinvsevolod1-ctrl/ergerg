-- ═══════════════════════════════════════════════════════════════
-- Migration 002: Chat Sessions, Messages, Auto-Responses, Mailings
-- Запуск: psql -U netnext -d netnext -f scripts/migrate-002-chat-mailings.sql
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- Chat Sessions (сессии чатов)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id VARCHAR(255) PRIMARY KEY,
  source VARCHAR(50) NOT NULL DEFAULT 'website',  -- website, telegram
  telegram_chat_id VARCHAR(255),
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  user_phone VARCHAR(255),
  user_ip INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  country VARCHAR(100),
  city VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',  -- active, closed, archived
  is_read BOOLEAN DEFAULT false,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_source ON chat_sessions(source);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created ON chat_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_telegram ON chat_sessions(telegram_chat_id);

-- ─────────────────────────────────────────────────────────────────
-- Chat Messages (сообщения)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL,  -- user, bot, operator
  content TEXT NOT NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_type);

-- ─────────────────────────────────────────────────────────────────
-- Auto-Response Rules (правила автоответов)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auto_response_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL DEFAULT 'keywords',  -- keywords, regex, contains
  trigger_value TEXT NOT NULL,  -- JSON array of keywords or regex pattern
  response_text TEXT NOT NULL,
  response_buttons JSONB,  -- [{label, action, url?}]
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_response_active ON auto_response_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_auto_response_priority ON auto_response_rules(priority DESC);

-- ─────────────────────────────────────────────────────────────────
-- Mailing Campaigns (рассылки)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mailing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  status VARCHAR(50) DEFAULT 'draft',  -- draft, scheduled, sending, paused, completed, failed
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_status ON mailing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_created ON mailing_campaigns(created_at DESC);

-- ─────────────────────────────────────────────────────────────────
-- Mailing Recipients (получатели рассылок)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mailing_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES mailing_campaigns(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  company VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed, opened, clicked, bounced
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, email)
);

CREATE INDEX IF NOT EXISTS idx_mailing_recipients_campaign ON mailing_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_mailing_recipients_status ON mailing_recipients(status);
CREATE INDEX IF NOT EXISTS idx_mailing_recipients_email ON mailing_recipients(email);

-- ─────────────────────────────────────────────────────────────────
-- Email Unsubscribes (отписки)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(255),
  unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- ─────────────────────────────────────────────────────────────────
-- Email Templates (шаблоны писем)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',  -- ['name', 'company', 'email']
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- Триггеры для updated_at
-- ─────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auto_response_rules_updated_at ON auto_response_rules;
CREATE TRIGGER update_auto_response_rules_updated_at
  BEFORE UPDATE ON auto_response_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mailing_campaigns_updated_at ON mailing_campaigns;
CREATE TRIGGER update_mailing_campaigns_updated_at
  BEFORE UPDATE ON mailing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- Готово! Миграция для чатов и рассылок завершена.
-- ═══════════════════════════════════════════════════════════════
