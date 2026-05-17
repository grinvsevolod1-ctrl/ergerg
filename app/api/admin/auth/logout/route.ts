import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SESSION_NAME = 'admin_session'

export async function POST() {
  const cookieStore = await cookies()
  
  // Clear the session cookie
  cookieStore.set(SESSION_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expire
  })

  return NextResponse.json({ success: true })
}
