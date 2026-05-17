/**
 * Nexik Conversations & Messages Management
 */

import { query, queryOne, execute } from '@/lib/db'
import type { QuickReply } from './widgets'

export interface VisitorMetadata {
  [key: string]: unknown
}

export interface Conversation {
  id: string
  org_id: string
  widget_id: string | null
  visitor_id: string
  visitor_name: string | null
  visitor_email: string | null
  visitor_phone: string | null
  visitor_metadata: VisitorMetadata
  page_url: string | null
  page_title: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  ip_address: string | null
  user_agent: string | null
  device_type: string | null
  browser: string | null
  os: string | null
  country: string | null
  city: string | null
  status: 'active' | 'pending' | 'resolved' | 'archived'
  assigned_operator_id: string | null
  first_message_at: Date | null
  last_message_at: Date | null
  resolved_at: Date | null
  rating: number | null
  feedback: string | null
  tags: string[]
  created_at: Date
  updated_at: Date
}

export interface ConversationWithStats extends Conversation {
  messages_count: number
  unread_count: number
  last_message: string | null
  operator_name: string | null
}

export interface Message {
  id: string
  conversation_id: string
  org_id: string
  sender_type: 'visitor' | 'ai' | 'operator' | 'system'
  sender_id: string | null
  sender_name: string | null
  content: string
  content_type: 'text' | 'image' | 'file' | 'card'
  attachments: Attachment[]
  ai_model: string | null
  ai_tokens_used: number | null
  ai_response_time_ms: number | null
  rag_context_used: boolean
  quick_replies: QuickReply[]
  delivered_at: Date | null
  read_at: Date | null
  created_at: Date
}

export interface Attachment {
  type: 'image' | 'file'
  url: string
  name: string
  size?: number
}

// QuickReply is defined in widgets.ts

// Conversation CRUD
export async function createConversation(data: {
  org_id: string
  widget_id?: string
  visitor_id: string
  visitor_name?: string
  visitor_email?: string
  visitor_phone?: string
  visitor_metadata?: VisitorMetadata
  page_url?: string
  page_title?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  ip_address?: string
  user_agent?: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
}): Promise<Conversation> {
  const result = await query<Conversation>(
    `INSERT INTO nexik_conversations (
      org_id, widget_id, visitor_id, visitor_name, visitor_email, visitor_phone,
      visitor_metadata, page_url, page_title, referrer,
      utm_source, utm_medium, utm_campaign,
      ip_address, user_agent, device_type, browser, os, country, city
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    RETURNING *`,
    [
      data.org_id,
      data.widget_id || null,
      data.visitor_id,
      data.visitor_name || null,
      data.visitor_email || null,
      data.visitor_phone || null,
      JSON.stringify(data.visitor_metadata || {}),
      data.page_url || null,
      data.page_title || null,
      data.referrer || null,
      data.utm_source || null,
      data.utm_medium || null,
      data.utm_campaign || null,
      data.ip_address || null,
      data.user_agent || null,
      data.device_type || null,
      data.browser || null,
      data.os || null,
      data.country || null,
      data.city || null
    ]
  )
  return result[0]
}

export async function getConversation(id: string): Promise<Conversation | null> {
  return queryOne<Conversation>(
    'SELECT * FROM nexik_conversations WHERE id = $1',
    [id]
  )
}

export async function getConversationByVisitor(
  orgId: string,
  visitorId: string,
  activeOnly = true
): Promise<Conversation | null> {
  const statusCondition = activeOnly ? "AND status = 'active'" : ''
  return queryOne<Conversation>(
    `SELECT * FROM nexik_conversations 
     WHERE org_id = $1 AND visitor_id = $2 ${statusCondition}
     ORDER BY created_at DESC LIMIT 1`,
    [orgId, visitorId]
  )
}

export async function getOrCreateConversation(data: {
  org_id: string
  widget_id?: string
  visitor_id: string
  visitor_metadata?: VisitorMetadata
  page_url?: string
}): Promise<{ conversation: Conversation; isNew: boolean }> {
  // Try to find existing active conversation
  const existing = await getConversationByVisitor(data.org_id, data.visitor_id, true)
  if (existing) {
    return { conversation: existing, isNew: false }
  }

  // Create new conversation
  const conversation = await createConversation(data)
  return { conversation, isNew: true }
}

export interface ConversationFilters {
  status?: Conversation['status'] | 'all'
  assigned_operator_id?: string | 'unassigned'
  widget_id?: string
  search?: string
  tags?: string[]
  date_from?: Date
  date_to?: Date
  has_unread?: boolean
}

export async function getOrgConversations(
  orgId: string,
  page = 1,
  limit = 20,
  filters: ConversationFilters = {}
): Promise<{ conversations: ConversationWithStats[]; total: number }> {
  const offset = (page - 1) * limit
  const conditions: string[] = ['c.org_id = $1']
  const params: unknown[] = [orgId]
  let idx = 2

  if (filters.status && filters.status !== 'all') {
    conditions.push(`c.status = $${idx++}`)
    params.push(filters.status)
  }

  if (filters.assigned_operator_id === 'unassigned') {
    conditions.push('c.assigned_operator_id IS NULL')
  } else if (filters.assigned_operator_id) {
    conditions.push(`c.assigned_operator_id = $${idx++}`)
    params.push(filters.assigned_operator_id)
  }

  if (filters.widget_id) {
    conditions.push(`c.widget_id = $${idx++}`)
    params.push(filters.widget_id)
  }

  if (filters.search) {
    conditions.push(`(c.visitor_name ILIKE $${idx} OR c.visitor_email ILIKE $${idx} OR c.visitor_id ILIKE $${idx})`)
    params.push(`%${filters.search}%`)
    idx++
  }

  if (filters.tags && filters.tags.length > 0) {
    conditions.push(`c.tags && $${idx++}`)
    params.push(filters.tags)
  }

  if (filters.date_from) {
    conditions.push(`c.created_at >= $${idx++}`)
    params.push(filters.date_from)
  }

  if (filters.date_to) {
    conditions.push(`c.created_at <= $${idx++}`)
    params.push(filters.date_to)
  }

  const whereClause = conditions.join(' AND ')

  // Count total
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM nexik_conversations c WHERE ${whereClause}`,
    params
  )
  const total = parseInt(countResult[0]?.count || '0', 10)

  // Get conversations with stats
  params.push(limit, offset)
  const conversations = await query<ConversationWithStats>(
    `SELECT 
      c.*,
      COALESCE(msg.messages_count, 0)::integer as messages_count,
      COALESCE(msg.unread_count, 0)::integer as unread_count,
      msg.last_message,
      m.name as operator_name
    FROM nexik_conversations c
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as messages_count,
        COUNT(*) FILTER (WHERE sender_type = 'visitor' AND read_at IS NULL) as unread_count,
        (SELECT content FROM nexik_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM nexik_messages WHERE conversation_id = c.id
    ) msg ON true
    LEFT JOIN nexik_org_members m ON c.assigned_operator_id = m.id
    WHERE ${whereClause}
    ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}`,
    params
  )

  return { conversations, total }
}

export async function updateConversationStatus(
  id: string,
  status: Conversation['status']
): Promise<void> {
  const resolvedAt = status === 'resolved' ? 'NOW()' : 'NULL'
  await execute(
    `UPDATE nexik_conversations 
     SET status = $1, resolved_at = ${resolvedAt}, updated_at = NOW()
     WHERE id = $2`,
    [status, id]
  )
}

export async function assignOperator(
  conversationId: string,
  operatorId: string | null
): Promise<void> {
  await execute(
    `UPDATE nexik_conversations 
     SET assigned_operator_id = $1, updated_at = NOW()
     WHERE id = $2`,
    [operatorId, conversationId]
  )
}

export async function updateVisitorInfo(
  conversationId: string,
  data: {
    name?: string
    email?: string
    phone?: string
    metadata?: VisitorMetadata
  }
): Promise<void> {
  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = []
  let idx = 1

  if (data.name !== undefined) {
    sets.push(`visitor_name = $${idx++}`)
    params.push(data.name)
  }
  if (data.email !== undefined) {
    sets.push(`visitor_email = $${idx++}`)
    params.push(data.email)
  }
  if (data.phone !== undefined) {
    sets.push(`visitor_phone = $${idx++}`)
    params.push(data.phone)
  }
  if (data.metadata !== undefined) {
    sets.push(`visitor_metadata = visitor_metadata || $${idx++}`)
    params.push(JSON.stringify(data.metadata))
  }

  params.push(conversationId)
  await execute(
    `UPDATE nexik_conversations SET ${sets.join(', ')} WHERE id = $${idx}`,
    params
  )
}

export async function addConversationTags(conversationId: string, tags: string[]): Promise<void> {
  await execute(
    `UPDATE nexik_conversations 
     SET tags = array_cat(tags, $1), updated_at = NOW()
     WHERE id = $2`,
    [tags, conversationId]
  )
}

export async function rateConversation(
  conversationId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  await execute(
    `UPDATE nexik_conversations 
     SET rating = $1, feedback = $2, updated_at = NOW()
     WHERE id = $3`,
    [rating, feedback || null, conversationId]
  )
}

// Messages
export async function addMessage(data: {
  conversation_id: string
  org_id: string
  sender_type: Message['sender_type']
  sender_id?: string
  sender_name?: string
  content: string
  content_type?: Message['content_type']
  attachments?: Attachment[]
  ai_model?: string
  ai_tokens_used?: number
  ai_response_time_ms?: number
  rag_context_used?: boolean
  quick_replies?: QuickReply[]
}): Promise<Message> {
  const result = await query<Message>(
    `INSERT INTO nexik_messages (
      conversation_id, org_id, sender_type, sender_id, sender_name,
      content, content_type, attachments, ai_model, ai_tokens_used,
      ai_response_time_ms, rag_context_used, quick_replies
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      data.conversation_id,
      data.org_id,
      data.sender_type,
      data.sender_id || null,
      data.sender_name || null,
      data.content,
      data.content_type || 'text',
      JSON.stringify(data.attachments || []),
      data.ai_model || null,
      data.ai_tokens_used || null,
      data.ai_response_time_ms || null,
      data.rag_context_used || false,
      JSON.stringify(data.quick_replies || [])
    ]
  )

  // Update conversation timestamps
  const isFirstMessage = await queryOne<{ is_first: boolean }>(
    `SELECT first_message_at IS NULL as is_first FROM nexik_conversations WHERE id = $1`,
    [data.conversation_id]
  )

  if (isFirstMessage?.is_first) {
    await execute(
      `UPDATE nexik_conversations 
       SET first_message_at = NOW(), last_message_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [data.conversation_id]
    )
  } else {
    await execute(
      `UPDATE nexik_conversations 
       SET last_message_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [data.conversation_id]
    )
  }

  return result[0]
}

export async function getConversationMessages(
  conversationId: string,
  limit = 100,
  before?: Date
): Promise<Message[]> {
  const conditions = ['conversation_id = $1']
  const params: unknown[] = [conversationId]

  if (before) {
    conditions.push('created_at < $2')
    params.push(before)
  }

  params.push(limit)

  const messages = await query<Message>(
    `SELECT * FROM nexik_messages 
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${params.length}`,
    params
  )

  // Return in chronological order
  return messages.reverse()
}

export async function markMessagesRead(conversationId: string, senderType?: 'visitor'): Promise<void> {
  const condition = senderType ? `AND sender_type = '${senderType}'` : ''
  await execute(
    `UPDATE nexik_messages 
     SET read_at = NOW()
     WHERE conversation_id = $1 AND read_at IS NULL ${condition}`,
    [conversationId]
  )
}

export async function markMessageDelivered(messageId: string): Promise<void> {
  await execute(
    'UPDATE nexik_messages SET delivered_at = NOW() WHERE id = $1',
    [messageId]
  )
}

// Stats
export interface ConversationStats {
  total: number
  active: number
  pending: number
  resolved: number
  today: number
  unread_messages: number
  avg_response_time_ms: number | null
  avg_rating: number | null
}

export async function getOrgConversationStats(orgId: string): Promise<ConversationStats> {
  const result = await query<{
    total: string
    active: string
    pending: string
    resolved: string
    today: string
    unread_messages: string
    avg_rating: string | null
  }>(`
    SELECT
      (SELECT COUNT(*) FROM nexik_conversations WHERE org_id = $1) as total,
      (SELECT COUNT(*) FROM nexik_conversations WHERE org_id = $1 AND status = 'active') as active,
      (SELECT COUNT(*) FROM nexik_conversations WHERE org_id = $1 AND status = 'pending') as pending,
      (SELECT COUNT(*) FROM nexik_conversations WHERE org_id = $1 AND status = 'resolved') as resolved,
      (SELECT COUNT(*) FROM nexik_conversations WHERE org_id = $1 AND created_at >= CURRENT_DATE) as today,
      (SELECT COUNT(*) FROM nexik_messages m 
       JOIN nexik_conversations c ON m.conversation_id = c.id 
       WHERE c.org_id = $1 AND m.sender_type = 'visitor' AND m.read_at IS NULL) as unread_messages,
      (SELECT AVG(rating) FROM nexik_conversations WHERE org_id = $1 AND rating IS NOT NULL) as avg_rating
  `, [orgId])

  const row = result[0]
  return {
    total: parseInt(row?.total || '0', 10),
    active: parseInt(row?.active || '0', 10),
    pending: parseInt(row?.pending || '0', 10),
    resolved: parseInt(row?.resolved || '0', 10),
    today: parseInt(row?.today || '0', 10),
    unread_messages: parseInt(row?.unread_messages || '0', 10),
    avg_response_time_ms: null, // Complex calculation, skip for now
    avg_rating: row?.avg_rating ? parseFloat(row.avg_rating) : null
  }
}
