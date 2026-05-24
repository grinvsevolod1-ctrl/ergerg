import { NextRequest, NextResponse } from 'next/server'
import { getAIResponse } from '@/lib/ai/router'

const ONBOARDING_STEPS = [
  'intro',     // 0 - Узнаём название и суть бизнеса
  'business',  // 1 - Детали: услуги, продукты, что делают
  'audience',  // 2 - Целевая аудитория
  'goals',     // 3 - Проблемы и цели
  'complete'   // 4 - Завершение
]

const STEP_PROMPTS: Record<number, string> = {
  0: `
Ты — Nexik, проводишь онбординг нового клиента. Сейчас первый этап: узнаёшь название бизнеса и чем они занимаются.

ТВОЯ ЗАДАЧА:
1. Из ответа пользователя извлечь: название бизнеса, тип бизнеса, краткое описание
2. Если информации достаточно — задай уточняющий вопрос про услуги/продукты
3. Если информации мало — попроси рассказать подробнее

СТИЛЬ: дружелюбный, заинтересованный, без канцелярита. Короткие ответы 2-3 предложения.
  `,
  1: `
Nexik онбординг, этап 2: узнаёшь про услуги и продукты.

ТВОЯ ЗАДАЧА:
1. Из ответа извлечь: список услуг/продуктов, уникальные преимущества
2. Поблагодарить и спросить про целевую аудиторию: кто их клиенты?

СТИЛЬ: дружелюбный, 2-3 предложения. Покажи что ты понял их бизнес.
  `,
  2: `
Nexik онбординг, этап 3: целевая аудитория.

ТВОЯ ЗАДАЧА:
1. Из ответа извлечь: описание ЦА, типичные клиенты
2. Спросить про проблемы: какие боли в бизнесе? Что хотелось бы улучшить?

СТИЛЬ: дружелюбный, 2-3 предложения.
  `,
  3: `
Nexik онбординг, этап 4: проблемы и цели.

ТВОЯ ЗАДАЧА:
1. Из ответа извлечь: проблемы бизнеса, цели, что хотят улучшить
2. Подвести итог и сказать как ты можешь помочь именно с этими задачами
3. Сообщить что онбординг завершён и ты готов работать!

СТИЛЬ: вдохновляющий, покажи ценность. 3-4 предложения.
  `
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { input, currentStep, collectedData, conversationHistory } = body

    if (!input || currentStep === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Build context for AI
    const stepPrompt = STEP_PROMPTS[currentStep] || STEP_PROMPTS[0]
    
    const systemPrompt = `
${stepPrompt}

ТЕКУЩИЙ ШАГ: ${currentStep + 1} из 4
СОБРАННЫЕ ДАННЫЕ: ${JSON.stringify(collectedData || {})}

ВАЖНО: 
- Отвечай ТОЛЬКО текстом ответа для пользователя
- НЕ пиши JSON, НЕ пиши инструкции
- Просто напиши что сказал бы человеку
    `.trim()

    // Get AI response
    const messages = [
      ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: input }
    ]

    const aiResponse = await getAIResponse({
      messages,
      systemPrompt,
      maxTokens: 300,
      temperature: 0.7
    })

    // Extract data based on step
    const extractedData = extractDataFromInput(input, currentStep, collectedData)
    
    // Determine next step
    let nextStep = currentStep
    let isComplete = false

    // Simple progression logic - move to next step if we got useful data
    if (extractedData && Object.keys(extractedData).length > 0) {
      if (currentStep < 3) {
        nextStep = currentStep + 1
      } else if (currentStep === 3) {
        nextStep = 4
        isComplete = true
      }
    }

    // Build final data if complete
    let finalData = null
    if (isComplete) {
      finalData = {
        ...collectedData,
        ...extractedData
      }
    }

    return NextResponse.json({
      response: aiResponse,
      extractedData,
      nextStep,
      isComplete,
      finalData
    })

  } catch (error) {
    console.error('[Onboarding Process] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple extraction - in production use AI for this
function extractDataFromInput(
  input: string, 
  step: number, 
  existing: Record<string, unknown>
): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  const text = input.toLowerCase()

  switch (step) {
    case 0: // Business name and type
      // Try to extract business name (usually at the start)
      const words = input.split(/[,.\n]/).map(s => s.trim()).filter(Boolean)
      if (words[0] && words[0].length < 100) {
        data.businessName = words[0]
      }
      // Extract type if mentioned
      const types = ['магазин', 'салон', 'студия', 'агентство', 'компания', 'сервис', 'клиника', 'школа', 'кафе', 'ресторан']
      for (const t of types) {
        if (text.includes(t)) {
          data.businessType = t
          break
        }
      }
      if (input.length > 20) {
        data.description = input
      }
      break

    case 1: // Services
      const services = input.split(/[,\n]/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 100)
      if (services.length > 0) {
        data.services = services.slice(0, 10)
      }
      break

    case 2: // Target audience  
      if (input.length > 10) {
        data.targetAudience = input
      }
      break

    case 3: // Pain points and goals
      const painKeywords = ['проблема', 'сложно', 'не хватает', 'нужно', 'хочу', 'хотим']
      const goalKeywords = ['увеличить', 'улучшить', 'автоматизировать', 'больше', 'рост']
      
      const painPoints: string[] = []
      const goals: string[] = []
      
      const sentences = input.split(/[.!?]/).map(s => s.trim()).filter(Boolean)
      for (const s of sentences) {
        const lower = s.toLowerCase()
        if (painKeywords.some(k => lower.includes(k))) {
          painPoints.push(s)
        }
        if (goalKeywords.some(k => lower.includes(k))) {
          goals.push(s)
        }
      }
      
      if (painPoints.length > 0) data.painPoints = painPoints
      if (goals.length > 0) data.goals = goals
      if (painPoints.length === 0 && goals.length === 0 && input.length > 10) {
        data.painPoints = [input]
      }
      break
  }

  return data
}
