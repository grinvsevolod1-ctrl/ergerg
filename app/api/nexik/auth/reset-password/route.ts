import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { rateLimiters } from '@/lib/rate-limit'
import { JWT_SECRET, SESSION_CONFIG } from '@/lib/nexik/config/jwt'

const BCRYPT_ROUNDS = 12

export async function POST(request: NextRequest) {
  try {
    // Strict rate limiting
    const rateLimitResponse = await rateLimiters.strict(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Токен и новый пароль обязательны' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      )
    }

    // Verify reset token
    let payload: { memberId: string; type: string }
    try {
      const verified = await jwtVerify(token, JWT_SECRET)
      payload = verified.payload as { memberId: string; type: string }
      
      if (payload.type !== 'password_reset') {
        throw new Error('Invalid token type')
      }
    } catch {
      return NextResponse.json(
        { error: 'Недействительная или истекшая ссылка для сброса пароля' },
        { status: 400 }
      )
    }

    try {
      const { query, execute } = await import('@/lib/db')
      
      // Verify token matches stored token and hasn't been used
      const members = await query<{ 
        id: string
        email: string
        org_id: string
        role: string
        name: string
        reset_token: string | null
      }>(
        `SELECT m.id, m.email, m.org_id, m.role, m.name, m.reset_token
         FROM nexik_org_members m
         WHERE m.id = $1 
         AND m.reset_token = $2
         AND m.reset_token_expires > NOW()`,
        [payload.memberId, token]
      )

      if (members.length === 0) {
        return NextResponse.json(
          { error: 'Недействительная или истекшая ссылка для сброса пароля' },
          { status: 400 }
        )
      }

      const member = members[0]

      // Hash new password with secure rounds
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

      // Update password and clear reset token
      await execute(
        `UPDATE nexik_org_members 
         SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW()
         WHERE id = $2`,
        [passwordHash, member.id]
      )

      // Get organization info
      const orgs = await query<{ id: string; name: string; slug: string }>(
        'SELECT id, name, slug FROM nexik_organizations WHERE id = $1',
        [member.org_id]
      )
      const org = orgs[0]

      // Create new session and log user in
      const sessionToken = await new SignJWT({
        memberId: member.id,
        orgId: org.id,
        email: member.email,
        role: member.role
      })
        .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
        .setIssuedAt()
        .setExpirationTime(SESSION_CONFIG.expirationTime)
        .sign(JWT_SECRET)

      const cookieStore = await cookies()
      cookieStore.set(SESSION_CONFIG.cookieName, sessionToken, {
        ...SESSION_CONFIG.cookieOptions,
        maxAge: SESSION_CONFIG.maxAge
      })

      return NextResponse.json({
        success: true,
        message: 'Пароль успешно изменен',
        user: {
          id: member.id,
          email: member.email,
          name: member.name,
          role: member.role
        },
        org: {
          id: org.id,
          name: org.name
        }
      })

    } catch (error) {
      console.error('[Nexik ResetPassword] Database error:', error)
      return NextResponse.json(
        { error: 'Ошибка сервера' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[Nexik ResetPassword] Error:', error)
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
