/**
 * Nexik Multi-tenant Database Schema
 * Production-ready SaaS chat platform
 */

import { query, execute } from '@/lib/db'

export const NEXIK_SCHEMA_VERSION = 1

export async function initNexikSchema(): Promise<void> {
  await execute(`
    -- =====================================================
    -- NEXIK MULTI-TENANT SAAS SCHEMA
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
      
      -- For future vector search
      embedding VECTOR(1536),
      
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
      
      -- Status
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
      
      -- Sender info
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
    
    CREATE INDEX IF NOT EXISTS idx_nexik_members_email ON nexik_org_members(email);
    CREATE INDEX IF NOT EXISTS idx_nexik_members_org ON nexik_org_members(org_id);
    
    CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_hash ON nexik_api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_prefix ON nexik_api_keys(key_prefix);
    CREATE INDEX IF NOT EXISTS idx_nexik_api_keys_org ON nexik_api_keys(org_id);
    
    CREATE INDEX IF NOT EXISTS idx_nexik_widgets_org ON nexik_widgets(org_id);
    
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

    -- =====================================================
    -- ADVANCED FEATURES SCHEMA (v2)
    -- =====================================================

    -- Sentiment columns on messages
    ALTER TABLE nexik_messages ADD COLUMN IF NOT EXISTS sentiment_score DECIMAL(4,2);
    ALTER TABLE nexik_messages ADD COLUMN IF NOT EXISTS sentiment_label VARCHAR(20);
    ALTER TABLE nexik_messages ADD COLUMN IF NOT EXISTS sentiment_data JSONB;
    ALTER TABLE nexik_messages ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10);
    ALTER TABLE nexik_messages ADD COLUMN IF NOT EXISTS voice_message_id UUID;

    -- Sentiment and language on conversations  
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS sentiment_trend DECIMAL(4,2);
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS primary_language VARCHAR(10);
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS auto_tags TEXT[] DEFAULT '{}';
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS detected_intent VARCHAR(50);
    ALTER TABLE nexik_conversations ADD COLUMN IF NOT EXISTS detected_topics TEXT[] DEFAULT '{}';

    -- Auto-tag rules
    CREATE TABLE IF NOT EXISTS nexik_auto_tag_rules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      patterns TEXT[] DEFAULT '{}',
      keywords TEXT[] DEFAULT '{}',
      tag VARCHAR(100) NOT NULL,
      priority INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Proactive messaging triggers
    CREATE TABLE IF NOT EXISTS nexik_proactive_triggers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      widget_id UUID REFERENCES nexik_widgets(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      trigger_type VARCHAR(50) NOT NULL,
      conditions JSONB NOT NULL DEFAULT '{}',
      message TEXT NOT NULL,
      quick_replies JSONB DEFAULT '[]',
      delay_seconds INTEGER DEFAULT 0,
      max_shows_per_visitor INTEGER DEFAULT 1,
      cooldown_hours INTEGER DEFAULT 24,
      is_active BOOLEAN DEFAULT true,
      priority INTEGER DEFAULT 0,
      stats JSONB DEFAULT '{"shown": 0, "clicked": 0, "converted": 0}',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Proactive messaging logs
    CREATE TABLE IF NOT EXISTS nexik_proactive_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trigger_id UUID NOT NULL REFERENCES nexik_proactive_triggers(id) ON DELETE CASCADE,
      visitor_id VARCHAR(255) NOT NULL,
      shown_at TIMESTAMP DEFAULT NOW(),
      clicked_at TIMESTAMP,
      converted_at TIMESTAMP
    );

    -- Voice messages
    CREATE TABLE IF NOT EXISTS nexik_voice_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID NOT NULL REFERENCES nexik_conversations(id) ON DELETE CASCADE,
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      sender_type VARCHAR(20) NOT NULL,
      audio_url TEXT NOT NULL,
      audio_format VARCHAR(50) NOT NULL,
      duration_seconds INTEGER,
      transcription TEXT,
      transcription_confidence DECIMAL(3,2),
      detected_language VARCHAR(10),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Custom AI models (LoRA)
    CREATE TABLE IF NOT EXISTS nexik_custom_models (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      base_model VARCHAR(100) NOT NULL,
      adapter_path TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      training_started_at TIMESTAMP,
      training_completed_at TIMESTAMP,
      metrics JSONB DEFAULT '{"samples_used": 0, "epochs": 0}',
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Training jobs
    CREATE TABLE IF NOT EXISTS nexik_training_jobs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      model_id UUID NOT NULL REFERENCES nexik_custom_models(id) ON DELETE CASCADE,
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'queued',
      progress INTEGER DEFAULT 0,
      current_epoch INTEGER,
      current_loss DECIMAL(10,6),
      config JSONB,
      training_data_count INTEGER,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      error TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- Training data (conversation exports)
    CREATE TABLE IF NOT EXISTS nexik_training_data (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      conversation_id UUID NOT NULL REFERENCES nexik_conversations(id) ON DELETE CASCADE,
      messages JSONB NOT NULL,
      quality_score DECIMAL(3,2) NOT NULL,
      included_in_training BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(org_id, conversation_id)
    );

    -- A/B test results for custom models
    CREATE TABLE IF NOT EXISTS nexik_ab_test_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      model_id UUID REFERENCES nexik_custom_models(id) ON DELETE SET NULL,
      is_custom BOOLEAN NOT NULL,
      response_time_ms INTEGER,
      rating INTEGER,
      resolved BOOLEAN,
      created_at TIMESTAMP DEFAULT NOW()
    );

    -- =====================================================
    -- ADDITIONAL INDEXES (v2)
    -- =====================================================

    CREATE INDEX IF NOT EXISTS idx_nexik_messages_sentiment ON nexik_messages(conversation_id, sentiment_label);
    CREATE INDEX IF NOT EXISTS idx_nexik_conversations_priority ON nexik_conversations(org_id, priority);
    CREATE INDEX IF NOT EXISTS idx_nexik_conversations_language ON nexik_conversations(org_id, primary_language);
    CREATE INDEX IF NOT EXISTS idx_nexik_auto_tag_rules_org ON nexik_auto_tag_rules(org_id);
    CREATE INDEX IF NOT EXISTS idx_nexik_proactive_triggers_org ON nexik_proactive_triggers(org_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_nexik_proactive_logs_visitor ON nexik_proactive_logs(visitor_id, shown_at);
    CREATE INDEX IF NOT EXISTS idx_nexik_voice_messages_convo ON nexik_voice_messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_nexik_custom_models_org ON nexik_custom_models(org_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_nexik_training_jobs_model ON nexik_training_jobs(model_id, status);
    CREATE INDEX IF NOT EXISTS idx_nexik_ab_test_results_org ON nexik_ab_test_results(org_id, created_at);

    -- =====================================================
    -- MEMORY SYSTEM (v3) - Long-term visitor memory
    -- =====================================================

    CREATE TABLE IF NOT EXISTS nexik_visitor_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      visitor_id VARCHAR(255) NOT NULL,
      
      -- Identity
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(100),
      avatar_url TEXT,
      
      -- Personality profile
      communication_style VARCHAR(50),
      preferred_language VARCHAR(10),
      timezone VARCHAR(50),
      response_speed_preference VARCHAR(50),
      
      -- Business context
      company_name VARCHAR(255),
      job_title VARCHAR(255),
      industry VARCHAR(100),
      company_size VARCHAR(50),
      
      -- Arrays (stored as JSONB)
      interests JSONB DEFAULT '[]',
      pain_points JSONB DEFAULT '[]',
      goals JSONB DEFAULT '[]',
      products_interested JSONB DEFAULT '[]',
      products_purchased JSONB DEFAULT '[]',
      
      -- Purchase history
      customer_since TIMESTAMP,
      total_purchases INTEGER DEFAULT 0,
      total_spent DECIMAL(12,2) DEFAULT 0,
      last_purchase_at TIMESTAMP,
      
      -- Interaction stats
      total_conversations INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      avg_sentiment_score DECIMAL(4,2),
      last_sentiment VARCHAR(20),
      
      -- AI-extracted data
      facts JSONB DEFAULT '[]',
      conversation_summaries JSONB DEFAULT '[]',
      
      -- Timestamps
      first_seen_at TIMESTAMP DEFAULT NOW(),
      last_seen_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      
      UNIQUE(org_id, visitor_id)
    );

    CREATE INDEX IF NOT EXISTS idx_nexik_visitor_memory_org ON nexik_visitor_memory(org_id);
    CREATE INDEX IF NOT EXISTS idx_nexik_visitor_memory_visitor ON nexik_visitor_memory(org_id, visitor_id);
    CREATE INDEX IF NOT EXISTS idx_nexik_visitor_memory_last_seen ON nexik_visitor_memory(org_id, last_seen_at DESC);

    -- =====================================================
    -- PERSONALITY SYSTEM (v3) - Configurable AI personality
    -- =====================================================

    CREATE TABLE IF NOT EXISTS nexik_personalities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      org_id UUID NOT NULL REFERENCES nexik_organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      is_default BOOLEAN DEFAULT false,
      
      -- Core personality
      persona_name VARCHAR(100),
      persona_role VARCHAR(255),
      persona_description TEXT,
      
      -- Communication style
      formality VARCHAR(50) DEFAULT 'mixed',
      humor_level VARCHAR(50) DEFAULT 'moderate',
      emoji_usage VARCHAR(50) DEFAULT 'moderate',
      response_length VARCHAR(50) DEFAULT 'balanced',
      
      -- Language settings
      use_slang BOOLEAN DEFAULT true,
      use_filler_words BOOLEAN DEFAULT true,
      make_typos BOOLEAN DEFAULT false,
      typo_frequency DECIMAL(3,2) DEFAULT 0,
      
      -- Behavior
      ask_clarifying_questions BOOLEAN DEFAULT true,
      admit_uncertainty BOOLEAN DEFAULT true,
      show_empathy BOOLEAN DEFAULT true,
      use_visitor_name BOOLEAN DEFAULT true,
      
      -- Response patterns
      greeting_templates JSONB DEFAULT '[]',
      farewell_templates JSONB DEFAULT '[]',
      filler_phrases JSONB DEFAULT '[]',
      thinking_phrases JSONB DEFAULT '[]',
      
      -- System prompt additions
      custom_instructions TEXT,
      forbidden_topics TEXT[],
      required_disclaimers TEXT[],
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_nexik_personalities_org ON nexik_personalities(org_id);
  `)
  // Database schema initialized
}

// Helper to check if schema exists
export async function isNexikSchemaInitialized(): Promise<boolean> {
  try {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'nexik_organizations'
      )`
    )
    return result[0]?.exists || false
  } catch {
    return false
  }
}
