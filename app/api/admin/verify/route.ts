import { NextRequest, NextResponse } from 'next/server'

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!ADMIN_TOKEN) {
      return NextResponse.json(
        { valid: false, error: 'ADMIN_API_TOKEN not configured on server' },
        { status: 500 }
      )
    }

    if (token === ADMIN_TOKEN) {
      return NextResponse.json({ valid: true })
    }

    return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 })
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 })
  }
}
