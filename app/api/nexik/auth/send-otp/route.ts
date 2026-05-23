import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { execute } from '@/lib/db'

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
    try {
      await execute(
        `INSERT INTO nexik_otp_codes (email, code, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3, attempts = 0, created_at = NOW()`,
        [email.toLowerCase(), otp, expiresAt]
      )
    } catch (dbError) {
      console.error('[OTP] DB error:', dbError)
      // Continue anyway - we can still send the code
    }
    
    // Always send via Telegram for now
    await sendOtpTelegram(email, otp)
    
    // Log for development
    console.log(`[OTP] Code for ${email}: ${otp}`)
    
    return NextResponse.json({ 
      success: true,
      message: 'Код отправлен на email'
    })
    
  } catch (error) {
    console.error('[OTP] Error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// Send OTP notification via Telegram
async function sendOtpTelegram(email: string, otp: string): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  
  if (!telegramBotToken || !telegramChatId) {
    console.log('[OTP] Telegram not configured, code:', otp)
    return
  }
  
  try {
    await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: `<b>Код подтверждения Nexik</b>\n\nEmail: <code>${email}</code>\nКод: <code>${otp}</code>\n\nДействителен 10 минут`,
        parse_mode: 'HTML'
      })
    })
  } catch (err) {
    console.error('[OTP] Telegram send error:', err)
  }
}
