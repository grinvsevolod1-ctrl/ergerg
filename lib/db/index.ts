import { Pool } from 'pg'

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rows as T[]
  } finally {
    client.release()
  }
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return result.rowCount || 0
  } finally {
    client.release()
  }
}

// Current schema version
const SCHEMA_VERSION = 6

// Initialize database tables with versioning
export async function initDatabase(): Promise<void> {
  const client = await pool.connect()
  try {
    // Create migrations table first
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `)
    
    // Check current version
    const result = await client.query<{ version: number }>(
      'SELECT MAX(version) as version FROM schema_migrations'
    )
    const currentVersion = result.rows[0]?.version || 0
    
    if (currentVersion >= SCHEMA_VERSION) {
      console.log(`[DB] Schema is up to date (version ${currentVersion})`)
      return
    }
    
    console.log(`[DB] Running migrations from version ${currentVersion} to ${SCHEMA_VERSION}`)
    
    // Run migrations
    await client.query(`
      -- Leads table
      CREATE TABLE IF NOT EXISTS leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        description TEXT,
        niche VARCHAR(255),
        selected_variant_url TEXT,
        variants_viewed INTEGER DEFAULT 1,
        time_spent_seconds INTEGER,
        device_type VARCHAR(20),
        status VARCHAR(50) DEFAULT 'new',
        source VARCHAR(100) DEFAULT 'generator',
        utm_source VARCHAR(255),
        utm_medium VARCHAR(255),
        utm_campaign VARCHAR(255),
        utm_term VARCHAR(255),
        utm_content VARCHAR(255),
        yclid VARCHAR(255),
        gclid VARCHAR(255),
        referrer TEXT,
        landing_page TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        country VARCHAR(100),
        city VARCHAR(100),
        consent_given BOOLEAN DEFAULT true,
        consent_date TIMESTAMP DEFAULT NOW(),
        data_deletion_requested_at TIMESTAMP
      );

      -- Niche cache table
      CREATE TABLE IF NOT EXISTS niche_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        niche VARCHAR(255) NOT NULL,
        normalized_niche VARCHAR(255) UNIQUE NOT NULL,
        sites JSONB NOT NULL,
        searched_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days'
      );

      -- Analytics events table
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
        session_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Variant feedback table
      CREATE TABLE IF NOT EXISTS variant_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        niche VARCHAR(255) NOT NULL,
        variant_url TEXT NOT NULL,
        feedback VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Preview shares table
      CREATE TABLE IF NOT EXISTS preview_shares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        niche VARCHAR(255) NOT NULL,
        variant_index INTEGER NOT NULL,
        user_data JSONB NOT NULL,
        html TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
      );

      -- Chat sessions table (shared between website and Telegram bot)
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_type VARCHAR(20) NOT NULL DEFAULT 'website',
        telegram_chat_id BIGINT,
        telegram_username VARCHAR(255),
        telegram_name VARCHAR(255),
        operator_connected BOOLEAN DEFAULT false,
        operator_connected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );

      -- Chat messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id VARCHAR(255) NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        delivered BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Email campaigns table (for mailing system)
      CREATE TABLE IF NOT EXISTS mailing_campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        opened_count INTEGER DEFAULT 0,
        clicked_count INTEGER DEFAULT 0,
        scheduled_at TIMESTAMP,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Mailing recipients table
      CREATE TABLE IF NOT EXISTS mailing_recipients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        campaign_id UUID NOT NULL REFERENCES mailing_campaigns(id) ON DELETE CASCADE,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        sent_at TIMESTAMP,
        opened_at TIMESTAMP,
        clicked_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB DEFAULT '{}'
      );

      -- Email templates table
      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        html_content TEXT NOT NULL,
        text_content TEXT,
        variables JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Unsubscribe list (critical for anti-spam compliance)
      CREATE TABLE IF NOT EXISTS email_unsubscribes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        reason VARCHAR(255),
        unsubscribed_at TIMESTAMP DEFAULT NOW()
      );

      -- Auto-response rules table
      CREATE TABLE IF NOT EXISTS auto_response_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        trigger_type VARCHAR(50) NOT NULL,
        trigger_keywords TEXT[],
        trigger_pattern VARCHAR(500),
        response_text TEXT NOT NULL,
        response_buttons JSONB DEFAULT '[]',
        priority INTEGER DEFAULT 0,
        enabled BOOLEAN DEFAULT true,
        use_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Yandex Direct action audit log (v4)
      CREATE TABLE IF NOT EXISTS yandex_direct_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(50) NOT NULL,
        campaign_id BIGINT,
        campaign_name VARCHAR(500),
        success BOOLEAN NOT NULL DEFAULT true,
        error_message TEXT,
        details JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Quick reply templates for operators
      CREATE TABLE IF NOT EXISTS quick_reply_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        shortcut VARCHAR(50),
        use_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- NetNext public chat learning logs (used by /api/chat/ai)
      CREATE TABLE IF NOT EXISTS netnext_chat_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id VARCHAR(255),
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        intent VARCHAR(100),
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS netnext_chat_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id VARCHAR(255) NOT NULL,
        reaction VARCHAR(20) NOT NULL,
        visitor_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- v5: marketing attribution columns for existing installs
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS yclid VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS gclid VARCHAR(255);
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS referrer TEXT;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS landing_page TEXT;

      -- v6: chat_sessions.updated_at — required by the update_chat_sessions_updated_at
      -- trigger present in production dumps. Without it every UPDATE on chat_sessions
      -- throws ("record \"new\" has no field \"updated_at\""), breaking message saving,
      -- operator connect and AI suppression.
      ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
      CREATE INDEX IF NOT EXISTS idx_leads_yclid ON leads(yclid) WHERE yclid IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign) WHERE utm_campaign IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_niche_cache_normalized ON niche_cache(normalized_niche);
      CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_preview_expires ON preview_shares(expires_at);
      CREATE INDEX IF NOT EXISTS idx_chat_sessions_active ON chat_sessions(operator_connected) WHERE operator_connected = true;
      CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_chat_messages_undelivered ON chat_messages(session_id, delivered) WHERE delivered = false;
      CREATE INDEX IF NOT EXISTS idx_mailing_campaigns_status ON mailing_campaigns(status);
      CREATE INDEX IF NOT EXISTS idx_mailing_recipients_campaign ON mailing_recipients(campaign_id, status);
      CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);
      CREATE INDEX IF NOT EXISTS idx_auto_response_enabled ON auto_response_rules(enabled, priority DESC);
      CREATE INDEX IF NOT EXISTS idx_quick_reply_category ON quick_reply_templates(category);
      CREATE INDEX IF NOT EXISTS idx_yandex_direct_logs_created ON yandex_direct_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_yandex_direct_logs_campaign ON yandex_direct_logs(campaign_id);
    `)
    
    // Record migration
    await client.query(
      'INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO NOTHING',
      [SCHEMA_VERSION]
    )
    
    console.log(`[DB] Migration to version ${SCHEMA_VERSION} completed`)
  } finally {
    client.release()
  }
}

export { pool }
