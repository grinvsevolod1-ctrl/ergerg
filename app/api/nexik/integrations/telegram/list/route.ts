import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await query(
    'SELECT id, platform_id, is_active, created_at FROM nexik_integrations WHERE org_id = $1 AND platform = $2 ORDER BY created_at DESC',
    [session.member.org_id, 'telegram']
  )

  return NextResponse.json({ integrations: result || [] })
}
