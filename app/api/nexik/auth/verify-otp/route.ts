import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { query, execute } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResponse = await rateLimiters.auth(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { email, code } = await request.json()
    
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
    
    // Check attempts
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ error: 'Слишком много попыток. Запросите новый код.' }, { status: 429 })
    }
    
    // Increment attempts
    await execute(
      'UPDATE nexik_otp_codes SET attempts = attempts + 1 WHERE email = $1',
      [email.toLowerCase()]
    )
    
    // Check expiration
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Код истёк. Запросите новый.' }, { status: 400 })
    }
    
    // Verify code
    if (otpRecord.code !== code) {
      return NextResponse.json({ error: 'Неверный код' }, { status: 400 })
    }
    
    // Code is valid - delete it
    await execute('DELETE FROM nexik_otp_codes WHERE email = $1', [email.toLowerCase()])
    
    // Check if user exists
    const existingMembers = await query<{ id: string }>(
      'SELECT id FROM nexik_org_members WHERE email = $1',
      [email.toLowerCase()]
    )
    
    const isNewUser = existingMembers.length === 0
    
    return NextResponse.json({
      success: true,
      isNewUser,
      email: email.toLowerCase()
    })
    
  } catch (error) {
    console.error('[OTP Verify] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
