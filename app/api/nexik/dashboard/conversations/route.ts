/**
 * Nexik Dashboard Conversations API
 * List conversations with filters, pagination
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { getOrgConversations, getOrgConversationStats, type ConversationFilters } from '@/lib/nexik/db/conversations'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const orgId = session.org.id
    const searchParams = req.nextUrl.searchParams
    
    // Parse query params
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    
    const filters: ConversationFilters = {}
    
    const status = searchParams.get('status')
    if (status && ['active', 'pending', 'resolved', 'archived', 'all'].includes(status)) {
      filters.status = status as ConversationFilters['status']
    }
    
    const search = searchParams.get('search')
    if (search) filters.search = search
    
    const assignedTo = searchParams.get('assigned_to')
    if (assignedTo) filters.assigned_operator_id = assignedTo
    
    const widgetId = searchParams.get('widget_id')
    if (widgetId) filters.widget_id = widgetId

    // Get conversations and stats in parallel
    const [conversationsResult, stats] = await Promise.all([
      getOrgConversations(orgId, page, limit, filters),
      getOrgConversationStats(orgId)
    ])

    return NextResponse.json({
      success: true,
      conversations: conversationsResult.conversations.map(conv => ({
        id: conv.id,
        visitorId: conv.visitor_id,
        visitorName: conv.visitor_name,
        visitorEmail: conv.visitor_email,
        visitorPhone: conv.visitor_phone,
        status: conv.status,
        messagesCount: conv.messages_count,
        unreadCount: conv.unread_count,
        lastMessage: conv.last_message,
        operatorName: conv.operator_name,
        assignedOperatorId: conv.assigned_operator_id,
        pageUrl: conv.page_url,
        pageTitle: conv.page_title,
        country: conv.country,
        city: conv.city,
        deviceType: conv.device_type,
        tags: conv.tags,
        rating: conv.rating,
        createdAt: conv.created_at,
        lastMessageAt: conv.last_message_at,
        resolvedAt: conv.resolved_at,
      })),
      pagination: {
        page,
        limit,
        total: conversationsResult.total,
        totalPages: Math.ceil(conversationsResult.total / limit)
      },
      stats: {
        total: stats.total,
        active: stats.active,
        pending: stats.pending,
        resolved: stats.resolved,
        today: stats.today,
        unreadMessages: stats.unread_messages,
        avgRating: stats.avg_rating
      }
    })

  } catch (error) {
    console.error('[Conversations API] Error:', error)
    return NextResponse.json({ 
      error: 'Ошибка загрузки диалогов' 
    }, { status: 500 })
  }
}
