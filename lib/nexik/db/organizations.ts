/**
 * Nexik Organizations (Tenants) Management
 */

import { query, queryOne, execute } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

// Types
export interface Organization {
  id: string
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  plan_expires_at: Date | null
  messages_limit: number
  messages_used: number
  settings: OrganizationSettings
  ai_config: AIConfig
  created_at: Date
  updated_at: Date
}

export interface OrganizationSettings {
  timezone?: string
  language?: string
  business_hours?: {
    enabled: boolean
    schedule: Record<string, { start: string; end: string } | null>
  }
  notifications?: {
    email?: boolean
    telegram?: boolean
    slack_webhook?: string
  }
}

export interface AIConfig {
  ollama_url?: string
  model?: string
  temperature?: number
  max_tokens?: number
  system_prompt?: string
}

export interface OrgMember {
  id: string
  org_id: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'operator' | 'member'
  avatar_url: string | null
  email_verified: boolean
  last_login_at: Date | null
  created_at: Date
}

export interface APIKey {
  id: string
  org_id: string
  name: string
  key_prefix: string
  permissions: string[]
  rate_limit: number
  last_used_at: Date | null
  request_count: number
  expires_at: Date | null
  created_at: Date
}

// Plans configuration
export const PLANS = {
  free: {
    messages_limit: 500,
    widgets: 1,
    operators: 1,
    knowledge_docs: 10,
    retention_days: 30,
    features: ['basic_ai', 'widget']
  },
  starter: {
    messages_limit: 5000,
    widgets: 3,
    operators: 3,
    knowledge_docs: 50,
    retention_days: 90,
    features: ['basic_ai', 'widget', 'analytics', 'webhooks']
  },
  pro: {
    messages_limit: 25000,
    widgets: 10,
    operators: 10,
    knowledge_docs: 200,
    retention_days: 365,
    features: ['advanced_ai', 'widget', 'analytics', 'webhooks', 'api', 'white_label']
  },
  enterprise: {
    messages_limit: -1, // unlimited
    widgets: -1,
    operators: -1,
    knowledge_docs: -1,
    retention_days: -1,
    features: ['advanced_ai', 'widget', 'analytics', 'webhooks', 'api', 'white_label', 'sla', 'dedicated_support']
  }
} as const

// Organization CRUD
export async function createOrganization(data: {
  name: string
  slug?: string
  domain?: string
  owner_email: string
  owner_name?: string
  owner_password_hash: string
}): Promise<{ org: Organization; member: OrgMember; apiKey: string }> {
  // Generate slug if not provided
  const slug = data.slug || generateSlug(data.name)
  
  // Check if slug is taken
  const existing = await getOrganizationBySlug(slug)
  if (existing) {
    throw new Error('Organization slug already exists')
  }

  // Create organization
  const orgs = await query<Organization>(
    `INSERT INTO nexik_organizations (name, slug, domain, plan, messages_limit)
     VALUES ($1, $2, $3, 'free', 500)
     RETURNING *`,
    [data.name, slug, data.domain || null]
  )
  const org = orgs[0]

  // Create owner member
  const members = await query<OrgMember>(
    `INSERT INTO nexik_org_members (org_id, email, password_hash, name, role, email_verified)
     VALUES ($1, $2, $3, $4, 'owner', false)
     RETURNING *`,
    [org.id, data.owner_email, data.owner_password_hash, data.owner_name || null]
  )
  const member = members[0]

  // Create default API key
  const { key, keyData } = await createAPIKey(org.id, 'Default Widget Key')

  return { org, member, apiKey: key }
}

export async function getOrganization(id: string): Promise<Organization | null> {
  return queryOne<Organization>(
    'SELECT * FROM nexik_organizations WHERE id = $1 AND deleted_at IS NULL',
    [id]
  )
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  return queryOne<Organization>(
    'SELECT * FROM nexik_organizations WHERE slug = $1 AND deleted_at IS NULL',
    [slug]
  )
}

export async function getOrganizationByDomain(domain: string): Promise<Organization | null> {
  return queryOne<Organization>(
    'SELECT * FROM nexik_organizations WHERE domain = $1 AND deleted_at IS NULL',
    [domain]
  )
}

export async function updateOrganization(
  id: string,
  data: Partial<Pick<Organization, 'name' | 'domain' | 'logo_url' | 'settings' | 'ai_config'>>
): Promise<Organization | null> {
  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = []
  let idx = 1

  if (data.name !== undefined) {
    sets.push(`name = $${idx++}`)
    params.push(data.name)
  }
  if (data.domain !== undefined) {
    sets.push(`domain = $${idx++}`)
    params.push(data.domain)
  }
  if (data.logo_url !== undefined) {
    sets.push(`logo_url = $${idx++}`)
    params.push(data.logo_url)
  }
  if (data.settings !== undefined) {
    sets.push(`settings = $${idx++}`)
    params.push(JSON.stringify(data.settings))
  }
  if (data.ai_config !== undefined) {
    sets.push(`ai_config = $${idx++}`)
    params.push(JSON.stringify(data.ai_config))
  }

  params.push(id)

  const result = await query<Organization>(
    `UPDATE nexik_organizations SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  )
  return result[0] || null
}

export async function incrementMessagesUsed(orgId: string, count = 1): Promise<void> {
  await execute(
    'UPDATE nexik_organizations SET messages_used = messages_used + $1 WHERE id = $2',
    [count, orgId]
  )
}

export async function checkMessageLimit(orgId: string): Promise<{ allowed: boolean; remaining: number }> {
  const org = await getOrganization(orgId)
  if (!org) return { allowed: false, remaining: 0 }
  
  // Enterprise = unlimited
  if (org.messages_limit === -1) return { allowed: true, remaining: -1 }
  
  const remaining = org.messages_limit - org.messages_used
  return { allowed: remaining > 0, remaining }
}

// Members
export async function getOrgMember(orgId: string, email: string): Promise<OrgMember | null> {
  return queryOne<OrgMember>(
    'SELECT * FROM nexik_org_members WHERE org_id = $1 AND email = $2',
    [orgId, email]
  )
}

export async function getOrgMemberById(id: string): Promise<OrgMember | null> {
  return queryOne<OrgMember>(
    'SELECT * FROM nexik_org_members WHERE id = $1',
    [id]
  )
}

export async function getOrgMembers(orgId: string): Promise<OrgMember[]> {
  return query<OrgMember>(
    'SELECT * FROM nexik_org_members WHERE org_id = $1 ORDER BY role, created_at',
    [orgId]
  )
}

export async function createOrgMember(data: {
  org_id: string
  email: string
  password_hash: string
  name?: string
  role?: 'admin' | 'operator' | 'member'
}): Promise<OrgMember> {
  const result = await query<OrgMember>(
    `INSERT INTO nexik_org_members (org_id, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.org_id, data.email, data.password_hash, data.name || null, data.role || 'member']
  )
  return result[0]
}

export async function updateMemberLastLogin(memberId: string): Promise<void> {
  await execute(
    'UPDATE nexik_org_members SET last_login_at = NOW() WHERE id = $1',
    [memberId]
  )
}

// API Keys
export async function createAPIKey(
  orgId: string,
  name: string,
  options?: {
    permissions?: string[]
    rate_limit?: number
    expires_at?: Date
  }
): Promise<{ key: string; keyData: APIKey }> {
  // Generate secure key: nxk_live_<32 random bytes hex>
  const keyBytes = randomBytes(32)
  const key = `nxk_live_${keyBytes.toString('hex')}`
  const keyPrefix = key.substring(0, 15)
  const keyHash = createHash('sha256').update(key).digest('hex')

  const result = await query<APIKey>(
    `INSERT INTO nexik_api_keys (org_id, name, key_hash, key_prefix, permissions, rate_limit, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      orgId,
      name,
      keyHash,
      keyPrefix,
      JSON.stringify(options?.permissions || ['widget']),
      options?.rate_limit || 100,
      options?.expires_at || null
    ]
  )

  return { key, keyData: result[0] }
}

export async function validateAPIKey(key: string): Promise<{ valid: boolean; org?: Organization; apiKey?: APIKey }> {
  const keyHash = createHash('sha256').update(key).digest('hex')
  
  const apiKey = await queryOne<APIKey>(
    `SELECT * FROM nexik_api_keys WHERE key_hash = $1 AND revoked_at IS NULL`,
    [keyHash]
  )

  if (!apiKey) return { valid: false }
  
  // Check expiration
  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false }
  }

  const org = await getOrganization(apiKey.org_id)
  if (!org) return { valid: false }

  // Update usage
  await execute(
    'UPDATE nexik_api_keys SET last_used_at = NOW(), request_count = request_count + 1 WHERE id = $1',
    [apiKey.id]
  )

  return { valid: true, org, apiKey }
}

export async function getOrgAPIKeys(orgId: string): Promise<APIKey[]> {
  return query<APIKey>(
    'SELECT * FROM nexik_api_keys WHERE org_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC',
    [orgId]
  )
}

export async function revokeAPIKey(keyId: string): Promise<void> {
  await execute(
    'UPDATE nexik_api_keys SET revoked_at = NOW() WHERE id = $1',
    [keyId]
  )
}

// Helpers
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) + '-' + randomBytes(4).toString('hex')
}
