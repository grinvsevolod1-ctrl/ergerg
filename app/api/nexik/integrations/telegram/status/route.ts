import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM nexik_integrations WHERE platform = $1',
      ['telegram']
    )
    return NextResponse.json({ 
      connected: (result[0]?.count || 0) > 0,
      has_accounts: (result[0]?.count || 0) > 0
    })
  } catch (error) {
    console.error('[Telegram Status] Error:', error)
    return NextResponse.json({ connected: false, has_accounts: false })
  }
}
