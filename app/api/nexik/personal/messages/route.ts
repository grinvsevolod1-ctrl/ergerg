import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

// GET /api/nexik/personal/messages - Get conversation history
export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const messages = await query<{
      id: string
      role: 'user' | 'assistant'
      content: string
      created_at: Date
    }>(
      `SELECT id, role, content, created_at 
       FROM nexik_personal_messages 
       WHERE org_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [session.org.id, limit, offset]
    )

    // Reverse to get chronological order
    const orderedMessages = messages.reverse()

    return NextResponse.json({
      messages: orderedMessages
    })

  } catch (error) {
    console.error('[Personal Messages API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
