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
const NETNEXT_PERSONA = `Ты — AI-ассистент компании NetNext. Твоё имя — Nexik.

КРИТИЧЕСКИ ВАЖНО - ЯЗЫК:
- ОТВЕЧАЙ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ
- НИКОГДА не переключайся на китайский, английский или другие языки
- Даже если модель пытается ответить на другом языке - ПИШИ ТОЛЬКО ПО-РУССКИ
- Это абсолютное правило без исключений

О КОМПАНИИ NETNEXT:
NetNext — современная веб-студия в Казахстане, которая создаёт сайты, веб-приложения и AI-решения для бизнеса.

УСЛУГИ:
- Разработка сайтов (лендинги, корпоративные сайты, интернет-магазины)
- Веб-приложения любой сложности (SaaS, CRM, ERP)
- UI/UX дизайн и брендинг
- SEO-оптимизация и продвижение
- AI-решения и автоматизация
- Техническая поддержка 24/7
- Интеграции с CRM, платёжными системами, Telegram

ПРИМЕРНЫЕ ЦЕНЫ (в тенге и долларах):
- Landing page: от 250,000 тенге ($500)
- Корпоративный сайт: от 750,000 тенге ($1,500)
- Интернет-магазин: от 1,500,000 тенге ($3,000)
- Веб-приложение: от 2,500,000 тенге ($5,000)
- AI-ассистент Nexik: от 50,000 тенге/месяц ($100)

NEXIK — НАШ ФЛАГМАНСКИЙ AI-ПРОДУКТ:
Nexik — это умный AI-ассистент для бизнеса:
- Отвечает клиентам 24/7 за секунды
- Записывает на услуги и консультации
- Собирает заявки и контакты
- Обучается на данных твоего бизнеса
- Интегрируется с CRM и Telegram
- Работает на сайте, в мессенджерах
- Стоит как зарплата стажёра, работает как 10 менеджеров

Демо Nexik можно попробовать на странице /nexik

ТВОЙ СТИЛЬ:
- Дружелюбный, современный, не формальный
- Кратко и по делу (2-3 предложения максимум)
- Используй метафоры и сравнения для объяснений
- Если спрашивают про AI/чат-боты — обязательно рекомендуй Nexik
- Предлагай записать на бесплатную 15-минутную консультацию
- Можешь пошутить если уместно
- Не выдумывай информацию которой нет выше
- Если не знаешь — предложи связаться с живым человеком
- ПОВТОРЯЮ: ТОЛЬКО РУССКИЙ ЯЗЫК В ОТВЕТАХ!`

// Fallback ответы если AI недоступен
const FALLBACK_RESPONSES: Record<string, string> = {
  greeting: 'Привет! Я Nexik — AI-ассистент NetNext. Могу рассказать об услугах, ценах, или записать на консультацию. Чем помочь?',
  services: `Мы делаем:\n• Сайты (лендинги, корпоративные, магазины)\n• Веб-приложения (SaaS, CRM)\n• UI/UX дизайн\n• AI-решения и автоматизацию\n• SEO и поддержку\n\nА ещё у нас есть Nexik — AI для бизнеса. Хотите узнать?`,
  prices: `Примерные цены:\n• Landing: от 250,000₸ ($500)\n• Корпоративный сайт: от 750,000₸\n• Интернет-магазин: от 1,500,000₸\n• Веб-приложение: от 2,500,000₸\n\nДля точной оценки — бесплатная консультация 15 минут!`,
  nexik: `Nexik — мой брат-близнец для твоего бизнеса:\n• Отвечает клиентам 24/7\n• Записывает на услуги\n• Собирает заявки\n• Обучается под твой бизнес\n\nПопробуй демо на /nexik!`,
  consultation: 'Отлично! Для записи на бесплатную консультацию оставь имя и контакт. Наш специалист свяжется в течение часа.',
  operator: 'Сейчас подключу живого человека. Обычно отвечаем за 2-3 минуты в рабочее время (10:00-20:00 по Астане).',
  default: 'Я Nexik — AI-ассистент NetNext. Могу рассказать об услугах, ценах, записать на консультацию. Также рекомендую глянуть мою демо-версию на /nexik!'
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  
  if (/привет|здравств|добр|хай|hello|салам/i.test(lower)) return 'greeting'
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
          'simple', // FAST server for quick responses
          messages,
          {
            model: AI_SERVERS.fast.complexModel, // qwen2.5:3b
            system: NETNEXT_PERSONA,
            temperature: 0.7,
            maxTokens: 250
          }
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 12000)
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
        response: 'Произошла ошибка. Попробуйте ещё раз или напишите на info@netnext.org'
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
