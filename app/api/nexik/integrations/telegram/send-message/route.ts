import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chat_id, text } = await request.json()
  if (!chat_id || !text) {
    return NextResponse.json({ error: 'chat_id and text required' }, { status: 400 })
  }

  // Получаем сессию Telegram для организации
  const integrations = await query<{ access_token: string }>(
    'SELECT access_token FROM nexik_integrations WHERE org_id = $1 AND platform = $2 AND is_active = true',
    [session.member.org_id, 'telegram']
  )

  if (integrations.length === 0) {
    return NextResponse.json({ error: 'Telegram not connected' }, { status: 400 })
  }

  try {
    const response = await fetch('http://localhost:8005/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_string: integrations[0].access_token,
        chat_id,
        text
      })
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Telegram service unavailable' }, { status: 503 })
  }
}
