import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { conversationId } = await params
  const orgId = session.member?.org_id || session.org?.id
  
  // Verify conversation belongs to org
  const conv = await query<{ id: string }>(
    `SELECT id FROM nexik_conversations WHERE id = $1 AND org_id = $2`,
    [conversationId, orgId]
  )
  
  if (!conv[0]) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }
  
  // Get messages
  const messages = await query<{
    id: string
    content: string
    sender_type: string
    sender_name: string
    created_at: Date
    sentiment_label: string
  }>(
    `SELECT id, content, sender_type, sender_name, created_at, sentiment_label
     FROM nexik_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC`,
    [conversationId]
  )
  
  return NextResponse.json({
    success: true,
    messages: messages.map(m => ({
      id: m.id,
      content: m.content,
      senderType: m.sender_type,
      senderName: m.sender_name,
      createdAt: m.created_at,
      sentimentLabel: m.sentiment_label
    }))
  })
}
