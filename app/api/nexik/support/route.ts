import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { sendTelegramMessage } from "@/lib/nexik/services/telegram"

// Support request handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, website, message, widgetId, type } = body

    if (!email || !website) {
      return NextResponse.json(
        { error: "Email and website are required" },
        { status: 400 }
      )
    }

    // Save to database
    const [supportRequest] = await query<{
      id: string
      created_at: string
    }>(`
      INSERT INTO nexik_support_requests (name, email, website, message, widget_id, type, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'new')
      RETURNING id, created_at
    `, [
      name || 'Anonymous',
      email,
      website,
      message || '',
      widgetId || null,
      type || 'general'
    ])

    // Send Telegram notification to admin
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID
    
    if (telegramBotToken && telegramChatId) {
      const typeLabels: Record<string, string> = {
        'general': 'Общий вопрос',
        'bug': 'Баг',
        'feature': 'Запрос функции',
        'integration': 'Помощь с интеграцией',
        'billing': 'Оплата'
      }

      const notificationText = `
<b>🆘 Новый запрос в поддержку Nexik</b>

<b>Тип:</b> ${typeLabels[type] || type || 'Общий'}
<b>Имя:</b> ${escapeHtml(name || 'Не указано')}
<b>Email:</b> ${escapeHtml(email)}
<b>Сайт:</b> ${escapeHtml(website)}
${widgetId ? `<b>Widget ID:</b> ${escapeHtml(widgetId)}\n` : ''}
<b>Сообщение:</b>
${escapeHtml(message || 'Не указано')}

<b>ID заявки:</b> <code>${supportRequest.id}</code>
`.trim()

      await sendTelegramMessage(
        { botToken: telegramBotToken, chatId: telegramChatId },
        notificationText,
        { parseMode: 'HTML' }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Support request received",
      requestId: supportRequest.id
    })

  } catch (error) {
    // If table doesn't exist, create it
    if (error instanceof Error && error.message.includes('nexik_support_requests')) {
      await query(`
        CREATE TABLE IF NOT EXISTS nexik_support_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          website VARCHAR(500) NOT NULL,
          message TEXT,
          widget_id UUID REFERENCES nexik_widgets(id) ON DELETE SET NULL,
          type VARCHAR(50) DEFAULT 'general',
          status VARCHAR(50) DEFAULT 'new',
          resolved_at TIMESTAMPTZ,
          resolved_by UUID,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `)
      
      // Retry the request
      return POST(request)
    }

    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    )
  }
}

// Get support request status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestId = searchParams.get("id")

  if (!requestId) {
    return NextResponse.json(
      { error: "Request ID is required" },
      { status: 400 }
    )
  }

  try {
    const [supportRequest] = await query<{
      id: string
      status: string
      created_at: string
      resolved_at: string | null
    }>(`
      SELECT id, status, created_at, resolved_at
      FROM nexik_support_requests
      WHERE id = $1
    `, [requestId])

    if (!supportRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      )
    }

    const statusMessages: Record<string, string> = {
      'new': 'Ваш запрос получен. Мы свяжемся с вами в течение 24 часов.',
      'in_progress': 'Мы работаем над вашим запросом.',
      'waiting': 'Ожидаем дополнительной информации от вас.',
      'resolved': 'Ваш запрос решен.',
      'closed': 'Запрос закрыт.'
    }

    return NextResponse.json({
      id: supportRequest.id,
      status: supportRequest.status,
      message: statusMessages[supportRequest.status] || 'Обрабатывается.',
      createdAt: supportRequest.created_at,
      resolvedAt: supportRequest.resolved_at
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch request status" },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
