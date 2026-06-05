import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM nexik_integrations WHERE platform = $1',
      ['telegram']
    )
    const count = Number(result[0]?.count || 0)
    return NextResponse.json({ 
      connected: count > 0,
      has_accounts: count > 0
    })
  } catch (error) {
    console.error('[Telegram Status] Error:', error)
    return NextResponse.json({ connected: false, has_accounts: false })
  }
}
