import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN
const SESSION_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'ADMIN_API_TOKEN not configured on server' },
        { status: 500 }
      )
    }

    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Create a session token (in production, use a proper session ID + database)
    const sessionToken = Buffer.from(`${Date.now()}:${ADMIN_TOKEN}`).toString('base64')
    
    // Set HTTP-only cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}
