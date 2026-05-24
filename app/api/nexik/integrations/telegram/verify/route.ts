import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone, code, phone_code_hash, password } = await request.json()

  try {
    const response = await fetch('http://localhost:8005/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, phone_code_hash, password })
    })
    const data = await response.json()

    if (data.requires_2fa) {
      return NextResponse.json({ requires_2fa: true, phone, phone_code_hash }, { status: 200 })
    }

    if (data.success && data.session_string) {
      await query(
        `INSERT INTO nexik_integrations (org_id, platform, platform_id, access_token, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (org_id, platform) DO UPDATE 
         SET access_token = EXCLUDED.access_token, is_active = true, updated_at = NOW()`,
        [session.member.org_id, 'telegram', phone, data.session_string]
      )
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Telegram service unavailable' }, { status: 503 })
  }
}
