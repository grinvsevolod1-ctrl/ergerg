-- =====================================================
-- NEXIK MULTI-TENANT SAAS SCHEMA
-- Version: 1.0
-- Run: psql -d your_database -f scripts/nexik-schema.sql
-- =====================================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings (RAG semantic search)
-- Note: pgvector must be installed on the server
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations (Tenants/Clients)
CREATE TABLE IF NOT EXISTS nexik_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  domain VARCHAR(255),
  logo_url TEXT,
  
  -- Owner info
  owner_email VARCHAR(255) NOT NULL,
  owner_name VARCHAR(255),
  owner_phone VARCHAR(50),
  business_description TEXT,
  
  -- Billing
  plan VARCHAR(50) DEFAULT 'free',
  plan_expires_at TIMESTAMP,
  messages_limit INTEGER DEFAULT 1000,
  messages_used INTEGER DEFAULT 0,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  ai_config JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Organization Members (Users who manage the org)
CREATE TABLE IF NOT EXISTS nexik_org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  avatar_url TEXT,
  
  -- Auth
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(org_id, email)
);

-- API Keys for widget authentication
CREATE TABLE IF NOT EXISTS nexik_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL,
  
  -- Permissions
  permissions JSONB DEFAULT '["widget"]',
  
  -- Rate limiting
  rate_limit INTEGER DEFAULT 100,
  
  -- Usage tracking
  last_used_at TIMESTAMP,
  request_count BIGINT DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Widget Configurations
CREATE TABLE IF NOT EXISTS nexik_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  
  -- Domains allowed to use this widget
  domains TEXT[] DEFAULT '{}',
  allowed_domains TEXT[] DEFAULT '{}',
  
  -- Appearance
  theme JSONB DEFAULT '{
    "position": "bottom-right",
    "primaryColor": "#00ffff",
    "backgroundColor": "#0a0a0f",
    "textColor": "#ffffff",
    "borderRadius": 16,
    "showAvatar": true,
    "avatarUrl": null
  }',
  
  -- Behavior
  welcome_message TEXT DEFAULT 'Привет! Чем могу помочь?',
  greeting_message TEXT DEFAULT 'Привет! Чем могу помочь?',
  placeholder_text VARCHAR(255) DEFAULT 'Введите сообщение...',
  offline_message TEXT DEFAULT 'Мы сейчас офлайн. Оставьте сообщение, и мы ответим как можно скорее.',
  
  -- Lead capture
  require_email BOOLEAN DEFAULT false,
  require_name BOOLEAN DEFAULT false,
  pre_chat_form JSONB DEFAULT '[]',
  
  -- AI Configuration
  ai_enabled BOOLEAN DEFAULT true,
  ai_model VARCHAR(100) DEFAULT 'qwen2.5:7b',
  ai_temperature DECIMAL(3,2) DEFAULT 0.7,
  ai_max_tokens INTEGER DEFAULT 500,
  system_prompt TEXT,
  
  -- Auto-responses before AI
  quick_replies JSONB DEFAULT '[]',
  
  -- Operator settings
  auto_assign_operator BOOLEAN DEFAULT true,
  operator_timeout_seconds INTEGER DEFAULT 300,
  
  -- Analytics
  track_events BOOLEAN DEFAULT true,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Work schedules (when AI vs operator responds)
CREATE TABLE IF NOT EXISTS nexik_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES nexik_widgets(id) ON DELETE CASCADE,
  
  -- Mode: 'ai_only' | 'operator_only' | 'hybrid'
  mode VARCHAR(50) DEFAULT 'ai_only',
  
  -- Work hours (when operator is available)
  work_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
  work_days JSONB DEFAULT '["mon", "tue", "wed", "thu", "fri"]',
  timezone VARCHAR(50) DEFAULT 'Europe/Moscow',
  
  -- Notifications
  notify_on_new_chat BOOLEAN DEFAULT true,
  notify_on_operator_needed BOOLEAN DEFAULT true,
  notification_email VARCHAR(255),
  notification_telegram VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Base Documents (RAG)
CREATE TABLE IF NOT EXISTS nexik_knowledge_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  
  -- Document info
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  source_type VARCHAR(50) DEFAULT 'manual',
  source_url TEXT,
  
  -- Processing status
  status VARCHAR(50) DEFAULT 'pending',
  chunks_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Knowledge Chunks (for RAG retrieval)
CREATE TABLE IF NOT EXISTS nexik_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id UUID NOT NULL REFERENCES nexik_knowledge_docs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  
  -- Chunk content
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  
  -- For keyword search (TF-IDF style)
  tokens TEXT[] DEFAULT '{}',
  token_weights JSONB DEFAULT '{}',
  
  -- For vector search (pgvector semantic search)
  embedding VECTOR(384),
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Conversations (Chat Sessions)
CREATE TABLE IF NOT EXISTS nexik_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES nexik_widgets(id) ON DELETE SET NULL,
  
  -- Visitor info
  visitor_id VARCHAR(255) NOT NULL,
  visitor_name VARCHAR(255),
  visitor_email VARCHAR(255),
  visitor_phone VARCHAR(50),
  visitor_metadata JSONB DEFAULT '{}',
  
  -- Source info
  page_url TEXT,
  page_title VARCHAR(500),
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  
  -- Device info
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Status: 'active' | 'waiting' | 'resolved' | 'archived'
  status VARCHAR(50) DEFAULT 'active',
  assigned_operator_id UUID REFERENCES nexik_org_members(id) ON DELETE SET NULL,
  
  -- Timestamps
  first_message_at TIMESTAMP,
  last_message_at TIMESTAMP,
  resolved_at TIMESTAMP,
  
  -- Ratings
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  
  -- Tags for organization
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages
CREATE TABLE IF NOT EXISTS nexik_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES nexik_conversations(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  
  -- Sender info: 'visitor' | 'ai' | 'operator' | 'system'
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('visitor', 'ai', 'operator', 'system')),
  sender_id UUID,
  sender_name VARCHAR(255),
  
  -- Content
  content TEXT NOT NULL,
  content_type VARCHAR(50) DEFAULT 'text',
  attachments JSONB DEFAULT '[]',
  
  -- AI metadata
  ai_model VARCHAR(100),
  ai_tokens_used INTEGER,
  ai_response_time_ms INTEGER,
  rag_context_used BOOLEAN DEFAULT false,
  
  -- Quick replies attached to this message
  quick_replies JSONB DEFAULT '[]',
  
  -- Delivery status
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Operator presence (who's online)
CREATE TABLE IF NOT EXISTS nexik_operator_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES nexik_org_members(id) ON DELETE CASCADE,
  
  status VARCHAR(50) DEFAULT 'online',
  last_seen_at TIMESTAMP DEFAULT NOW(),
  active_conversations INTEGER DEFAULT 0,
  max_conversations INTEGER DEFAULT 5,
  
  UNIQUE(org_id, member_id)
);

-- Webhooks configuration
CREATE TABLE IF NOT EXISTS nexik_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),
  
  -- Events to trigger
  events TEXT[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS nexik_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES nexik_webhooks(id) ON DELETE CASCADE,
  
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Response
  response_status INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  next_retry_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Canned responses (templates for operators)
CREATE TABLE IF NOT EXISTS nexik_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  shortcut VARCHAR(50),
  category VARCHAR(100),
  
  use_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics aggregations (hourly/daily stats)
CREATE TABLE IF NOT EXISTS nexik_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
  widget_id UUID REFERENCES nexik_widgets(id) ON DELETE SET NULL,
  
  period_type VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  
  -- Counts
  conversations_started INTEGER DEFAULT 0,
  conversations_resolved INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  ai_messages INTEGER DEFAULT 0,
  operator_messages INTEGER DEFAULT 0,
  
  -- Performance
  avg_first_response_ms INTEGER,
  avg_resolution_time_ms INTEGER,
  avg_rating DECIMAL(3,2),
  
  -- Engagement
  unique_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(org_id, widget_id, period_type, period_start)
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS nexik_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) NOT NULL,
  
  window_start TIMESTAMP NOT NULL,
  request_count INTEGER DEFAULT 1,
  
  UNIQUE(key, window_start)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_nexik_orgs_slug ON nexik_organizations(slug);
CREATE INDEX IF NOT EXISTS idx_nexik_orgs_domain ON nexik_organizations(domain);
CREATE INDEX IF NOT EXISTS idx_nexik_orgs_email ON nexik_organizations(owner_email);

CREATE INDEX IF NOT EXISTS idx_nexik_members_email ON nexik_org_members(email);
CREATE INDEX IF NOT EXISTS idx_nexik_members_org ON nexik_org_members(org_id);

CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_hash ON nexik_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_prefix ON nexik_api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_org ON nexik_api_keys(org_id);

CREATE INDEX IF NOT EXISTS idx_nexik_widgets_org ON nexik_widgets(org_id);

CREATE INDEX IF NOT EXISTS idx_nexik_schedules_org ON nexik_schedules(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_schedules_widget ON nexik_schedules(widget_id);

CREATE INDEX IF NOT EXISTS idx_nexik_knowledge_org ON nexik_knowledge_docs(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_chunks_org ON nexik_knowledge_chunks(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_chunks_doc ON nexik_knowledge_chunks(doc_id);

CREATE INDEX IF NOT EXISTS idx_nexik_convos_org ON nexik_conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_convos_visitor ON nexik_conversations(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nexik_convos_status ON nexik_conversations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_nexik_convos_operator ON nexik_conversations(assigned_operator_id);
CREATE INDEX IF NOT EXISTS idx_nexik_convos_created ON nexik_conversations(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nexik_messages_convo ON nexik_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_org ON nexik_messages(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_created ON nexik_messages(conversation_id, created_at);

CREATE INDEX IF NOT EXISTS idx_nexik_presence_org ON nexik_operator_presence(org_id);
CREATE INDEX IF NOT EXISTS idx_nexik_presence_status ON nexik_operator_presence(org_id, status);

CREATE INDEX IF NOT EXISTS idx_nexik_webhooks_org ON nexik_webhooks(org_id);

CREATE INDEX IF NOT EXISTS idx_nexik_analytics_org ON nexik_analytics(org_id, period_type, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_nexik_rate_limits_key ON nexik_rate_limits(key, window_start);

-- Vector search index (HNSW for fast similarity search)
CREATE INDEX IF NOT EXISTS idx_nexik_chunks_embedding 
ON nexik_knowledge_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Semantic search function
CREATE OR REPLACE FUNCTION nexik_semantic_search(
  p_org_id UUID,
  p_query_embedding vector,
  p_limit INTEGER DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chunk_id,
    c.doc_id as document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> p_query_embedding) as similarity
  FROM nexik_knowledge_chunks c
  JOIN nexik_knowledge_docs d ON d.id = c.doc_id
  WHERE d.org_id = p_org_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (optional test data)
-- =====================================================

-- Uncomment to create test organization
/*
INSERT INTO nexik_organizations (name, owner_email, owner_name, business_description, plan)
VALUES (
  'Test Company',
  'test@example.com',
  'Test User',
  'Тестовая компания для проверки Nexik',
  'free'
) ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- DONE
-- =====================================================
SELECT 'Nexik schema created successfully!' as status;
