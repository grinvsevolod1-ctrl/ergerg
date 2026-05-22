/**
 * Nexik Dashboard Conversation Messages API
 * Get messages, send operator message
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { 
  getConversation, 
  getConversationMessages, 
  addMessage,
  markMessagesRead 
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

    if (conversation.org_id !== session.org.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200)
    const beforeStr = searchParams.get('before')
    const before = beforeStr ? new Date(beforeStr) : undefined

    const messages = await getConversationMessages(id, limit, before)

    // Mark visitor messages as read
    await markMessagesRead(id, 'visitor')

    return NextResponse.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg.id,
        senderType: msg.sender_type,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        content: msg.content,
        contentType: msg.content_type,
        attachments: msg.attachments,
        aiModel: msg.ai_model,
        aiTokensUsed: msg.ai_tokens_used,
        aiResponseTimeMs: msg.ai_response_time_ms,
        ragContextUsed: msg.rag_context_used,
        quickReplies: msg.quick_replies,
        deliveredAt: msg.delivered_at,
        readAt: msg.read_at,
        createdAt: msg.created_at,
      }))
    })

  } catch (error) {
    console.error('[Messages API] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}

export async function POST(
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
    
    if (!body.content || typeof body.content !== 'string') {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
    }

    const message = await addMessage({
      conversation_id: id,
      org_id: session.org.id,
      sender_type: 'operator',
      sender_id: session.member.id,
      sender_name: session.member.name || session.member.email.split('@')[0],
      content: body.content.trim(),
      content_type: body.contentType || 'text',
      attachments: body.attachments,
      quick_replies: body.quickReplies,
    })

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderType: message.sender_type,
        senderId: message.sender_id,
        senderName: message.sender_name,
        content: message.content,
        contentType: message.content_type,
        createdAt: message.created_at,
      }
    })

  } catch (error) {
    console.error('[Messages API] POST Error:', error)
    return NextResponse.json({ error: 'Ошибка отправки' }, { status: 500 })
  }
}
