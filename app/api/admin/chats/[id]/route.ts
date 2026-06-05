import { NextRequest, NextResponse } from 'next/server'
import { 
  getSession, 
  getFullChatHistory, 
  addMessage,
  connectOperator,
  disconnectOperator,
  linkSessionToLead
} from '@/lib/db/chat'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'

// GET /api/admin/chats/[id] - Get chat session with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    
    const session = await getSession(id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const messages = await getFullChatHistory(id)

    return NextResponse.json({
      session,
      messages,
    })
  } catch (error) {
    console.error('Error fetching chat:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat' },
      { status: 500 }
    )
  }
}

// POST /api/admin/chats/[id] - Send message as operator
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { message, action } = body

    const session = await getSession(id)
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Handle actions
    if (action === 'connect') {
      await connectOperator(id)
      return NextResponse.json({ success: true, action: 'connected' })
    }

    if (action === 'disconnect') {
      await disconnectOperator(id)
      return NextResponse.json({ success: true, action: 'disconnected' })
    }

    if (action === 'link_lead' && body.leadId) {
      await linkSessionToLead(id, body.leadId)
      return NextResponse.json({ success: true, action: 'linked' })
    }

    // Send message
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Add message to database
    const newMessage = await addMessage(id, 'operator', message.trim())

    // If this is a Telegram chat, send via Telegram
    if (session.user_type === 'telegram' && session.telegram_chat_id) {
      try {
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN
        if (telegramToken) {
          await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: session.telegram_chat_id,
              text: message.trim(),
              parse_mode: 'HTML',
            }),
          })
        }
      } catch (telegramError) {
        console.error('Failed to send Telegram message:', telegramError)
        // Don't fail the request, message is still saved
      }
    }

    // Auto-connect operator when sending first message
    if (!session.operator_connected) {
      await connectOperator(id)
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
