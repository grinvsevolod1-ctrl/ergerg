import { NextRequest, NextResponse } from "next/server"
import {
  createSession,
  connectOperator,
  disconnectOperator,
  addMessage,
  getActiveOperatorSessions,
  isOperatorConnected as checkOperatorConnected,
  getUndeliveredMessages,
  markMessagesDelivered,
} from "@/lib/db/chat"

/**
 * Telegram Webhook Handler
 * Uses PostgreSQL for session storage - works on both VPS and serverless.
 * Sessions persist across restarts and are shared with Python bot.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const OWNER_CHAT_ID = process.env.TELEGRAM_CHAT_ID

// ---- Webhook handler ----
export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // Handle callback query (button press in Telegram)
    if (update.callback_query) {
      const data = update.callback_query.data as string

      if (data.startsWith("connect:")) {
        const sessionId = data.replace("connect:", "")

        // Connect operator to session
        await connectOperator(sessionId)

        await tgSend(
          OWNER_CHAT_ID!,
          `*Подключено к диалогу*\n\nSession: \`${sessionId}\`\n\nВсё что вы напишете — уйдёт пользователю на сайт.\nДля отключения: /disconnect ${sessionId}`
        )
      }

      // Answer callback to remove loading spinner
      await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: update.callback_query.id }),
        }
      )

      return NextResponse.json({ ok: true })
    }

    // Handle text message from operator
    if (update.message?.text) {
      const chatId = String(update.message.chat.id)
      const text = update.message.text as string

      // Only process messages from owner
      if (chatId !== OWNER_CHAT_ID) {
        return NextResponse.json({ ok: true })
      }

      // Command: /disconnect [sessionId]
      if (text.startsWith("/disconnect")) {
        const sessionId = text.split(" ")[1]
        
        if (sessionId) {
          await disconnectOperator(sessionId)
          await tgSend(chatId, `*Отключено от сессии* \`${sessionId}\``)
        } else {
          // Disconnect from all sessions
          const sessions = await getActiveOperatorSessions()
          for (const session of sessions) {
            await disconnectOperator(session.id)
          }
          await tgSend(chatId, `*Отключено от ${sessions.length} сессий*`)
        }
        return NextResponse.json({ ok: true })
      }

      // Command: /status
      if (text === "/status") {
        const sessions = await getActiveOperatorSessions()
        const sessionList = sessions.map(s => `\`${s.id}\` (${s.user_type})`).join("\n")
        await tgSend(
          chatId,
          `*Статус:*\nАктивных подключений: ${sessions.length}${sessionList ? "\n" + sessionList : ""}`
        )
        return NextResponse.json({ ok: true })
      }

      // Command: help
      if (text.startsWith("/")) {
        await tgSend(
          chatId,
          "Доступные команды:\n/disconnect [id] — отключиться от чата\n/status — показать активные сессии"
        )
        return NextResponse.json({ ok: true })
      }

      // Forward message to connected sessions
      const sessions = await getActiveOperatorSessions()
      
      if (sessions.length === 0) {
        await tgSend(chatId, "Вы не подключены к диалогу. Нажмите кнопку \"Подключиться\" в уведомлении о чате.")
        return NextResponse.json({ ok: true })
      }

      // Send to all connected sessions
      for (const session of sessions) {
        await addMessage(session.id, "operator", text)
      }

      await tgSend(chatId, `_Отправлено в ${sessions.length} сессий_`)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ ok: true }) // Always 200 for Telegram
  }
}

// ---- Helper functions ----
async function tgSend(chatId: string, text: string) {
  if (!BOT_TOKEN || !chatId) return
  
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  })
}

// ---- Exports for polling endpoint ----
export async function getOperatorMessages(sessionId: string): Promise<string[]> {
  const messages = await getUndeliveredMessages(sessionId, "operator")
  
  if (messages.length > 0) {
    await markMessagesDelivered(messages.map(m => m.id))
  }
  
  return messages.map(m => m.message)
}

export async function isOperatorConnected(sessionId: string): Promise<boolean> {
  return checkOperatorConnected(sessionId)
}

// Export createSession for use in chat routes
export { createSession, addMessage }
