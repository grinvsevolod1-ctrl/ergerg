-- ═══════════════════════════════════════════════════════════════
-- Migration 001: Add missing columns
-- Запуск: psql -U netnext -d netnext -f scripts/migrate-001.sql
-- ═══════════════════════════════════════════════════════════════

-- 1. Добавляем session_id в analytics_events
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id);

-- 2. Добавляем normalized_niche в niche_cache
ALTER TABLE niche_cache 
ADD COLUMN IF NOT EXISTS normalized_niche VARCHAR(255);

-- Заполняем normalized_niche для существующих записей
UPDATE niche_cache 
SET normalized_niche = LOWER(REPLACE(TRIM(niche), ' ', '_'))
WHERE normalized_niche IS NULL;

-- Создаем уникальный индекс на normalized_niche вместо niche
DROP INDEX IF EXISTS niche_cache_niche_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_niche_cache_normalized ON niche_cache(normalized_niche);

-- 3. Добавляем variant_index в preview_shares
ALTER TABLE preview_shares 
ADD COLUMN IF NOT EXISTS variant_index INTEGER DEFAULT 0;

ALTER TABLE preview_shares 
ADD COLUMN IF NOT EXISTS user_data JSONB;

-- ═══════════════════════════════════════════════════════════════
-- Готово! Миграция завершена.
-- ═══════════════════════════════════════════════════════════════
