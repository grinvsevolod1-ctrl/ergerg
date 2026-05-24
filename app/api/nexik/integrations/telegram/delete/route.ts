import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { phone } = await request.json()
  
  await query(
    'DELETE FROM nexik_integrations WHERE org_id = $1 AND platform = $2 AND platform_id = $3',
    [session.member.org_id, 'telegram', phone]
  )

  return NextResponse.json({ success: true })
}
