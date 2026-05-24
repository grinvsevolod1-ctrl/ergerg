import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Получаем сессию Telegram по номеру телефона
async function getTelegramSession(phone: string) {
  const result = await query(
    'SELECT access_token, org_id FROM nexik_integrations WHERE platform_id = $1 AND platform = $telegram AND is_active = true',
    [phone]
  )
  return result.length > 0 ? result[0] : null
}

// Отправляем ответ через Telegram API
async function sendTelegramReply(session_string: string, chat_id: number, text: string) {
  const response = await fetch('http://localhost:8005/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_string, chat_id, text })
  })
  return response.json()
}

// Вызываем Nexik AI
async function callNexikAI(message: string, org_id: string, visitor_id: string) {
  const response = await fetch('http://localhost:3000/api/nexik/analyze-input', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: message,
      visitorId: visitor_id,
      conversationId: `tg_${visitor_id}_${Date.now()}`,
      conversationHistory: []
    })
  })
  const data = await response.json()
  return data.response
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[Telegram Webhook] Received:', JSON.stringify(body, null, 2))

    // Обработка разных типов событий
    if (body.message) {
      const message = body.message
      const chat_id = message.chat?.id
      const text = message.text
      const sender_phone = message.from?.phone_number

      if (!text || !chat_id || !sender_phone) {
        return NextResponse.json({ ok: true })
      }

      // Получаем сессию Telegram по номеру отправителя
      const telegramAccount = await getTelegramSession(sender_phone)
      if (!telegramAccount) {
        console.log(`[Telegram Webhook] No account found for ${sender_phone}`)
        return NextResponse.json({ ok: true })
      }

      // Вызываем Nexik AI
      const visitor_id = `tg_${sender_phone}_${telegramAccount.org_id}`
      const aiResponse = await callNexikAI(text, telegramAccount.org_id, visitor_id)

      // Отправляем ответ
      await sendTelegramReply(telegramAccount.access_token, chat_id, aiResponse)

      // Сохраняем сообщение в БД
      await query(
        `INSERT INTO nexik_messages (visitor_id, conversation_id, role, content, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [visitor_id, `tg_${chat_id}`, 'user', text]
      )
      await query(
        `INSERT INTO nexik_messages (visitor_id, conversation_id, role, content, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [visitor_id, `tg_${chat_id}`, 'assistant', aiResponse]
      )

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ ok: true })
  }
}

// Для верификации webhook (GET запрос)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Проверяем токен (можно добавить в .env)
  if (token === process.env.TELEGRAM_WEBHOOK_TOKEN || token === 'nexik_telegram_2024') {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}
