/**
 * NetNext AI Chat API
 * AI-ассистент для главной страницы NetNext
 * Помогает посетителям, рассказывает об услугах, рекламирует Nexik
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'

export const runtime = 'nodejs'
export const maxDuration = 30

interface AIRequestBody {
  sessionId?: string
  message: string
  conversationHistory?: Array<{ role: string; content: string }>
  previousMessages?: Array<{ role: string; content: string }>
  context?: {
    companyName?: string
    companyDescription?: string
    assistantName?: string
  }
  stream?: boolean
}

// Персона AI-ассистента NetNext
const NETNEXT_PERSONA = `Ты — AI-ассистент компании NetNext.

О КОМПАНИИ NETNEXT:
NetNext — современная веб-студия, которая создаёт сайты, веб-приложения и цифровые решения для бизнеса.

УСЛУГИ:
- Разработка сайтов (лендинги, корпоративные сайты, интернет-магазины)
- Веб-приложения любой сложности
- UI/UX дизайн и брендинг
- SEO-оптимизация и продвижение
- Техническая поддержка 24/7
- Интеграции с CRM, платёжными системами

ПРИМЕРНЫЕ ЦЕНЫ:
- Landing page: от $500
- Корпоративный сайт: от $1,500
- Интернет-магазин: от $3,000
- Веб-приложение: от $5,000

NEXIK — НАШ ФЛАГМАНСКИЙ ПРОДУКТ:
Nexik — это AI-ассистент для бизнеса, который можно установить на любой сайт.
- Отвечает клиентам 24/7 за секунды
- Записывает на услуги и консультации
- Собирает заявки и контакты
- Обучается на данных бизнеса
- Интегрируется с CRM
Nexik можно попробовать прямо сейчас на странице /nexik

ТВОЙ СТИЛЬ:
- Дружелюбный, профессиональный, но не формальный
- Отвечаешь по-русски
- Кратко и по делу (2-4 предложения обычно)
- Если спрашивают про AI/чат-боты — рекомендуй Nexik
- Можешь предложить записать на бесплатную консультацию
- Не выдумывай информацию которой нет выше`

// Fallback ответы если AI недоступен
const FALLBACK_RESPONSES: Record<string, string> = {
  greeting: 'Привет! Я AI-ассистент NetNext. Могу рассказать об услугах, ценах, или записать на консультацию. Чем помочь?',
  services: `Мы делаем:
• Сайты (лендинги, корпоративные, магазины)
• Веб-приложения
• UI/UX дизайн
• SEO и поддержку

А ещё у нас есть Nexik — AI-ассистент для бизнеса. Хотите узнать подробнее?`,
  prices: `Примерные цены:
• Landing page: от $500
• Корпоративный сайт: от $1,500
• Интернет-магазин: от $3,000
• Веб-приложение: от $5,000

Для точной оценки могу записать на бесплатную консультацию!`,
  nexik: `Nexik — наш AI-ассистент для бизнеса:
• Отвечает клиентам 24/7
• Записывает на услуги
• Собирает заявки
• Обучается под ваш бизнес

Попробуйте демо на /nexik или спросите меня подробнее!`,
  consultation: 'Отлично! Для записи на бесплатную консультацию оставьте имя и контакт (телефон или email). Наш специалист свяжется в удобное время.',
  default: 'Я AI-ассистент NetNext. Могу рассказать об услугах, ценах, записать на консультацию. Также рекомендую посмотреть Nexik — наш AI-продукт для бизнеса!'
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()
  
  if (/привет|здравств|добр|хай|hello/i.test(lower)) return 'greeting'
  if (/услуг|делает|предлагает|умеете|можете/i.test(lower)) return 'services'
  if (/цен|стоим|скольк|прайс|бюджет/i.test(lower)) return 'prices'
  if (/nexik|нексик|ai.?бот|чат.?бот|ассистент/i.test(lower)) return 'nexik'
  if (/консультац|запис|встреч|позвон|связ/i.test(lower)) return 'consultation'
  
  return 'general'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limit
    const rateLimitResponse = await rateLimiters.chat(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const body: AIRequestBody = await request.json()
    const { message, conversationHistory = [], previousMessages = [], stream = false } = body
    
    // Use either conversationHistory or previousMessages
    const history = conversationHistory.length > 0 ? conversationHistory : previousMessages

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const intent = detectIntent(message)
    
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
            maxTokens: 200
          }
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 12000)
        )
      ])

      const responseText = aiResult.response

      // Streaming response
      if (stream) {
        const encoder = new TextEncoder()
        const words = responseText.split(' ')
        
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
          },
        })
      }

      return NextResponse.json({
        response: responseText,
        source: 'ai',
        intent,
        timeMs: Date.now() - startTime
      })

    } catch {
      // AI timeout or error - use fallback
      const fallback = FALLBACK_RESPONSES[intent] || FALLBACK_RESPONSES.default

      if (stream) {
        const encoder = new TextEncoder()
        const words = fallback.split(' ')
        
        const readable = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              controller.enqueue(encoder.encode(word + ' '))
              await new Promise(r => setTimeout(r, 30 + Math.random() * 20))
            }
            controller.close()
          }
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
          },
        })
      }

      return NextResponse.json({
        response: fallback,
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
