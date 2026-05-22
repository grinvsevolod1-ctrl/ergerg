/**
 * NetNext Operator Connection API
 * Подключение к живому оператору через Telegram
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/nexik/services/telegram'

export const runtime = 'nodejs'

interface OperatorRequestBody {
  visitorId?: string
  visitorName?: string
  conversationHistory?: Array<{ role: string; content: string }>
  currentPage?: string
  email?: string
  phone?: string
}

// NetNext operator Telegram config
const NETNEXT_TELEGRAM = {
  botToken: process.env.NETNEXT_TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.NETNEXT_TELEGRAM_CHAT_ID || ''
}

export async function POST(request: NextRequest) {
  try {
    const body: OperatorRequestBody = await request.json()
    const { visitorId, visitorName, conversationHistory = [], currentPage, email, phone } = body

    // Build conversation summary
    const lastMessages = conversationHistory.slice(-5)
    const conversationSummary = lastMessages
      .map(m => `${m.role === 'user' ? '👤' : '🤖'} ${m.content}`)
      .join('\n')

    // Build contact info
    const contactInfo = [
      email && `📧 ${email}`,
      phone && `📞 ${phone}`
    ].filter(Boolean).join('\n')

    // Build notification message
    const message = `🔔 <b>Запрос на живого оператора</b>

👤 <b>Посетитель:</b> ${visitorName || visitorId || 'Аноним'}
📍 <b>Страница:</b> ${currentPage || 'netnext.org'}
${contactInfo ? `\n<b>Контакты:</b>\n${contactInfo}` : ''}

💬 <b>Последние сообщения:</b>
<code>${conversationSummary || 'Нет сообщений'}</code>

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`

    // Send to Telegram
    const sent = await sendTelegramMessage(NETNEXT_TELEGRAM, message, {
      parseMode: 'HTML',
      replyMarkup: {
        inline_keyboard: [[
          { text: '💬 Ответить в чате', url: `https://netnext.org/admin/chat?visitor=${visitorId || 'unknown'}` }
        ]]
      }
    })

    if (!sent) {
      console.warn('[Operator] Telegram notification failed, but continuing')
    }

    // Store operator request in queue (for future: real-time chat with operator)
    // TODO: Implement WebSocket or Supabase Realtime for live operator chat

    return NextResponse.json({
      success: true,
      message: 'Оператор получил уведомление и скоро ответит',
      estimatedWait: '2-5 минут',
      ticketId: `op_${Date.now()}`
    })

  } catch (error) {
    console.error('[Operator API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to operator', message: 'Не удалось связаться с оператором. Напишите на info@netnext.org' },
      { status: 500 }
    )
  }
}

// Check operator availability
export async function GET() {
  // Check if it's working hours (10:00-20:00 Almaty time)
  const now = new Date()
  const almatyHour = parseInt(now.toLocaleString('en-US', { 
    timeZone: 'Asia/Almaty', 
    hour: 'numeric', 
    hour12: false 
  }))
  
  const isWorkingHours = almatyHour >= 10 && almatyHour < 20
  const dayOfWeek = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Almaty', 
    weekday: 'short' 
  })
  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun'

  return NextResponse.json({
    available: isWorkingHours && !isWeekend,
    workingHours: '10:00-20:00 (Астана)',
    currentTime: now.toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' }),
    message: isWorkingHours && !isWeekend 
      ? 'Операторы онлайн, среднее время ответа 2-5 минут'
      : 'Сейчас нерабочее время. Оставьте сообщение, ответим утром!'
  })
}
