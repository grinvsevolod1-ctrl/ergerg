/**
 * Nexik Row Level Security (RLS) Policies
 * Enterprise-grade multi-tenant data isolation
 * 
 * RLS ensures that even if application code has bugs,
 * users can only access data belonging to their organization.
 * 
 * SECURITY: All policies REQUIRE app.current_org_id to be set.
 * If not set, NO data is accessible (fail-closed).
 */

import { execute, query } from '@/lib/db'

/**
 * Initialize RLS policies for all Nexik tables
 * This should be run once during initial setup or migration
 */
export async function initNexikRLS(): Promise<void> {
  try {
    await execute(`
      -- =====================================================
      -- ROW LEVEL SECURITY POLICIES FOR NEXIK
      -- =====================================================
      -- 
      -- Strategy: We use app.current_org_id and app.current_member_id
      -- session variables set by the application before queries.
      -- This allows RLS to work without requiring PostgreSQL roles per user.
      --
      -- SECURITY: Policies are FAIL-CLOSED - if org_id is not set,
      -- NO data is accessible. This prevents accidental data leaks.
      --
      -- Before each request, application MUST call:
      --   SELECT set_config('app.current_org_id', 'org-uuid-here', true);
      --   SELECT set_config('app.current_member_id', 'member-uuid-here', true);
      -- The 'true' parameter makes it local to the transaction.

      -- =====================================================
      -- ENABLE RLS ON ALL NEXIK TABLES
      -- =====================================================
      
      ALTER TABLE nexik_organizations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_org_members ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_api_keys ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_widgets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_knowledge_docs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_knowledge_chunks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_conversations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_messages ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_operator_presence ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_webhooks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_webhook_deliveries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_schedules ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_canned_responses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE nexik_analytics ENABLE ROW LEVEL SECURITY;

      -- =====================================================
      -- DROP EXISTING POLICIES (for idempotent re-runs)
      -- =====================================================
      
      DROP POLICY IF EXISTS nexik_org_isolation ON nexik_organizations;
      DROP POLICY IF EXISTS nexik_members_isolation ON nexik_org_members;
      DROP POLICY IF EXISTS nexik_api_keys_isolation ON nexik_api_keys;
      DROP POLICY IF EXISTS nexik_widgets_isolation ON nexik_widgets;
      DROP POLICY IF EXISTS nexik_knowledge_docs_isolation ON nexik_knowledge_docs;
      DROP POLICY IF EXISTS nexik_knowledge_chunks_isolation ON nexik_knowledge_chunks;
      DROP POLICY IF EXISTS nexik_conversations_isolation ON nexik_conversations;
      DROP POLICY IF EXISTS nexik_messages_isolation ON nexik_messages;
      DROP POLICY IF EXISTS nexik_presence_isolation ON nexik_operator_presence;
      DROP POLICY IF EXISTS nexik_webhooks_isolation ON nexik_webhooks;
      DROP POLICY IF EXISTS nexik_webhook_deliveries_isolation ON nexik_webhook_deliveries;
      DROP POLICY IF EXISTS nexik_schedules_isolation ON nexik_schedules;
      DROP POLICY IF EXISTS nexik_canned_responses_isolation ON nexik_canned_responses;
      DROP POLICY IF EXISTS nexik_analytics_isolation ON nexik_analytics;

      -- =====================================================
      -- CREATE RLS POLICIES (FAIL-CLOSED: require org_id)
      -- =====================================================

      -- Organizations: Users can only see their own organization
      -- SECURITY: Fails closed - if org_id not set, returns no rows
      CREATE POLICY nexik_org_isolation ON nexik_organizations
        FOR ALL
        USING (
          id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Members: Users can only see members of their organization
      CREATE POLICY nexik_members_isolation ON nexik_org_members
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- API Keys: Org-level isolation
      CREATE POLICY nexik_api_keys_isolation ON nexik_api_keys
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Widgets: Org-level isolation
      CREATE POLICY nexik_widgets_isolation ON nexik_widgets
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Knowledge Docs: Org-level isolation
      CREATE POLICY nexik_knowledge_docs_isolation ON nexik_knowledge_docs
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Knowledge Chunks: Org-level isolation
      CREATE POLICY nexik_knowledge_chunks_isolation ON nexik_knowledge_chunks
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Conversations: Org-level isolation
      CREATE POLICY nexik_conversations_isolation ON nexik_conversations
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Messages: Org-level isolation
      CREATE POLICY nexik_messages_isolation ON nexik_messages
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Operator Presence: Org-level isolation
      CREATE POLICY nexik_presence_isolation ON nexik_operator_presence
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Webhooks: Org-level isolation
      CREATE POLICY nexik_webhooks_isolation ON nexik_webhooks
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Webhook Deliveries: Through webhook's org_id
      CREATE POLICY nexik_webhook_deliveries_isolation ON nexik_webhook_deliveries
        FOR ALL
        USING (
          current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
          AND webhook_id IN (
            SELECT id FROM nexik_webhooks 
            WHERE org_id::text = current_setting('app.current_org_id', true)
          )
        );

      -- Schedules: Org-level isolation
      CREATE POLICY nexik_schedules_isolation ON nexik_schedules
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Canned Responses: Org-level isolation
      CREATE POLICY nexik_canned_responses_isolation ON nexik_canned_responses
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );

      -- Analytics: Org-level isolation
      CREATE POLICY nexik_analytics_isolation ON nexik_analytics
        FOR ALL
        USING (
          org_id::text = current_setting('app.current_org_id', true)
          AND current_setting('app.current_org_id', true) IS NOT NULL
          AND current_setting('app.current_org_id', true) != ''
        );
    `)

    console.log('[Nexik RLS] Row Level Security policies initialized successfully')
  } catch (error) {
    console.error('[Nexik RLS] Failed to initialize RLS policies:', error)
    throw error
  }
}

/**
 * Set the current organization context for RLS
 * Must be called at the start of each request/transaction
 */
export async function setRLSContext(orgId: string, memberId?: string): Promise<void> {
  try {
    await execute(
      `SELECT set_config('app.current_org_id', $1, true)`,
      [orgId]
    )
    
    if (memberId) {
      await execute(
        `SELECT set_config('app.current_member_id', $1, true)`,
        [memberId]
      )
    }
  } catch (error) {
    console.error('[Nexik RLS] Failed to set RLS context:', error)
    throw error
  }
}

/**
 * Clear the RLS context (useful for admin operations)
 */
export async function clearRLSContext(): Promise<void> {
  try {
    await execute(`SELECT set_config('app.current_org_id', '', true)`)
    await execute(`SELECT set_config('app.current_member_id', '', true)`)
  } catch (error) {
    console.error('[Nexik RLS] Failed to clear RLS context:', error)
  }
}

/**
 * Execute a query with RLS context automatically set
 */
export async function queryWithRLS<T>(
  orgId: string,
  sqlQuery: string,
  params?: unknown[],
  memberId?: string
): Promise<T[]> {
  await setRLSContext(orgId, memberId)
  return query<T>(sqlQuery, params)
}

/**
 * Check if RLS is enabled on Nexik tables
 */
export async function isRLSEnabled(): Promise<boolean> {
  try {
    const result = await query<{ relname: string; relrowsecurity: boolean }>(
      `SELECT relname, relrowsecurity 
       FROM pg_class 
       WHERE relname LIKE 'nexik_%' 
       AND relkind = 'r'
       LIMIT 5`
    )
    
    return result.some(r => r.relrowsecurity === true)
  } catch {
    return false
  }
}

/**
 * Disable RLS (for admin/migration operations only!)
 * WARNING: Use with extreme caution
 */
export async function disableRLSTemporarily(): Promise<void> {
  console.warn('[Nexik RLS] WARNING: Temporarily disabling RLS - ensure this is intentional')
  await execute(`SET row_security = off`)
}

/**
 * Re-enable RLS after admin operations
 */
export async function enableRLS(): Promise<void> {
  await execute(`SET row_security = on`)
}
