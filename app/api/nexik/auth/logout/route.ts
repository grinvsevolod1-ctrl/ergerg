import { NextResponse } from 'next/server'
import { logout } from '@/lib/nexik/services/auth'

export async function POST() {
  try {
    await logout()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Nexik Logout API] Error:', error)
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}
