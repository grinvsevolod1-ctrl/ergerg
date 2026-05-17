import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { rateLimiters } from '@/lib/rate-limit'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXIK_JWT_SECRET || 'nexik-secret-key-change-in-production'
)

export async function POST(request: NextRequest) {
  try {
    // Rate limit: strict for auth endpoints
    const rateLimitResponse = await rateLimiters.strict(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      )
    }

    let user = null
    let org = null

    try {
      const { query } = await import('@/lib/db')
      
      // Check if user already exists
      const existingUsers = await query<{ id: string }>(
        'SELECT id FROM nexik_org_members WHERE email = $1',
        [email.toLowerCase()]
      )

      if (existingUsers.length > 0) {
        return NextResponse.json(
          { error: 'Пользователь с таким email уже существует' },
          { status: 409 }
        )
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create organization
      const orgResult = await query<{ id: string; name: string }>(
        `INSERT INTO nexik_organizations (id, name, plan, created_at) 
         VALUES (gen_random_uuid(), $1, 'free', NOW()) 
         RETURNING id, name`,
        [`Организация ${email.split('@')[0]}`]
      )
      org = orgResult[0]

      // Create user/member
      const memberResult = await query<{
        id: string
        email: string
        name: string
        role: string
        org_id: string
      }>(
        `INSERT INTO nexik_org_members (id, org_id, email, password_hash, name, role, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'owner', NOW()) 
         RETURNING id, email, name, role, org_id`,
        [org.id, email.toLowerCase(), passwordHash, email.split('@')[0]]
      )
      user = memberResult[0]

    } catch (dbError) {
      console.error('[Nexik Register] Database error:', dbError)
      
      // Demo mode - create temporary session
      const tempId = `temp_${Date.now()}`
      user = {
        id: tempId,
        email: email.toLowerCase(),
        name: email.split('@')[0],
        role: 'owner',
        org_id: tempId
      }
      org = {
        id: tempId,
        name: `Организация ${email.split('@')[0]}`
      }
    }

    // Create JWT token with payload matching auth service format
    const token = await new SignJWT({
      memberId: user.id,
      orgId: org.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Set single session cookie (matching auth service)
    const cookieStore = await cookies()
    
    cookieStore.set('nexik_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      org: {
        id: org.id,
        name: org.name
      }
    })

  } catch (error) {
    console.error('[Nexik Register] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
