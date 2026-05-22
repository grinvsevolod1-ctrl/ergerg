/**
 * Unsubscribe API
 * Handles email unsubscription requests (required for anti-spam compliance)
 */

import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeEmail, isEmailUnsubscribed } from '@/lib/mailings/database'

// GET - Check unsubscribe status (for page)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 })
  }

  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const [email] = decoded.split(':')
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const unsubscribed = await isEmailUnsubscribed(email)
    
    return NextResponse.json({
      email: maskEmail(email),
      unsubscribed,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }
}

// POST - Process unsubscribe
export async function POST(req: NextRequest) {
  try {
    const { token, reason } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const decoded = Buffer.from(token, 'base64url').toString()
    const [email] = decoded.split(':')
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Add to unsubscribe list
    await unsubscribeEmail(email, reason)
    
    console.log(`[Unsubscribe] ${email} unsubscribed. Reason: ${reason || 'not provided'}`)

    return NextResponse.json({
      success: true,
      message: 'Вы успешно отписались от рассылки',
    })
  } catch (error) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 })
  }
}

// Mask email for privacy
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local[0]}${local[1]}***@${domain}`
}
