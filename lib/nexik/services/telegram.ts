/**
 * Nexik Telegram Notification Service
 * Отправка уведомлений операторам через Telegram
 */

const TELEGRAM_API = 'https://api.telegram.org/bot'

interface TelegramConfig {
  botToken: string
  chatId: string
}

interface SendMessageOptions {
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  disableWebPagePreview?: boolean
  replyMarkup?: {
    inline_keyboard?: Array<Array<{
      text: string
      url?: string
      callback_data?: string
    }>>
  }
}

/**
 * Отправить сообщение в Telegram
 */
export async function sendTelegramMessage(
  config: TelegramConfig,
  text: string,
  options: SendMessageOptions = {}
): Promise<boolean> {
  if (!config.botToken || !config.chatId) {
    console.warn('[Telegram] Missing bot token or chat ID')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API}${config.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disableWebPagePreview ?? true,
        reply_markup: options.replyMarkup
      })
    })

    const result = await response.json()
    
    if (!result.ok) {
      console.error('[Telegram] Send failed:', result.description)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Request failed:', error)
    return false
  }
}

/**
 * Уведомление о новом сообщении
 */
export async function notifyNewMessage(
  config: TelegramConfig,
  data: {
    conversationId: string
    visitorName?: string
    message: string
    pageUrl?: string
    dashboardUrl: string
  }
): Promise<boolean> {
  const visitorLabel = data.visitorName || 'Посетитель'
  
  const text = `
<b>💬 Новое сообщение в Nexik</b>

<b>От:</b> ${escapeHtml(visitorLabel)}
<b>Сообщение:</b>
${escapeHtml(data.message.slice(0, 500))}${data.message.length > 500 ? '...' : ''}

${data.pageUrl ? `<b>Страница:</b> ${escapeHtml(data.pageUrl)}\n` : ''}
`.trim()

  return sendTelegramMessage(config, text, {
    replyMarkup: {
      inline_keyboard: [[
        {
          text: '📱 Открыть чат',
          url: `${data.dashboardUrl}/chats/${data.conversationId}`
        }
      ]]
    }
  })
}

/**
 * Уведомление о новом диалоге
 */
export async function notifyNewConversation(
  config: TelegramConfig,
  data: {
    conversationId: string
    visitorName?: string
    visitorEmail?: string
    visitorPhone?: string
    firstMessage: string
    pageUrl?: string
    dashboardUrl: string
  }
): Promise<boolean> {
  const visitorLabel = data.visitorName || 'Новый посетитель'
  
  let contactInfo = ''
  if (data.visitorEmail) contactInfo += `\n<b>Email:</b> ${escapeHtml(data.visitorEmail)}`
  if (data.visitorPhone) contactInfo += `\n<b>Телефон:</b> ${escapeHtml(data.visitorPhone)}`
  
  const text = `
<b>🆕 Новый диалог в Nexik</b>

<b>Посетитель:</b> ${escapeHtml(visitorLabel)}${contactInfo}

<b>Первое сообщение:</b>
${escapeHtml(data.firstMessage.slice(0, 300))}${data.firstMessage.length > 300 ? '...' : ''}

${data.pageUrl ? `<b>Страница:</b> ${escapeHtml(data.pageUrl)}\n` : ''}
`.trim()

  return sendTelegramMessage(config, text, {
    replyMarkup: {
      inline_keyboard: [[
        {
          text: '💬 Ответить',
          url: `${data.dashboardUrl}/chats/${data.conversationId}`
        }
      ]]
    }
  })
}

/**
 * Уведомление о запросе оператора
 */
export async function notifyOperatorRequest(
  config: TelegramConfig,
  data: {
    conversationId: string
    visitorName?: string
    reason?: string
    dashboardUrl: string
  }
): Promise<boolean> {
  const visitorLabel = data.visitorName || 'Посетитель'
  
  const text = `
<b>🔔 Запрос оператора!</b>

<b>От:</b> ${escapeHtml(visitorLabel)}
${data.reason ? `<b>Причина:</b> ${escapeHtml(data.reason)}\n` : ''}
<i>AI не смог ответить или посетитель попросил оператора</i>
`.trim()

  return sendTelegramMessage(config, text, {
    replyMarkup: {
      inline_keyboard: [[
        {
          text: '🚀 Подключиться',
          url: `${data.dashboardUrl}/chats/${data.conversationId}`
        }
      ]]
    }
  })
}

/**
 * Ежедневная сводка
 */
export async function sendDailySummary(
  config: TelegramConfig,
  data: {
    date: string
    totalConversations: number
    newLeads: number
    aiHandled: number
    operatorHandled: number
    avgResponseTime: string
    dashboardUrl: string
  }
): Promise<boolean> {
  const text = `
<b>📊 Сводка Nexik за ${data.date}</b>

<b>Всего диалогов:</b> ${data.totalConversations}
<b>Новых лидов:</b> ${data.newLeads}

<b>AI обработал:</b> ${data.aiHandled}
<b>Оператор обработал:</b> ${data.operatorHandled}

<b>Среднее время ответа:</b> ${data.avgResponseTime}
`.trim()

  return sendTelegramMessage(config, text, {
    replyMarkup: {
      inline_keyboard: [[
        {
          text: '📈 Аналитика',
          url: `${data.dashboardUrl}/analytics`
        }
      ]]
    }
  })
}

/**
 * Получить конфиг Telegram из организации
 */
export async function getOrgTelegramConfig(orgId: string): Promise<TelegramConfig | null> {
  try {
    const { query } = await import('@/lib/db')
    
    const orgs = await query<{ settings: { telegram_bot_token?: string; telegram_chat_id?: string } }>(
      `SELECT settings FROM nexik_organizations WHERE id = $1`,
      [orgId]
    )
    
    if (!orgs[0]?.settings?.telegram_bot_token || !orgs[0]?.settings?.telegram_chat_id) {
      return null
    }
    
    return {
      botToken: orgs[0].settings.telegram_bot_token,
      chatId: orgs[0].settings.telegram_chat_id
    }
  } catch {
    return null
  }
}

/**
 * Вспомогательная функция для экранирования HTML
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
