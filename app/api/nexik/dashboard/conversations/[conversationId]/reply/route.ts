import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { conversationId } = await params
  const orgId = session.member?.org_id || session.org?.id
  const memberId = session.member?.id
  const memberName = session.member?.name || 'Оператор'
  
  const { message } = await request.json()
  
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }
  
  // Verify conversation belongs to org and get visitor info
  const conv = await query<{ 
    id: string
    visitor_id: string 
    status: string
  }>(
    `SELECT id, visitor_id, status FROM nexik_conversations WHERE id = $1 AND org_id = $2`,
    [conversationId, orgId]
  )
  
  if (!conv[0]) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }
  
  const conversation = conv[0]
  const isTelegram = conversation.visitor_id.startsWith('tg_')
  
  // Save message to database
  const msgResult = await query<{ id: string }>(
    `INSERT INTO nexik_messages (
      conversation_id, org_id, sender_type, sender_id, sender_name, content
    ) VALUES ($1, $2, 'operator', $3, $4, $5)
    RETURNING id`,
    [conversationId, orgId, memberId, memberName, message]
  )
  
  // Update conversation
  await execute(
    `UPDATE nexik_conversations 
     SET last_message_at = NOW(), updated_at = NOW(), status = 'active'
     WHERE id = $1`,
    [conversationId]
  )
  
  // If Telegram conversation, send message to Telegram
  if (isTelegram) {
    try {
      // Get telegram chat info
      const tgChat = await query<{
        telegram_chat_id: number
        integration_id: string
      }>(
        `SELECT telegram_chat_id, integration_id FROM nexik_telegram_chats 
         WHERE conversation_id = $1`,
        [conversationId]
      )
      
      if (tgChat[0]) {
        // Get integration session
        const integration = await query<{ access_token: string }>(
          `SELECT access_token FROM nexik_integrations WHERE id = $1`,
          [tgChat[0].integration_id]
        )
        
        if (integration[0]) {
          // Send message via Python service
          const PYTHON_SERVICE_URL = process.env.TELEGRAM_SERVICE_URL || 'http://localhost:8005'
          
          await fetch(`${PYTHON_SERVICE_URL}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_string: integration[0].access_token,
              chat_id: tgChat[0].telegram_chat_id,
              text: message
            })
          })
        }
      }
    } catch (e) {
      console.error('[Reply API] Failed to send to Telegram:', e)
      // Continue anyway, message is saved
    }
  }
  
  return NextResponse.json({
    success: true,
    messageId: msgResult[0].id,
    sentToTelegram: isTelegram
  })
}
