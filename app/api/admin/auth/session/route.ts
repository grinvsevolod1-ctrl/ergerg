import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN
const SESSION_NAME = 'admin_session'

export async function GET() {
  try {
    if (!ADMIN_TOKEN) {
      return NextResponse.json({ authenticated: false }, { status: 500 })
    }

    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_NAME)

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false })
    }

    // Verify session token
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString()
      const [, storedToken] = decoded.split(':')
      
      if (storedToken === ADMIN_TOKEN) {
        return NextResponse.json({ authenticated: true })
      }
    } catch {
      // Invalid session format
    }

    return NextResponse.json({ authenticated: false })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}
