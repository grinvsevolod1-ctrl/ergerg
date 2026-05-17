import { NextRequest, NextResponse } from 'next/server'
import { requestDataDeletion, getLeadByEmail } from '@/lib/db/leads'
import { isValidEmail, sanitizeInput } from '@/lib/security'

interface DeleteRequestBody {
  email: string
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteRequestBody = await request.json()
    
    if (!body.email) {
      return NextResponse.json(
        { success: false, error: 'Email обязателен' },
        { status: 400 }
      )
    }
    
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат email' },
        { status: 400 }
      )
    }
    
    const email = sanitizeInput(body.email).toLowerCase()
    
    // Check if lead exists
    const lead = await getLeadByEmail(email)
    
    if (!lead) {
      // Don't reveal if email exists or not for privacy
      return NextResponse.json({
        success: true,
        message: 'Если данные с этим email существуют, запрос на удаление будет обработан в течение 30 дней.',
      })
    }
    
    // Mark for deletion
    await requestDataDeletion(email)
    
    // Send notification to admin
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      try {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `⚠️ Запрос на удаление данных\n\nEmail: ${email}\nДата: ${new Date().toISOString()}`,
          }),
        })
      } catch {
        // Ignore notification errors
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Запрос на удаление данных принят. Ваши данные будут удалены в течение 30 дней согласно законодательству о защите персональных данных.',
    })
    
  } catch (error) {
    console.error('[API] delete request error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка обработки запроса' },
      { status: 500 }
    )
  }
}
