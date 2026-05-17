/**
 * Nexik Dashboard Single Conversation API
 * Get conversation details, update status, assign operator
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { 
  getConversation, 
  updateConversationStatus, 
  assignOperator,
  updateVisitorInfo,
  addConversationTags
} from '@/lib/nexik/db/conversations'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params
    const conversation = await getConversation(id)

    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 })
    }

    // Check org access
    if (conversation.org_id !== session.org.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation.id,
        visitorId: conversation.visitor_id,
        visitorName: conversation.visitor_name,
        visitorEmail: conversation.visitor_email,
        visitorPhone: conversation.visitor_phone,
        visitorMetadata: conversation.visitor_metadata,
        status: conversation.status,
        assignedOperatorId: conversation.assigned_operator_id,
        pageUrl: conversation.page_url,
        pageTitle: conversation.page_title,
        referrer: conversation.referrer,
        utmSource: conversation.utm_source,
        utmMedium: conversation.utm_medium,
        utmCampaign: conversation.utm_campaign,
        country: conversation.country,
        city: conversation.city,
        deviceType: conversation.device_type,
        browser: conversation.browser,
        os: conversation.os,
        tags: conversation.tags,
        rating: conversation.rating,
        feedback: conversation.feedback,
        createdAt: conversation.created_at,
        firstMessageAt: conversation.first_message_at,
        lastMessageAt: conversation.last_message_at,
        resolvedAt: conversation.resolved_at,
      }
    })

  } catch (error) {
    console.error('[Conversation API] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params
    const conversation = await getConversation(id)

    if (!conversation) {
      return NextResponse.json({ error: 'Диалог не найден' }, { status: 404 })
    }

    if (conversation.org_id !== session.org.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const body = await req.json()

    // Update status
    if (body.status && ['active', 'pending', 'resolved', 'archived'].includes(body.status)) {
      await updateConversationStatus(id, body.status)
    }

    // Assign operator
    if (body.assignedOperatorId !== undefined) {
      await assignOperator(id, body.assignedOperatorId)
    }

    // Update visitor info
    if (body.visitorName !== undefined || body.visitorEmail !== undefined || body.visitorPhone !== undefined) {
      await updateVisitorInfo(id, {
        name: body.visitorName,
        email: body.visitorEmail,
        phone: body.visitorPhone
      })
    }

    // Add tags
    if (body.addTags && Array.isArray(body.addTags)) {
      await addConversationTags(id, body.addTags)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Conversation API] PATCH Error:', error)
    return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
  }
}
