import { query, queryOne, execute } from './index'
import type { Lead } from '../site-analyzer/types'

interface CreateLeadData {
  companyName: string
  phone: string
  email: string
  description?: string
  niche?: string
  selectedVariantUrl?: string
  variantsViewed?: number
  timeSpentSeconds?: number
  deviceType?: string
  source?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  ipAddress?: string
  userAgent?: string
  country?: string
  city?: string
}

export async function createLead(data: CreateLeadData): Promise<Lead> {
  const result = await query<Lead>(
    `INSERT INTO leads (
      company_name, phone, email, description, niche,
      selected_variant_url, variants_viewed, time_spent_seconds,
      device_type, source, utm_source, utm_medium, utm_campaign,
      ip_address, user_agent, country, city
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::inet, $15, $16, $17)
    RETURNING *`,
    [
      data.companyName,
      data.phone,
      data.email,
      data.description || null,
      data.niche || null,
      data.selectedVariantUrl || null,
      data.variantsViewed || 1,
      data.timeSpentSeconds || null,
      data.deviceType || null,
      data.source || 'generator',
      data.utmSource || null,
      data.utmMedium || null,
      data.utmCampaign || null,
      data.ipAddress || null,
      data.userAgent || null,
      data.country || null,
      data.city || null,
    ]
  )
  return result[0]
}

export async function getLeadById(id: string): Promise<Lead | null> {
  return queryOne<Lead>('SELECT * FROM leads WHERE id = $1', [id])
}

export async function getLeadByEmail(email: string): Promise<Lead | null> {
  return queryOne<Lead>('SELECT * FROM leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1', [email])
}

export async function updateLead(id: string, data: Partial<CreateLeadData>): Promise<Lead | null> {
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.companyName !== undefined) {
    updates.push(`company_name = $${paramIndex++}`)
    values.push(data.companyName)
  }
  if (data.phone !== undefined) {
    updates.push(`phone = $${paramIndex++}`)
    values.push(data.phone)
  }
  if (data.selectedVariantUrl !== undefined) {
    updates.push(`selected_variant_url = $${paramIndex++}`)
    values.push(data.selectedVariantUrl)
  }
  if (data.variantsViewed !== undefined) {
    updates.push(`variants_viewed = $${paramIndex++}`)
    values.push(data.variantsViewed)
  }
  if (data.timeSpentSeconds !== undefined) {
    updates.push(`time_spent_seconds = $${paramIndex++}`)
    values.push(data.timeSpentSeconds)
  }

  updates.push(`updated_at = NOW()`)
  values.push(id)

  const result = await query<Lead>(
    `UPDATE leads SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result[0] || null
}

export async function updateLeadStatus(id: string, status: Lead['status']): Promise<void> {
  await execute('UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2', [status, id])
}

export async function requestDataDeletion(email: string): Promise<boolean> {
  const rowCount = await execute(
    'UPDATE leads SET data_deletion_requested_at = NOW() WHERE email = $1',
    [email]
  )
  return rowCount > 0
}

export async function deleteLeadData(id: string): Promise<boolean> {
  const rowCount = await execute(
    `UPDATE leads SET 
      company_name = '[DELETED]',
      phone = '[DELETED]',
      email = '[DELETED]',
      description = NULL,
      ip_address = NULL,
      user_agent = NULL
    WHERE id = $1`,
    [id]
  )
  return rowCount > 0
}

export async function getRecentLeads(limit: number = 50): Promise<Lead[]> {
  return query<Lead>(
    'SELECT * FROM leads ORDER BY created_at DESC LIMIT $1',
    [limit]
  )
}

// Admin functions
export interface LeadFilters {
  status?: Lead['status']
  source?: string
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface LeadStats {
  total: number
  new: number
  inProgress: number
  completed: number
  rejected: number
  todayCount: number
  weekCount: number
}

export async function getAllLeads(
  page = 1,
  limit = 20,
  filters: LeadFilters = {}
): Promise<{ leads: Lead[]; total: number }> {
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (filters.status) {
    conditions.push(`status = $${paramIndex}`)
    params.push(filters.status)
    paramIndex++
  }

  if (filters.source) {
    conditions.push(`source = $${paramIndex}`)
    params.push(filters.source)
    paramIndex++
  }

  if (filters.search) {
    conditions.push(`(company_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR phone ILIKE $${paramIndex} OR niche ILIKE $${paramIndex})`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }

  if (filters.dateFrom) {
    conditions.push(`created_at >= $${paramIndex}`)
    params.push(filters.dateFrom)
    paramIndex++
  }

  if (filters.dateTo) {
    conditions.push(`created_at <= $${paramIndex}`)
    params.push(filters.dateTo)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM leads ${whereClause}`,
    params
  )
  const total = parseInt(countResult[0]?.count || '0', 10)

  // Get leads
  const leads = await query<Lead>(
    `SELECT * FROM leads ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  return { leads, total }
}

export async function getLeadStats(): Promise<LeadStats> {
  const result = await query<{
    total: string
    new_count: string
    in_progress: string
    completed: string
    rejected: string
    today_count: string
    week_count: string
  }>(`
    SELECT 
      (SELECT COUNT(*) FROM leads) as total,
      (SELECT COUNT(*) FROM leads WHERE status = 'new') as new_count,
      (SELECT COUNT(*) FROM leads WHERE status = 'in_progress') as in_progress,
      (SELECT COUNT(*) FROM leads WHERE status = 'completed') as completed,
      (SELECT COUNT(*) FROM leads WHERE status = 'rejected') as rejected,
      (SELECT COUNT(*) FROM leads WHERE created_at > NOW() - INTERVAL '1 day') as today_count,
      (SELECT COUNT(*) FROM leads WHERE created_at > NOW() - INTERVAL '7 days') as week_count
  `)

  const row = result[0]
  return {
    total: parseInt(row?.total || '0', 10),
    new: parseInt(row?.new_count || '0', 10),
    inProgress: parseInt(row?.in_progress || '0', 10),
    completed: parseInt(row?.completed || '0', 10),
    rejected: parseInt(row?.rejected || '0', 10),
    todayCount: parseInt(row?.today_count || '0', 10),
    weekCount: parseInt(row?.week_count || '0', 10),
  }
}

export async function getLeadWithChatSession(leadId: string): Promise<Lead & { chat_session_id?: string } | null> {
  const result = await query<Lead & { chat_session_id?: string }>(
    `SELECT l.*, cs.id as chat_session_id
     FROM leads l
     LEFT JOIN chat_sessions cs ON cs.metadata->>'lead_id' = l.id::text
     WHERE l.id = $1`,
    [leadId]
  )
  return result[0] || null
}
