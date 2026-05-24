import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { execute } from '@/lib/db'
import { sendEmail } from '@/lib/email/smtp'

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  try {
    const result = await sendEmail({
      to: email,
      subject: 'Ваш код подтверждения Nexik',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #0a0f14; color: #fff; border-radius: 12px;">
          <h2 style="color: #22d3ee;">Код подтверждения Nexik</h2>
          <p>Ваш код для входа в Nexik:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; background: #1a1f24; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Код действителен в течение 10 минут.</p>
          <p style="color: #666; font-size: 12px;">Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
        </div>
      `,
      text: `Ваш код подтверждения Nexik: ${otp}. Код действителен 10 минут.`
    })
    return result.success
  } catch (error) {
    console.error('[OTP] Email send error:', error)
    return false
  }
}

async function sendOtpTelegram(email: string, otp: string): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
  const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID

  if (!telegramBotToken || !telegramChatId) {
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

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await rateLimiters.auth(request)
    if (rateLimitResponse) return rateLimitResponse

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Неверный формат email' }, { status: 400 })
    }

    const otp = generateOtp()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    try {
      await execute(
        `INSERT INTO nexik_otp_codes (email, code, expires_at, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (email) DO UPDATE SET code = $2, expires_at = $3, attempts = 0, created_at = NOW()`,
        [email.toLowerCase(), otp, expiresAt]
      )
    } catch (dbError) {
      console.error('[OTP] DB error:', dbError)
    }

    // Отправляем на email
    const emailSent = await sendOtpEmail(email, otp)
    
    // Дублируем в Telegram (опционально)
    await sendOtpTelegram(email, otp)

    if (!emailSent) {
      console.log(`[OTP] Email failed, code for ${email}: ${otp}`)
      return NextResponse.json({ 
        success: false, 
        error: 'Не удалось отправить код на email. Проверьте настройки почты.' 
      }, { status: 500 })
    }

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
