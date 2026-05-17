/**
 * Nexik Chat API for External Clients
 * Smart responses: templates for common questions, AI for complex ones
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

interface ChatRequestBody {
  clientId: string
  sessionId: string
  message: string
  context?: {
    companyName?: string
    assistantName?: string
    isConnectedToOperator?: boolean
  }
  previousMessages?: Array<{ role: string; content: string }>
}

interface TemplateMatch {
  matched: boolean
  response?: string
  category?: string
}

// Template patterns for common questions (no AI needed)
const TEMPLATE_PATTERNS = [
  // Greetings
  {
    patterns: ['привет', 'здравств', 'добр', 'хай', 'hello', 'hi ', 'hey'],
    category: 'greeting',
    getResponse: (assistant: string) => 
      `Привет! Рад вас видеть! Я ${assistant}. Чем могу помочь сегодня?`
  },
  // Thanks
  {
    patterns: ['спасибо', 'благодар', 'thanks', 'thank you'],
    category: 'thanks',
    getResponse: () => 
      'Пожалуйста! Рад был помочь. Если возникнут ещё вопросы — обращайтесь!'
  },
  // Goodbye
  {
    patterns: ['пока', 'до свидан', 'всего доброго', 'goodbye', 'bye'],
    category: 'goodbye',
    getResponse: () => 
      'До свидания! Буду рад помочь снова. Хорошего дня!'
  },
  // Request operator
  {
    patterns: ['оператор', 'человек', 'менеджер', 'живой', 'позвать', 'operator', 'human', 'agent'],
    category: 'operator',
    getResponse: () => 
      'Понял, сейчас подключу оператора!\n\nПожалуйста, подождите — среднее время ожидания 1-2 минуты.\n\nПока ждёте, можете описать свой вопрос подробнее.'
  },
  // Consultation/booking
  {
    patterns: ['консультац', 'запис', 'встреч', 'заявк', 'звонок', 'перезвон', 'book', 'appointment', 'schedule'],
    category: 'consultation',
    getResponse: () => 
      'Отлично! Оставьте ваши контактные данные и мы свяжемся с вами в ближайшее время.\n\nЧто вам удобнее — телефон или email?'
  },
  // Working hours
  {
    patterns: ['график', 'работаете', 'часы работы', 'время работы', 'открыты', 'working hours', 'open'],
    category: 'hours',
    getResponse: () => 
      'Наши операторы работают с 9:00 до 18:00 по будням.\n\nНо AI-ассистент доступен 24/7 и может ответить на большинство вопросов!'
  },
  // Contact info
  {
    patterns: ['контакт', 'телефон', 'позвонить', 'номер', 'email', 'почта', 'contact', 'phone'],
    category: 'contact',
    getResponse: () => 
      'Вы можете связаться с нами:\n\n- Телефон: указан на сайте\n- Email: через форму обратной связи\n- Или напишите здесь — оператор ответит в рабочее время!'
  },
]

// Check if message matches a template
function matchTemplate(message: string, assistantName: string): TemplateMatch {
  const lowerMessage = message.toLowerCase().trim()
  
  // Very short messages (< 3 chars) - just respond politely
  if (lowerMessage.length < 3) {
    return {
      matched: true,
      response: `Я ${assistantName}, AI-ассистент. Напишите ваш вопрос, и я постараюсь помочь!`,
      category: 'short'
    }
  }
  
  for (const template of TEMPLATE_PATTERNS) {
    if (template.patterns.some(p => lowerMessage.includes(p))) {
      return {
        matched: true,
        response: template.getResponse(assistantName),
        category: template.category
      }
    }
  }
  
  return { matched: false }
}

// Generate AI response for complex questions
async function generateAIResponse(
  message: string, 
  assistantName: string, 
  companyName: string,
  previousMessages?: Array<{ role: string; content: string }>
): Promise<string> {
  try {
    // Try to use the AI router
    const { generateResponse } = await import('@/lib/ai/router')
    
    const result = await generateResponse(message, {
      companyName,
      companyDescription: `AI-ассистент ${assistantName} для компании ${companyName}`,
      useRAG: true,
      previousMessages: previousMessages?.slice(-5).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    })
    
    return result.text
  } catch (error) {
    console.error('[Nexik Chat] AI generation error:', error)
    // Fallback to helpful generic response
    return getFallbackResponse(message, assistantName, companyName)
  }
}

// Intelligent fallback when AI is unavailable
function getFallbackResponse(message: string, assistantName: string, companyName: string): string {
  const lowerMessage = message.toLowerCase()
  
  // Price-related questions
  if (lowerMessage.includes('цен') || lowerMessage.includes('стоим') || lowerMessage.includes('скольк') || lowerMessage.includes('price') || lowerMessage.includes('cost')) {
    return `Стоимость зависит от ваших требований и объёма работ.\n\nДля точной оценки оставьте заявку — наш менеджер свяжется с вами и обсудит детали.\n\nХотите записаться на бесплатную консультацию?`
  }
  
  // Service-related questions
  if (lowerMessage.includes('услуг') || lowerMessage.includes('делает') || lowerMessage.includes('предлага') || lowerMessage.includes('service')) {
    return `Я ${assistantName} — AI-ассистент ${companyName}.\n\nЯ могу помочь вам:\n- Узнать об услугах компании\n- Рассчитать примерную стоимость\n- Записать на консультацию\n- Подключить оператора\n\nЧто вас интересует?`
  }
  
  // Default helpful response
  return `Спасибо за вопрос! Я ${assistantName} — AI-ассистент ${companyName}.\n\nЯ анализирую ваш запрос. Если вам нужен более развёрнутый ответ, могу подключить оператора.\n\nЧем ещё могу помочь?`
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function POST(request: NextRequest) {
  try {
    // Rate limit for chat
    const rateLimitResponse = await rateLimiters.chat(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const body: ChatRequestBody = await request.json()
    const { clientId, message, context, previousMessages } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    const companyName = context?.companyName || 'Company'
    const assistantName = context?.assistantName || 'Nexik'
    
    // First, try to match a template (fast, no AI needed)
    const templateMatch = matchTemplate(message, assistantName)
    
    if (templateMatch.matched && templateMatch.response) {
      // Small delay for natural feel
      await delay(300 + Math.random() * 200)
      
      console.log(`[Nexik Chat] Template match: ${templateMatch.category}`)
      
      return NextResponse.json({
        text: templateMatch.response,
        source: 'template',
        category: templateMatch.category,
        clientId,
        buttons: [],
      })
    }
    
    // Complex question - use AI
    // Longer delay to simulate AI thinking
    await delay(800 + Math.random() * 600)
    
    const responseText = await generateAIResponse(
      message, 
      assistantName, 
      companyName,
      previousMessages
    )
    
    console.log(`[Nexik Chat] AI response generated for: "${message.substring(0, 50)}..."`)

    return NextResponse.json({
      text: responseText,
      source: 'ai',
      clientId,
      buttons: [],
    })

  } catch (error) {
    console.error('[Nexik Chat API error]', error)
    return NextResponse.json(
      { 
        error: 'Chat temporarily unavailable',
        text: 'Извините, произошла ошибка. Попробуйте ещё раз.',
      },
      { status: 500 }
    )
  }
}

// GET - health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'nexik-chat',
    version: '2.0.0',
  })
}
