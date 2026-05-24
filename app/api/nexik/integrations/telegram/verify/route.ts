import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'

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
      const orgId = session.member.org_id
      
      // Check if integration already exists
      const existing = await query<{ id: string }>(
        `SELECT id FROM nexik_integrations 
         WHERE org_id = $1 AND platform = 'telegram' AND platform_id = $2`,
        [orgId, phone]
      )
      
      let integrationId: string
      
      if (existing[0]) {
        // Update existing integration
        integrationId = existing[0].id
        await execute(
          `UPDATE nexik_integrations 
           SET access_token = $1, is_active = true, is_connected = true, 
               last_connected_at = NOW(), connection_error = NULL, updated_at = NOW()
           WHERE id = $2`,
          [data.session_string, integrationId]
        )
      } else {
        // Create new integration
        const result = await query<{ id: string }>(
          `INSERT INTO nexik_integrations (
            org_id, platform, platform_id, platform_name, access_token, 
            is_active, is_connected, last_connected_at
          ) VALUES ($1, 'telegram', $2, $3, $4, true, true, NOW())
          RETURNING id`,
          [orgId, phone, data.user_name || phone, data.session_string]
        )
        integrationId = result[0].id
        
        // Create default telegram settings
        await execute(
          `INSERT INTO nexik_telegram_settings (org_id, integration_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [orgId, integrationId]
        )
      }
      
      return NextResponse.json({ 
        success: true, 
        integration_id: integrationId,
        phone,
        user_name: data.user_name
      })
    }

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[Telegram Verify] Error:', error)
    return NextResponse.json({ error: 'Telegram service unavailable' }, { status: 503 })
  }
}
