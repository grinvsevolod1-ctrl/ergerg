/**
 * Nexik AI Chat API
 * Endpoint для AI-ответов с демо-режимом (без БД)
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

interface AIRequestBody {
  sessionId: string
  message: string
  context?: {
    companyName?: string
    companyDescription?: string
  }
  stream?: boolean
}

// Демо-ответы для разных тем
const DEMO_RESPONSES: Record<string, string> = {
  услуги: `Мы предлагаем полный спектр веб-услуг:

**Разработка сайтов**
- Landing pages и корпоративные сайты
- Интернет-магазины и маркетплейсы
- Веб-приложения любой сложности

**Дизайн**
- UI/UX дизайн
- Брендинг и айдентика
- Прототипирование

**Поддержка**
- Техническая поддержка 24/7
- SEO-оптимизация
- Интеграции с внешними сервисами

Хотите узнать подробнее о каком-то направлении?`,

  цена: `Стоимость проекта зависит от его сложности и требований.

**Примерные цены:**
- Landing page: от $500
- Корпоративный сайт: от $1,500
- Интернет-магазин: от $3,000
- Веб-приложение: от $5,000

Для точной оценки мне нужно узнать:
1. Тип проекта
2. Основные функции
3. Желаемые сроки

Могу записать вас на бесплатную консультацию!`,

  консультация: `Отлично! Я могу записать вас на бесплатную консультацию.

**Как это работает:**
1. Вы выбираете удобное время
2. Наш специалист связывается с вами
3. Обсуждаете проект и получаете оценку

**Для записи мне нужно:**
- Ваше имя
- Контактный телефон или email
- Удобное время для звонка

Готовы оставить контакты?`,

  оператор: `Понял, сейчас подключу оператора!

Пожалуйста, подождите несколько секунд. В среднем время ожидания — 1-2 минуты.

Пока ждёте, можете описать свой вопрос подробнее — оператор сразу увидит эту информацию.`,

  default: `Спасибо за сообщение! Я Nexik — AI-ассистент NetNext.

Я могу помочь вам:
- Узнать об услугах компании
- Рассчитать примерную стоимость проекта
- Записать на консультацию
- Подключить оператора

Чем могу помочь?`,
}

// Простой поиск релевантного ответа
function findResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('услуг') || lowerMessage.includes('делает') || lowerMessage.includes('предлага')) {
    return DEMO_RESPONSES.услуги
  }
  if (lowerMessage.includes('цен') || lowerMessage.includes('стоим') || lowerMessage.includes('скольк')) {
    return DEMO_RESPONSES.цена
  }
  if (lowerMessage.includes('консультац') || lowerMessage.includes('запис') || lowerMessage.includes('встреч')) {
    return DEMO_RESPONSES.консультация
  }
  if (lowerMessage.includes('оператор') || lowerMessage.includes('человек') || lowerMessage.includes('менеджер')) {
    return DEMO_RESPONSES.оператор
  }
  if (lowerMessage.includes('привет') || lowerMessage.includes('здравств') || lowerMessage.includes('добр')) {
    return 'Привет! Рад вас видеть! Я Nexik — AI-ассистент NetNext. Чем могу помочь сегодня?'
  }
  if (lowerMessage.includes('спасибо') || lowerMessage.includes('благодар')) {
    return 'Пожалуйста! Рад был помочь. Если возникнут ещё вопросы — обращайтесь!'
  }
  
  return DEMO_RESPONSES.default
}

// Имитация задержки для реалистичности
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  try {
    // Rate limit for AI chat
    const rateLimitResponse = await rateLimiters.chat(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const body: AIRequestBody = await request.json()
    const { message, stream = false } = body

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    // Имитация времени "думания" AI
    await delay(800 + Math.random() * 700)

    const responseText = findResponse(message)

    // Streaming ответ
    if (stream) {
      const encoder = new TextEncoder()
      const words = responseText.split(' ')
      
      const readable = new ReadableStream({
        async start(controller) {
          for (const word of words) {
            controller.enqueue(encoder.encode(word + ' '))
            await delay(30 + Math.random() * 20)
          }
          controller.close()
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // Обычный ответ
    return NextResponse.json({
      text: responseText,
      source: 'demo',
      buttons: [],
    })

  } catch (error) {
    console.error('[AI Chat API error]', error)
    return NextResponse.json(
      { 
        error: 'AI temporarily unavailable',
        text: 'Извините, произошла ошибка. Попробуйте ещё раз или свяжитесь с оператором.',
      },
      { status: 500 }
    )
  }
}
