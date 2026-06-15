import { NextRequest, NextResponse } from "next/server"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json()

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true, configured: false })
    }

    let message = ""
    let replyMarkup = {}

    const projectTypeLabels: Record<string, string> = {
      website: "Сайт",
      app: "Приложение",
      design: "Дизайн",
      other: "Другое",
    }
    const budgetLabels: Record<string, string> = {
      small: "до 3 000 BYN",
      medium: "3 000 \\- 10 000 BYN",
      large: "10 000 \\- 30 000 BYN",
      enterprise: "30 000\\+ BYN",
    }
    const contactMethodLabels: Record<string, string> = {
      email: "Email",
      telegram: "Telegram",
      phone: "Телефон",
    }

    if (type === "contact_form") {
      const method = data.contactMethod || "email"
      const contactLabel = contactMethodLabels[method] || method
      const contactValue = data.contactValue || data.email || "N/A"

      message = [
        `*Новая заявка с сайта*`,
        ``,
        `*Имя:* ${esc(data.name)}`,
        `*Способ связи:* ${contactLabel}`,
        `*Контакт:* ${esc(contactValue)}`,
        data.projectType ? `*Тип:* ${projectTypeLabels[data.projectType] || data.projectType}` : null,
        data.budget ? `*Бюджет:* ${budgetLabels[data.budget] || data.budget}` : null,
        ``,
        `*Сообщение:*`,
        esc(data.message || "\\-"),
        attributionBlock(data),
        ``,
        `_${ts()}_`,
      ].filter(Boolean).join("\n")

    } else if (type === "quick_form") {
      message = [
        `*Быстрая заявка \\(FloatingCTA\\)*`,
        ``,
        `*Имя:* ${esc(data.name)}`,
        `*Контакт:* ${esc(data.contact)}`,
        data.type ? `*Тип:* ${projectTypeLabels[data.type] || data.type}` : null,
        data.message ? `*Сообщение:* ${esc(data.message)}` : null,
        attributionBlock(data),
        ``,
        `_${ts()}_`,
      ].filter(Boolean).join("\n")

    } else if (type === "chat_started") {
      message = [
        `*Новый диалог в чате*`,
        ``,
        `*Session:* \`${data.sessionId}\``,
        `*Вопрос:* ${esc(data.message)}`,
        ``,
        `_${ts()}_`,
      ].join("\n")

      replyMarkup = {
        inline_keyboard: [[
          { text: "Подключиться к диалогу", callback_data: `connect:${data.sessionId}` },
        ]],
      }

    } else if (type === "chat_message") {
      message = [
        `*Сообщение в чате*`,
        `*Session:* \`${data.sessionId}\``,
        `${esc(data.message)}`,
      ].join("\n")
    }

    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "MarkdownV2",
          ...(Object.keys(replyMarkup).length > 0 && { reply_markup: replyMarkup }),
        }),
      }
    )

    const result = await res.json()

    if (!result.ok) {
      console.error("Telegram API error:", result)
      // Fallback: try without parse_mode
      await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message.replace(/[\\*_`]/g, ""),
            ...(Object.keys(replyMarkup).length > 0 && { reply_markup: replyMarkup }),
          }),
        }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram send error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

function esc(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&")
}

/**
 * Builds a compact "откуда пришёл" block for the operator. Returns null when
 * there is no attribution data so it gets filtered out of the message.
 */
function attributionBlock(data: Record<string, unknown>): string | null {
  const src = typeof data.utmSource === "string" ? data.utmSource : ""
  const campaign = typeof data.utmCampaign === "string" ? data.utmCampaign : ""
  const term = typeof data.utmTerm === "string" ? data.utmTerm : ""
  const yclid = typeof data.yclid === "string" ? data.yclid : ""

  if (!src && !campaign && !term && !yclid) return null

  const lines = [``, `*Источник:*`]
  if (src) lines.push(`• utm\\_source: ${esc(src)}`)
  if (campaign) lines.push(`• Кампания: ${esc(campaign)}`)
  if (term) lines.push(`• Ключ: ${esc(term)}`)
  if (yclid) lines.push(`• yclid: \`${esc(yclid)}\``)
  return lines.join("\n")
}

function ts(): string {
  return new Date().toLocaleString("ru-RU", { timeZone: "Europe/Minsk" }).replace(/[.]/g, "\\.")
}
