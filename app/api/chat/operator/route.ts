/**
 * NetNext Operator Connection API
 *
 * Регистрирует сессию веб-чата в общем хранилище (chat_sessions/chat_messages),
 * чтобы диалог был виден в админ-панели (/admin/chats), и уведомляет оператора
 * в Telegram.
 *
 * type:
 *  - 'dialog_started' — посетитель начал диалог (мягкое уведомление)
 *  - 'operator'       — посетитель запросил живого оператора (срочное)
 *
 * Кнопка «Подключиться» использует callback `connect:{sessionId}`, который
 * обрабатывает существующий Telegram webhook (тем же ботом TELEGRAM_BOT_TOKEN).
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/nexik/services/telegram'
import { createSession } from '@/lib/db/chat'

export const runtime = 'nodejs'

type NotifyType = 'dialog_started' | 'operator'

interface OperatorRequestBody {
  sessionId?: string
  visitorId?: string
  type?: NotifyType
  visitorName?: string
  conversationHistory?: Array<{ role: string; content: string }>
  currentPage?: string
  email?: string
  phone?: string
}

function getSiteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://netnext.org'
  ).replace(/\/$/, '')
}

// Предпочитаем webhook-бота (его callback `connect:` обрабатывается),
// с запасным вариантом на отдельного NetNext-бота.
function getTelegramConfig() {
  const webhookToken = process.env.TELEGRAM_BOT_TOKEN
  const webhookChatId = process.env.TELEGRAM_CHAT_ID

  if (webhookToken && webhookChatId) {
    return { botToken: webhookToken, chatId: webhookChatId, isWebhookBot: true }
  }

  return {
    botToken: process.env.NETNEXT_TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.NETNEXT_TELEGRAM_CHAT_ID || '',
    isWebhookBot: false,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OperatorRequestBody = await request.json()
    const {
      visitorId,
      visitorName,
      conversationHistory = [],
      currentPage,
      email,
      phone,
    } = body

    const type: NotifyType = body.type === 'operator' ? 'operator' : 'dialog_started'
    const sessionId = body.sessionId || visitorId || `web_${Date.now()}`

    // Регистрируем сессию в БД — диалог появится в админ-панели (идемпотентно).
    try {
      await createSession(sessionId, 'website')
    } catch (err) {
      console.error('[Operator] Failed to create session:', err)
    }

    const lastMessages = conversationHistory.slice(-5)
    const conversationSummary = lastMessages
      .map((m) => `${m.role === 'user' ? '👤' : m.role === 'operator' ? '🧑‍💼' : '🤖'} ${m.content}`)
      .join('\n')

    const contactInfo = [email && `📧 ${email}`, phone && `📞 ${phone}`]
      .filter(Boolean)
      .join('\n')

    const header =
      type === 'operator'
        ? '🔔 <b>Запрос живого оператора</b>'
        : '🆕 <b>Новый диалог на сайте</b>'

    const message = `${header}

👤 <b>Посетитель:</b> ${visitorName || sessionId}
📍 <b>Страница:</b> ${currentPage || 'netnext.org'}
🆔 <b>Сессия:</b> <code>${sessionId}</code>
${contactInfo ? `\n<b>Контакты:</b>\n${contactInfo}` : ''}

💬 <b>Последние сообщения:</b>
<code>${conversationSummary || 'пока нет сообщений'}</code>

⏰ ${new Date().toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' })}`

    const { botToken, chatId, isWebhookBot } = getTelegramConfig()
    const baseUrl = getSiteBaseUrl()

    const inlineKeyboard: Array<Array<{ text: string; url?: string; callback_data?: string }>> = []
    // Кнопка «Подключиться» работает только у webhook-бота (его callback обрабатывается).
    if (isWebhookBot) {
      inlineKeyboard.push([{ text: '💬 Подключиться к диалогу', callback_data: `connect:${sessionId}` }])
    }
    inlineKeyboard.push([{ text: '🛠 Открыть в админ-панели', url: `${baseUrl}/admin/chats/${sessionId}` }])

    const sent = await sendTelegramMessage(
      { botToken, chatId },
      message,
      { parseMode: 'HTML', replyMarkup: { inline_keyboard: inlineKeyboard } },
    )

    if (!sent) {
      console.warn('[Operator] Telegram notification not sent (missing config or API error)')
    }

    return NextResponse.json({
      success: true,
      sessionId,
      notified: sent,
      message:
        type === 'operator'
          ? 'Оператор получил уведомление и скоро ответит. Обычно это занимает 2–5 минут в рабочее время.'
          : 'Диалог зарегистрирован.',
      estimatedWait: '2-5 минут',
    })
  } catch (error) {
    console.error('[Operator API] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to connect to operator',
        message: 'Не удалось связаться с оператором. Напишите на hello@netnext.site',
      },
      { status: 500 },
    )
  }
}

// Проверка доступности оператора (рабочие часы).
export async function GET() {
  const now = new Date()
  const almatyHour = parseInt(
    now.toLocaleString('en-US', { timeZone: 'Asia/Almaty', hour: 'numeric', hour12: false }),
  )

  const isWorkingHours = almatyHour >= 10 && almatyHour < 20
  const dayOfWeek = now.toLocaleString('en-US', { timeZone: 'Asia/Almaty', weekday: 'short' })
  const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun'

  return NextResponse.json({
    available: isWorkingHours && !isWeekend,
    workingHours: '10:00-20:00 (Астана)',
    currentTime: now.toLocaleString('ru-RU', { timeZone: 'Asia/Almaty' }),
    message:
      isWorkingHours && !isWeekend
        ? 'Операторы онлайн, среднее время ответа 2-5 минут'
        : 'Сейчас нерабочее время. Оставьте сообщение, ответим утром!',
  })
}
