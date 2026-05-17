/**
 * Chat sessions and messages management
 * Shared between website and Telegram bot
 */

import { query, queryOne, execute } from './index'

// Types
export interface ChatSession {
  id: string
  user_type: 'website' | 'telegram'
  telegram_chat_id?: number
  telegram_username?: string
  telegram_name?: string
  operator_connected: boolean
  operator_connected_at?: Date
  created_at: Date
  last_activity: Date
  metadata: Record<string, unknown>
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'bot' | 'operator'
  message: string
  delivered: boolean
  created_at: Date
}

// Session management
export async function createSession(
  sessionId: string,
  userType: 'website' | 'telegram',
  telegramData?: {
    chatId?: number
    username?: string
    name?: string
  }
): Promise<ChatSession> {
  const existing = await getSession(sessionId)
  if (existing) return existing

  await execute(
    `INSERT INTO chat_sessions (id, user_type, telegram_chat_id, telegram_username, telegram_name)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET last_activity = NOW()`,
    [
      sessionId,
      userType,
      telegramData?.chatId || null,
      telegramData?.username || null,
      telegramData?.name || null,
    ]
  )

  return (await getSession(sessionId))!
}

export async function getSession(sessionId: string): Promise<ChatSession | null> {
  return queryOne<ChatSession>(
    'SELECT * FROM chat_sessions WHERE id = $1',
    [sessionId]
  )
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await execute(
    'UPDATE chat_sessions SET last_activity = NOW() WHERE id = $1',
    [sessionId]
  )
}

export async function connectOperator(sessionId: string): Promise<void> {
  await execute(
    `UPDATE chat_sessions 
     SET operator_connected = true, operator_connected_at = NOW(), last_activity = NOW()
     WHERE id = $1`,
    [sessionId]
  )
}

export async function disconnectOperator(sessionId: string): Promise<void> {
  await execute(
    `UPDATE chat_sessions 
     SET operator_connected = false, last_activity = NOW()
     WHERE id = $1`,
    [sessionId]
  )
}

export async function isOperatorConnected(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId)
  return session?.operator_connected || false
}

export async function getActiveOperatorSessions(): Promise<ChatSession[]> {
  return query<ChatSession>(
    `SELECT * FROM chat_sessions 
     WHERE operator_connected = true 
     ORDER BY last_activity DESC`
  )
}

// Message management
export async function addMessage(
  sessionId: string,
  senderType: 'user' | 'bot' | 'operator',
  message: string
): Promise<ChatMessage> {
  const result = await query<ChatMessage>(
    `INSERT INTO chat_messages (session_id, sender_type, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [sessionId, senderType, message]
  )

  // Update session activity
  await updateSessionActivity(sessionId)

  return result[0]
}

export async function getUndeliveredMessages(
  sessionId: string,
  senderType?: 'user' | 'bot' | 'operator'
): Promise<ChatMessage[]> {
  let sql = `SELECT * FROM chat_messages 
             WHERE session_id = $1 AND delivered = false`
  const params: unknown[] = [sessionId]

  if (senderType) {
    sql += ` AND sender_type = $2`
    params.push(senderType)
  }

  sql += ` ORDER BY created_at ASC`

  return query<ChatMessage>(sql, params)
}

export async function markMessagesDelivered(messageIds: string[]): Promise<void> {
  if (messageIds.length === 0) return

  await execute(
    `UPDATE chat_messages SET delivered = true WHERE id = ANY($1::uuid[])`,
    [messageIds]
  )
}

export async function getSessionMessages(
  sessionId: string,
  limit = 50
): Promise<ChatMessage[]> {
  return query<ChatMessage>(
    `SELECT * FROM chat_messages 
     WHERE session_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [sessionId, limit]
  )
}

// Cleanup old sessions
export async function cleanupOldSessions(hoursOld = 24): Promise<number> {
  const result = await execute(
    `DELETE FROM chat_sessions 
     WHERE last_activity < NOW() - INTERVAL '${hoursOld} hours'
     AND operator_connected = false`
  )
  return result
}

// Get all sessions with pagination and filters
export interface SessionFilters {
  userType?: 'website' | 'telegram' | 'all'
  operatorConnected?: boolean
  search?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface SessionWithStats extends ChatSession {
  message_count: number
  last_message?: string
  unread_count: number
}

export async function getAllSessions(
  page = 1,
  limit = 20,
  filters: SessionFilters = {}
): Promise<{ sessions: SessionWithStats[]; total: number }> {
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (filters.userType && filters.userType !== 'all') {
    conditions.push(`cs.user_type = $${paramIndex}`)
    params.push(filters.userType)
    paramIndex++
  }

  if (filters.operatorConnected !== undefined) {
    conditions.push(`cs.operator_connected = $${paramIndex}`)
    params.push(filters.operatorConnected)
    paramIndex++
  }

  if (filters.search) {
    conditions.push(`(cs.telegram_username ILIKE $${paramIndex} OR cs.telegram_name ILIKE $${paramIndex} OR cs.id ILIKE $${paramIndex})`)
    params.push(`%${filters.search}%`)
    paramIndex++
  }

  if (filters.dateFrom) {
    conditions.push(`cs.created_at >= $${paramIndex}`)
    params.push(filters.dateFrom)
    paramIndex++
  }

  if (filters.dateTo) {
    conditions.push(`cs.created_at <= $${paramIndex}`)
    params.push(filters.dateTo)
    paramIndex++
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM chat_sessions cs ${whereClause}`,
    params
  )
  const total = parseInt(countResult[0]?.count || '0', 10)

  // Get sessions with stats
  const sessions = await query<SessionWithStats>(
    `SELECT 
      cs.*,
      COALESCE(msg_stats.message_count, 0)::integer as message_count,
      msg_stats.last_message,
      COALESCE(unread_stats.unread_count, 0)::integer as unread_count
    FROM chat_sessions cs
    LEFT JOIN LATERAL (
      SELECT 
        COUNT(*) as message_count,
        (SELECT message FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) as last_message
      FROM chat_messages 
      WHERE session_id = cs.id
    ) msg_stats ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) as unread_count
      FROM chat_messages 
      WHERE session_id = cs.id AND delivered = false AND sender_type = 'user'
    ) unread_stats ON true
    ${whereClause}
    ORDER BY cs.last_activity DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  )

  return { sessions, total }
}

// Get chat statistics
export interface ChatStats {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  avgResponseTime: number
  todaySessions: number
  operatorConnectedSessions: number
}

export async function getChatStats(): Promise<ChatStats> {
  const result = await query<{
    total_sessions: string
    active_sessions: string
    total_messages: string
    today_sessions: string
    operator_connected: string
  }>(`
    SELECT 
      (SELECT COUNT(*) FROM chat_sessions) as total_sessions,
      (SELECT COUNT(*) FROM chat_sessions WHERE last_activity > NOW() - INTERVAL '1 hour') as active_sessions,
      (SELECT COUNT(*) FROM chat_messages) as total_messages,
      (SELECT COUNT(*) FROM chat_sessions WHERE created_at > NOW() - INTERVAL '1 day') as today_sessions,
      (SELECT COUNT(*) FROM chat_sessions WHERE operator_connected = true) as operator_connected
  `)

  const row = result[0]
  return {
    totalSessions: parseInt(row?.total_sessions || '0', 10),
    activeSessions: parseInt(row?.active_sessions || '0', 10),
    totalMessages: parseInt(row?.total_messages || '0', 10),
    avgResponseTime: 0, // Would need more complex calculation
    todaySessions: parseInt(row?.today_sessions || '0', 10),
    operatorConnectedSessions: parseInt(row?.operator_connected || '0', 10),
  }
}

// Get full chat history (for admin view)
export async function getFullChatHistory(
  sessionId: string
): Promise<ChatMessage[]> {
  return query<ChatMessage>(
    `SELECT * FROM chat_messages 
     WHERE session_id = $1 
     ORDER BY created_at ASC`,
    [sessionId]
  )
}

// Link chat session to lead
export async function linkSessionToLead(sessionId: string, leadId: string): Promise<void> {
  await execute(
    `UPDATE chat_sessions SET metadata = metadata || $1 WHERE id = $2`,
    [JSON.stringify({ lead_id: leadId }), sessionId]
  )
}
