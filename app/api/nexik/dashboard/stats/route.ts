/**
 * Nexik Dashboard Stats API
 * Uses session authentication instead of query params
 */

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getSession } from '@/lib/nexik/services/auth'

export async function GET() {
  try {
    // Get session - requires authentication
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        error: 'Не авторизован' 
      }, { status: 401 })
    }

    const orgId = session.org.id

    // Get real stats in parallel
    const [conversations, messages, todayConversations, leadsCount] = await Promise.all([
      // Total conversations
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM nexik_conversations WHERE org_id = $1`,
        [orgId]
      ),
      // Total messages
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM nexik_messages WHERE org_id = $1`,
        [orgId]
      ),
      // Today's conversations
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM nexik_conversations 
         WHERE org_id = $1 AND created_at >= CURRENT_DATE`,
        [orgId]
      ),
      // Leads collected (conversations with visitor_email or visitor_phone)
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM nexik_conversations 
         WHERE org_id = $1 
         AND (visitor_email IS NOT NULL OR visitor_phone IS NOT NULL)`,
        [orgId]
      ),
    ])

    // Get recent chats
    const recentChats = await query<{
      id: string
      visitor_name: string | null
      visitor_email: string | null
      status: string
      created_at: Date
      last_message: string | null
    }>(
      `SELECT 
        c.id,
        c.visitor_name,
        c.visitor_email,
        c.status,
        c.created_at,
        (
          SELECT content FROM nexik_messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC LIMIT 1
        ) as last_message
       FROM nexik_conversations c
       WHERE c.org_id = $1
       ORDER BY c.updated_at DESC
       LIMIT 10`,
      [orgId]
    )

    // Calculate avg response time
    const avgResponse = await query<{ avg_ms: number | null }>(
      `SELECT AVG(ai_response_time_ms) as avg_ms 
       FROM nexik_messages 
       WHERE org_id = $1 AND ai_response_time_ms IS NOT NULL`,
      [orgId]
    )

    const avgMs = avgResponse[0]?.avg_ms || 2000
    const avgResponseTime = avgMs < 1000 
      ? `${Math.round(avgMs)}ms` 
      : `${(avgMs / 1000).toFixed(1)}s`

    // Format time ago
    const formatTimeAgo = (date: Date) => {
      const now = new Date()
      const diffMs = now.getTime() - new Date(date).getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'только что'
      if (diffMins < 60) return `${diffMins} мин назад`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч назад`
      return `${Math.floor(diffMins / 1440)} дн назад`
    }

    // Map status to UI status
    const mapStatus = (status: string): 'ai' | 'waiting' | 'resolved' => {
      switch (status) {
        case 'active':
        case 'ai_handling':
          return 'ai'
        case 'waiting_operator':
        case 'operator_handling':
          return 'waiting'
        case 'resolved':
        case 'closed':
          return 'resolved'
        default:
          return 'ai'
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalConversations: parseInt(conversations[0]?.count || '0'),
        todayConversations: parseInt(todayConversations[0]?.count || '0'),
        totalMessages: parseInt(messages[0]?.count || '0'),
        leadsCollected: parseInt(leadsCount[0]?.count || '0'),
        appointmentsBooked: 0, // Placeholder - requires appointments feature
        avgResponseTime,
        aiWorkingHours: 168, // AI works 24/7 = 168 hours per week
      },
      recentChats: recentChats.map(chat => ({
        id: chat.id,
        visitor: chat.visitor_name || chat.visitor_email?.split('@')[0] || 'Посетитель',
        lastMessage: chat.last_message || 'Нет сообщений',
        time: formatTimeAgo(chat.created_at),
        status: mapStatus(chat.status)
      }))
    })

  } catch (error) {
    console.error('[Dashboard Stats] Error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Ошибка загрузки статистики' 
    }, { status: 500 })
  }
}
