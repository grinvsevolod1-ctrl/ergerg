/**
 * NetNext AI Chat API
 * AI-ассистент для главной страницы NetNext
 * - Помогает посетителям, рассказывает об услугах
 * - Рекламирует Nexik
 * - Сохраняет реакции для обучения
 * - Запоминает контекст разговора
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'
import { query, execute } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

interface AIRequestBody {
  sessionId?: string
  visitorId?: string
  message: string
  conversationHistory?: Array<{ role: string; content: string }>
  previousMessages?: Array<{ role: string; content: string }>
  context?: {
    page?: string
    referrer?: string
  }
  stream?: boolean
}

interface FeedbackBody {
  messageId: string
  reaction: 'like' | 'dislike'
  visitorId?: string
}

// Персона AI-ассистента NetNext
const NETNEXT_PERSONA = `Ты — Nexik, AI-ассистент белорусской веб-студии NetNext (netnext.site).

═══ ГЛАВНОЕ ПРАВИЛО — ЯЗЫК ═══
Отвечай ТОЛЬКО на русском языке. Никогда не переключайся на английский, китайский или другие языки — даже если так проще. Это правило без исключений.

═══ КАК ТЫ ОБЩАЕШЬСЯ ═══
- Дружелюбно, по-человечески, без канцелярита.
- Кратко: 2-4 предложения. Списки — маркерами «•», если перечисляешь.
- Один ответ = одна мысль + один следующий шаг (вопрос или предложение).
- Всегда веди к целевому действию: бесплатная консультация или заявка в чате.
- Не выдумывай факты, которых нет ниже. Не знаешь — честно скажи и предложи позвать живого менеджера.
- Цены называй в белорусских рублях (BYN). Никаких тенге, долларов и рублей РФ.

═══ О КОМПАНИИ ═══
NetNext — веб-студия из Минска (Беларусь). Делаем сайты, веб- и мобильные приложения, AI-решения и ведём рекламу. Работаем по договору с клиентами из Беларуси, СНГ и Европы.

═══ ГЛАВНЫЙ ОФФЕР (упоминай при вопросах о сайтах/лендингах/цене) ═══
🔥 АКЦИЯ МЕСЯЦА: продающий лендинг под ключ за 600 BYN вместо 1200 BYN (выгода 50%).
В стоимость входит: дизайн и адаптив под все устройства, тексты, формы заявок, подключение аналитики, запуск за 5 дней. Без скрытых доплат.

═══ УСЛУГИ И ЦЕНЫ (в BYN) ═══
• Лендинг — от 1200 BYN (сейчас по акции 600 BYN), запуск за 5 дней
• Корпоративный сайт — от 2500 BYN, 3-5 недель
• Интернет-магазин — от 5000 BYN, 6-10 недель
• Веб- или мобильное приложение — от 8000 BYN, от 2 месяцев
• UI/UX дизайн, SEO-продвижение, контекстная реклама (Яндекс Директ, Google Ads) — обсуждаем индивидуально
Точную смету называем после короткого брифа на бесплатной консультации.

═══ NEXIK — НАШ AI-ПРОДУКТ ═══
Если спрашивают про чат-ботов, AI или автоматизацию общения с клиентами — рекомендуй Nexik:
• Отвечает клиентам 24/7 за секунды
• Принимает заявки и записывает на услуги
• Обучается на данных конкретного бизнеса
• Подключается к сайту, Telegram и CRM
Демо можно попробовать на странице /nexik.

═══ КОНТАКТЫ ═══
Email: hello@netnext.site · Telegram: @netnext_team · Телефон: +375 (29) 14-14-555.
Живой менеджер на связи 10:00-20:00 по Минску. Если клиент просит человека — спокойно скажи, что подключаешь оператора.`

// Fallback ответы если AI недоступен
const FALLBACK_RESPONSES: Record<string, string> = {
  greeting: 'Привет! Я Nexik — AI-ассистент студии NetNext. Помогу с услугами, ценами и запишу на бесплатную консультацию. Что вас интересует?',
  services: `Мы делаем:\n• Сайты — лендинги, корпоративные, интернет-магазины\n• Веб- и мобильные приложения\n• UI/UX дизайн и SEO\n• Контекстную рекламу (Яндекс Директ, Google Ads)\n• AI-ассистента Nexik для бизнеса\n\nЧто из этого обсудим подробнее?`,
  prices: `Ориентировочные цены в BYN:\n• Лендинг — от 1200 BYN (сейчас по акции 600 BYN)\n• Корпоративный сайт — от 2500 BYN\n• Интернет-магазин — от 5000 BYN\n• Приложение — от 8000 BYN\n\nТочную смету посчитаем на бесплатной консультации. Записать вас?`,
  promo: `🔥 Акция месяца: лендинг под ключ за 600 BYN вместо 1200 BYN.\nВходит дизайн, адаптив, тексты, формы заявок и аналитика. Запуск за 5 дней.\n\nХотите оформить заявку прямо здесь?`,
  nexik: `Nexik — наш AI-ассистент для бизнеса:\n• Отвечает клиентам 24/7\n• Принимает заявки и записывает на услуги\n• Обучается под ваш бизнес\n• Работает на сайте и в Telegram\n\nПопробуйте демо на /nexik!`,
  consultation: 'Отлично! Оставьте имя и контакт (телефон или Telegram) — менеджер свяжется в течение часа в рабочее время.',
  operator: 'Сейчас подключу живого менеджера. Обычно отвечаем за 2-5 минут в рабочее время (10:00-20:00 по Минску).',
  default: 'Я Nexik — AI-ассистент NetNext. Расскажу про услуги и цены, запишу на бесплатную консультацию. А ещё у нас акция: лендинг за 600 BYN. Что обсудим?'
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  
  if (/привет|здравств|добр|хай|hello|салам/i.test(lower)) return 'greeting'
  if (/акци|600|лендинг|landing|одностранич|скидк|выгод/i.test(lower)) return 'promo'
  if (/услуг|делает|предлагает|умеете|можете|занимает/i.test(lower)) return 'services'
  if (/цен|стоим|скольк|прайс|бюджет|тариф/i.test(lower)) return 'prices'
  if (/nexik|нексик|ai.?бот|чат.?бот|ассистент|автоматиз/i.test(lower)) return 'nexik'
  if (/консультац|запис|встреч|позвон|связ|заказ/i.test(lower)) return 'consultation'
  if (/оператор|человек|менеджер|живой/i.test(lower)) return 'operator'
  
  return 'general'
}

// Generate unique message ID for feedback tracking
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limit
    const rateLimitResponse = await rateLimiters.chat(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const body: AIRequestBody = await request.json()
    const { message, conversationHistory = [], previousMessages = [], visitorId, stream = false } = body
    
    // Use either conversationHistory or previousMessages
    const history = conversationHistory.length > 0 ? conversationHistory : previousMessages

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const intent = detectIntent(message)
    const messageId = generateMessageId()
    
    // Build messages for AI
    const messages = [
      ...history.slice(-6).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Try AI with timeout
    try {
      const aiResult = await Promise.race([
        routedChat(
          'simple',
          messages,
          {
            // Do NOT hardcode the model here. Each server defines its own model
            // via the AI_SERVERS env var; forcing a model name that isn't
            // installed on the selected server makes Ollama return 404
            // "model not found" and the chat falls back to a canned reply.
            // Leaving model undefined lets routedChat use the selected
            // server's own defaultModel.
            system: NETNEXT_PERSONA,
            temperature: 0.7,
            maxTokens: 250
          }
        ),
        new Promise<never>((_, reject) => 
          // Cloud / "pro" models can be slower on the first token, so allow
          // more headroom before falling back to the canned reply.
          setTimeout(() => reject(new Error('timeout')), 25000)
        )
      ])

      const responseText = aiResult.response

      // Save interaction for learning (async, don't wait)
      saveInteraction(visitorId, message, responseText, intent, 'ai').catch(() => {})

      // Streaming response
      if (stream) {
        const encoder = new TextEncoder()
        const words = responseText.split(' ')
        
        const readable = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              controller.enqueue(encoder.encode(word + ' '))
              await new Promise(r => setTimeout(r, 20 + Math.random() * 10))
            }
            controller.close()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Message-Id': messageId
          },
        })
      }

      return NextResponse.json({
        response: responseText,
        messageId,
        source: 'ai',
        intent,
        timeMs: Date.now() - startTime
      })

    } catch {
      // AI timeout or error - use fallback
      const fallback = FALLBACK_RESPONSES[intent] || FALLBACK_RESPONSES.default

      // Save fallback interaction
      saveInteraction(visitorId, message, fallback, intent, 'fallback').catch(() => {})

      if (stream) {
        const encoder = new TextEncoder()
        const words = fallback.split(' ')
        
        const readable = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              controller.enqueue(encoder.encode(word + ' '))
              await new Promise(r => setTimeout(r, 25 + Math.random() * 15))
            }
            controller.close()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Message-Id': messageId
          },
        })
      }

      return NextResponse.json({
        response: fallback,
        messageId,
        source: 'fallback',
        intent,
        timeMs: Date.now() - startTime
      })
    }

  } catch (error) {
    console.error('[NetNext Chat] Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: 'Произошла ошибка. Попробуйте ещё раз или напишите на hello@netnext.site'
      },
      { status: 500 }
    )
  }
}

// Handle feedback (likes/dislikes) for learning
export async function PATCH(request: NextRequest) {
  try {
    const body: FeedbackBody = await request.json()
    const { messageId, reaction, visitorId } = body

    if (!messageId || !reaction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Save feedback for learning
    await saveFeedback(messageId, reaction, visitorId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[NetNext Chat] Feedback error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

// Save interaction to database for learning
async function saveInteraction(
  visitorId: string | undefined,
  userMessage: string,
  aiResponse: string,
  intent: string,
  source: string
) {
  try {
    await execute(
      `INSERT INTO netnext_chat_logs (visitor_id, user_message, ai_response, intent, source, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [visitorId || 'anonymous', userMessage, aiResponse, intent, source]
    )
  } catch (error) {
    console.error('[NetNext Chat] Failed to save interaction:', error)
  }
}

// Save feedback for learning
async function saveFeedback(messageId: string, reaction: string, visitorId?: string) {
  try {
    await execute(
      `INSERT INTO netnext_chat_feedback (message_id, reaction, visitor_id, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [messageId, reaction, visitorId || 'anonymous']
    )
  } catch (error) {
    console.error('[NetNext Chat] Failed to save feedback:', error)
  }
}
