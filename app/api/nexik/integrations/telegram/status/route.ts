import { NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await query(
    'SELECT is_active FROM nexik_integrations WHERE org_id = $1 AND platform = $2',
    [session.member.org_id, 'telegram']
  )

  return NextResponse.json({ connected: result.length > 0 && result[0].is_active })
}
