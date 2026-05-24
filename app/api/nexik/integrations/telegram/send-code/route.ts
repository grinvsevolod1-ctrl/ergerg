import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone } = await request.json()
  if (!phone) {
    return NextResponse.json({ error: 'Phone required' }, { status: 400 })
  }

  try {
    const response = await fetch('http://localhost:8005/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Telegram service unavailable' }, { status: 503 })
  }
}
