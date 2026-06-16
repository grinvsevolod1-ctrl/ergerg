-- migrate-003-fix-chat-trigger.sql
--
-- FIX: chat is fully broken on production.
--
-- The production dump (database.sql) attaches the trigger
--   update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
--     EXECUTE FUNCTION update_updated_at_column()
-- and that function runs `NEW.updated_at = NOW()`, but the chat_sessions
-- table has no `updated_at` column.
--
-- Result: EVERY update on chat_sessions throws
--   'record "new" has no field "updated_at"'
-- which breaks:
--   * POST /api/chat/message      -> 500 (addMessage -> updateSessionActivity)
--   * Telegram "Подключиться" button (connectOperator silently fails)
--   * operator takeover / AI suppression (operator_connected never persists)
--
-- Run once on the VPS:
--   psql "$DATABASE_URL" -f scripts/migrate-003-fix-chat-trigger.sql

ALTER TABLE public.chat_sessions
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

-- Backfill existing rows so the column is never NULL.
UPDATE public.chat_sessions
  SET updated_at = COALESCE(updated_at, last_activity, created_at, now())
  WHERE updated_at IS NULL;

-- Safety net: AI learning tables used by /api/chat/ai (silently optional, but
-- creating them removes noisy error logs on every visitor message).
CREATE TABLE IF NOT EXISTS public.netnext_chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id varchar(255),
  user_message text NOT NULL,
  ai_response text NOT NULL,
  intent varchar(100),
  source varchar(50),
  created_at timestamp without time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.netnext_chat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id varchar(255) NOT NULL,
  reaction varchar(20) NOT NULL,
  visitor_id varchar(255),
  created_at timestamp without time zone DEFAULT now()
);
