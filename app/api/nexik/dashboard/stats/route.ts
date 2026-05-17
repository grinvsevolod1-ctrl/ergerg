/**
 * Nexik Dashboard Stats API
 */

import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('org_id')
    
    if (!orgId) {
      // Return demo data if no org_id
      return NextResponse.json({
        success: true,
        stats: {
          totalConversations: 127,
          todayConversations: 12,
          totalMessages: 1543,
          leadsCollected: 34,
          appointmentsBooked: 8,
          avgResponseTime: "2s",
          aiWorkingHours: 168,
        },
        recentChats: [
          { id: "1", visitor: "Посетитель из Минска", lastMessage: "Сколько стоит услуга?", time: "2 мин назад", status: "ai" },
          { id: "2", visitor: "Анна К.", lastMessage: "Хочу записаться на завтра", time: "15 мин назад", status: "resolved" },
        ]
      })
    }

    // Get real stats
    const [conversations, messages, todayConversations] = await Promise.all([
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
       ORDER BY c.created_at DESC
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

    return NextResponse.json({
      success: true,
      stats: {
        totalConversations: parseInt(conversations[0]?.count || '0'),
        todayConversations: parseInt(todayConversations[0]?.count || '0'),
        totalMessages: parseInt(messages[0]?.count || '0'),
        leadsCollected: 0, // Placeholder - requires leads table implementation
        appointmentsBooked: 0, // Placeholder - requires appointments table implementation
        avgResponseTime,
        aiWorkingHours: 168, // AI works 24/7
      },
      recentChats: recentChats.map(chat => ({
        id: chat.id,
        visitor: chat.visitor_name || chat.visitor_email || 'Посетитель',
        lastMessage: chat.last_message || 'Нет сообщений',
        time: formatTimeAgo(chat.created_at),
        status: chat.status === 'active' ? 'ai' : chat.status === 'resolved' ? 'resolved' : 'waiting'
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
