import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { rateLimiters } from '@/lib/rate-limit'
import { getJwtSecret, SESSION_CONFIG } from '@/lib/nexik/config/jwt'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: strict for login (prevent brute force)
    const rateLimitResponse = await rateLimiters.auth(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    // Try to find user in database
    let user = null
    let org = null

    try {
      const { query } = await import('@/lib/db')
      
      // Find member by email
      const members = await query<{
        id: string
        org_id: string
        email: string
        password_hash: string
        name: string
        role: string
      }>(
        `SELECT m.*, o.name as org_name 
         FROM nexik_org_members m
         JOIN nexik_organizations o ON o.id = m.org_id
         WHERE m.email = $1`,
        [email.toLowerCase()]
      )

      if (members.length > 0) {
        const member = members[0]
        
        // Verify password using bcrypt
        if (!member.password_hash) {
          return NextResponse.json(
            { error: 'Неверный email или пароль' },
            { status: 401 }
          )
        }
        
        const isValidPassword = await bcrypt.compare(password, member.password_hash)
        
        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Неверный email или пароль' },
            { status: 401 }
          )
        }

        user = member
        
        // Get org
        const orgs = await query<{ id: string; name: string }>(
          'SELECT id, name FROM nexik_organizations WHERE id = $1',
          [member.org_id]
        )
        org = orgs[0]

        // Update last login
        await query(
          'UPDATE nexik_org_members SET last_login_at = NOW() WHERE id = $1',
          [member.id]
        )
      }
    } catch (error) {
      console.error('[Nexik Auth] Database error:', error)
      return NextResponse.json(
        { error: 'База данных недоступна. Попробуйте позже.' },
        { status: 503 }
      )
    }

    if (!user || !org) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Create JWT token with payload matching auth service format
    const token = await new SignJWT({
      memberId: user.id,
      orgId: org.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
      .setIssuedAt()
      .setExpirationTime(SESSION_CONFIG.expirationTime)
      .sign(getJwtSecret())

    // Set single session cookie (matching auth service)
    const cookieStore = await cookies()
    
    cookieStore.set(SESSION_CONFIG.cookieName, token, {
      ...SESSION_CONFIG.cookieOptions,
      maxAge: SESSION_CONFIG.maxAge
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
    console.error('[Nexik Auth] Login error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
