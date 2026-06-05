import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'
import { rateLimiters } from '@/lib/rate-limit'
import { getJwtSecret, SESSION_CONFIG } from '@/lib/nexik/config/jwt'

export async function POST(request: NextRequest) {
  try {
    // Strict rate limiting for password reset
    const rateLimitResponse = await rateLimiters.strict(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email обязателен' },
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

    let memberExists = false
    let memberId: string | null = null

    try {
      const { query } = await import('@/lib/db')
      
      // Check if user exists
      const members = await query<{ id: string; email: string }>(
        `SELECT m.id, m.email 
         FROM nexik_org_members m
         WHERE m.email = $1`,
        [email.toLowerCase()]
      )

      if (members.length > 0) {
        memberExists = true
        memberId = members[0].id
      }
    } catch {
      // Continue - we'll send generic response anyway for security
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user actually exists
    if (memberExists && memberId) {
      // Create reset token (valid for 1 hour)
      const resetToken = await new SignJWT({
        memberId,
        type: 'password_reset'
      })
        .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(getJwtSecret())

      // Store reset token in database
      try {
        const { execute } = await import('@/lib/db')
        await execute(
          `UPDATE nexik_org_members 
           SET reset_token = $1, reset_token_expires = NOW() + INTERVAL '1 hour'
           WHERE id = $2`,
          [resetToken, memberId]
        )

        // Send email (if email service is configured)
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nexik.org'}/nexik/reset-password?token=${resetToken}`
        
        // Try to send via nodemailer
        try {
          const nodemailer = await import('nodemailer')
          
          if (process.env.SMTP_HOST) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST,
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            })

            await transporter.sendMail({
              from: process.env.SMTP_FROM || 'noreply@nexik.org',
              to: email.toLowerCase(),
              subject: 'Восстановление пароля Nexik',
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                  <h1 style="color: #00ffff; margin-bottom: 24px;">Nexik</h1>
                  <h2 style="color: #333; margin-bottom: 16px;">Восстановление пароля</h2>
                  <p style="color: #666; margin-bottom: 24px;">
                    Вы запросили сброс пароля для вашего аккаунта Nexik. 
                    Нажмите на кнопку ниже, чтобы создать новый пароль.
                  </p>
                  <a href="${resetUrl}" style="display: inline-block; background: #00ffff; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin-bottom: 24px;">
                    Сбросить пароль
                  </a>
                  <p style="color: #999; font-size: 14px; margin-top: 32px;">
                    Ссылка действительна 1 час. Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
                  </p>
                </div>
              `,
            })
            
            // Email sent successfully
          } else {
            // No SMTP configured - token stored in DB, user can use reset link
          }
        } catch {
          // Don't fail the request if email fails
        }
      } catch {
        // Token storage failed silently
      }
    }

    // Always return success (security best practice)
    return NextResponse.json({
      success: true,
      message: 'Если указанный email зарегистрирован, мы отправили инструкции по восстановлению пароля'
    })

  } catch {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    )
  }
}
