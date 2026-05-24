import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { query, execute } from '@/lib/db'
import { SignJWT } from 'jose'
import bcrypt from 'bcryptjs'
import { JWT_SECRET, SESSION_CONFIG } from '@/lib/nexik/config/jwt'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.auth(request)
    if (rateLimitResponse) return rateLimitResponse

    const { email, code, platform } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Email и код обязательны' }, { status: 400 })
    }

    // Get stored OTP
    const otpRecords = await query<{
      code: string
      expires_at: Date
      attempts: number
    }>(
      'SELECT code, expires_at, attempts FROM nexik_otp_codes WHERE email = $1',
      [email.toLowerCase()]
    )

    if (otpRecords.length === 0) {
      return NextResponse.json({ error: 'Код не найден. Запросите новый.' }, { status: 400 })
    }

    const otpRecord = otpRecords[0]

    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Слишком много попыток. Запросите новый код.' }, { status: 429 })
    }

    await execute(
      'UPDATE nexik_otp_codes SET attempts = attempts + 1 WHERE email = $1',
      [email.toLowerCase()]
    )

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Код истёк. Запросите новый.' }, { status: 400 })
    }

    if (otpRecord.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }

    await execute('DELETE FROM nexik_otp_codes WHERE email = $1', [email.toLowerCase()])

    // Check if user exists
    let existingMember = await query<{ id: string; org_id: string; name: string }>(
      'SELECT id, org_id, name FROM nexik_org_members WHERE email = $1',
      [email.toLowerCase()]
    )

    let member = existingMember[0]
    let isNewUser = false

    if (!member) {
      isNewUser = true
      // Create organization for new user
      const orgName = `Организация ${email.split('@')[0]}`
      const orgs = await query<{ id: string }>(
        `INSERT INTO nexik_organizations (name, slug, owner_email, plan, messages_limit)
         VALUES ($1, $2, $3, 'free', 1000)
         RETURNING id`,
        [orgName, orgName.toLowerCase().replace(/[^a-z0-9]/g, '-'), email.toLowerCase()]
      )
      const orgId = orgs[0].id

      // Generate random password (user will login via OTP next time)
      const randomPassword = Math.random().toString(36).slice(-12)
      const passwordHash = await bcrypt.hash(randomPassword, 10)

      const members = await query<{ id: string; org_id: string; name: string }>(
        `INSERT INTO nexik_org_members (org_id, email, password_hash, name, role, email_verified)
         VALUES ($1, $2, $3, $4, 'owner', true)
         RETURNING id, org_id, name`,
        [orgId, email.toLowerCase(), passwordHash, email.split('@')[0]]
      )
      member = members[0]
    }

    // Create JWT token
    const token = await new SignJWT({
      memberId: member.id,
      orgId: member.org_id,
      email: email.toLowerCase(),
      role: 'owner',
      name: member.name || email.split('@')[0]
    })
      .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
      .setIssuedAt()
      .setExpirationTime(SESSION_CONFIG.expirationTime)
      .sign(JWT_SECRET)

    // Set cookie
    const response = NextResponse.json({
      success: true,
      isNewUser,
      redirectTo: platform === 'instagram' ? '/nexik/connect/instagram' : '/nexik/dashboard'
    })

    response.cookies.set({
      name: SESSION_CONFIG.cookieName,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_CONFIG.maxAge,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('[OTP Verify] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
