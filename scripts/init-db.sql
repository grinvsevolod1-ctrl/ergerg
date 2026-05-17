-- ═══════════════════════════════════════════════════════════════
-- NetNext Database Initialization Script
-- Запуск: psql -U netnext -d netnext -f scripts/init-db.sql
-- ═══════════════════════════════════════════════════════════════

-- Расширения
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────
-- Таблица лидов (заявки с генератора и форм)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Основные данные (шифруются)
  company_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,           -- Шифруется
  email VARCHAR(255) NOT NULL,           -- Шифруется
  description TEXT,
  
  -- Данные генератора
  niche VARCHAR(255),
  selected_variant_url TEXT,
  variants_viewed INTEGER DEFAULT 1,
  time_spent_seconds INTEGER,
  device_type VARCHAR(20),               -- desktop, tablet, mobile
  
  -- Воронка продаж
  status VARCHAR(50) DEFAULT 'new',      -- new, contacted, qualified, sold, lost
  source VARCHAR(100) DEFAULT 'website', -- website, generator, telegram
  
  -- UTM метки
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Метаданные
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- GDPR
  consent_given BOOLEAN DEFAULT true,
  consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_deletion_requested_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для leads
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_niche ON leads(niche);

-- ─────────────────────────────────────────────────────────────────
-- Таблица аналитики событий
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,      -- generation_started, variant_viewed, order_clicked
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для analytics
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_lead_id ON analytics_events(lead_id);

-- ─────────────────────────────────────────────────────────────────
-- Таблица фидбека на варианты сайтов (like/dislike)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS variant_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) NOT NULL,
  variant_url TEXT NOT NULL,
  feedback VARCHAR(20) NOT NULL,         -- like, dislike
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для feedback
CREATE INDEX IF NOT EXISTS idx_feedback_niche ON variant_feedback(niche);
CREATE INDEX IF NOT EXISTS idx_feedback_url ON variant_feedback(variant_url);

-- ─────────────────────────────────────────────────────────────────
-- Таблица кэша ниш (спарсенные сайты)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS niche_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  niche VARCHAR(255) UNIQUE NOT NULL,
  sites JSONB NOT NULL,                  -- [{url, html, title}, ...]
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days'
);

-- Индексы для niche_cache
CREATE INDEX IF NOT EXISTS idx_niche_cache_niche ON niche_cache(niche);
CREATE INDEX IF NOT EXISTS idx_niche_cache_expires ON niche_cache(expires_at);

-- ─────────────────────────────────────────────────────────────────
-- Таблица шаринга превью (временные ссылки)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS preview_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  html TEXT NOT NULL,
  niche VARCHAR(255),
  user_data JSONB,                       -- {companyName, phone, email}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '24 hours',
  views_count INTEGER DEFAULT 0
);

-- Индексы для preview_shares
CREATE INDEX IF NOT EXISTS idx_preview_expires ON preview_shares(expires_at);

-- ─────────────────────────────────────────────────────────────────
-- Функция автообновления updated_at
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────
-- Очистка просроченных данных (запускать по cron)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Удаляем просроченные превью
  DELETE FROM preview_shares WHERE expires_at < NOW();
  
  -- Удаляем просроченный кэш ниш
  DELETE FROM niche_cache WHERE expires_at < NOW();
  
  -- Удаляем старые события (старше 90 дней)
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════
-- Готово! База данных инициализирована.
-- ═══════════════════════════════════════════════════════════════
