import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { query, execute } from '@/lib/db'

// Generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rateLimitResponse = await rateLimiters.auth(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 })
    }
    
    // Generate OTP
    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    
    // Store OTP in database
    await execute(
      `INSERT INTO nexik_otp_codes (email, code, expires_at, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3, attempts = 0, created_at = NOW()`,
      [email.toLowerCase(), otp, expiresAt]
    )
    
    // Send email (using simple fetch to email API or log for dev)
    const emailSent = await sendOtpEmail(email, otp)
    
    if (!emailSent) {
      // In development, just log the code
      console.log(`[OTP] Code for ${email}: ${otp}`)
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Код отправлен на email',
      // In dev mode, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code: otp })
    })
    
  } catch (error) {
    console.error('[OTP] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// Send OTP via email
async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  try {
    // Try to send via Telegram bot as notification (simple approach)
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
    
    if (telegramBotToken && telegramChatId) {
      await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔐 Код подтверждения Nexik\n\nEmail: ${email}\nКод: ${otp}\n\nДействителен 10 минут`,
          parse_mode: 'HTML'
        })
      })
    }
    
    // TODO: Add real email sending via SendGrid/Resend/etc
    // For now, return true if we have Telegram configured
    return !!telegramBotToken
    
  } catch {
    return false
  }
}
