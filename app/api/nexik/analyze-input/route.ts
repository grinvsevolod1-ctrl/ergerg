import { NextRequest, NextResponse } from 'next/server'
import { getAIResponseWithFallback } from '@/lib/ai/providers'

const SYSTEM_PROMPT = `Ты анализируешь ответ пользователя на вопрос "Расскажи о своем бизнесе".

Твоя задача определить:
1. Это реальное описание бизнеса/деятельности? (даже если написано грубо или с матом)
2. Или это бессмыслица/тролль/отказ отвечать?

ВАЖНО: 
- "порно студия", "adult контент", "стриптиз клуб" - это РЕАЛЬНЫЙ бизнес, принимай
- Мат в описании бизнеса - ОК, если суть понятна ("бля у меня автосервис" = автосервис)
- "привет", "хз", "ааа", "тест", "qwerty" - НЕ бизнес, это бессмыслица

Отвечай ТОЛЬКО в JSON формате:
{
  "isValidBusiness": true/false,
  "businessType": "краткое описание ниши" или null,
  "response": "твой ответ пользователю"
}

Если бизнес валидный - response должен быть дружелюбным и показывать что ты понял нишу.
Если невалидный - response должен мягко попросить рассказать о бизнесе конкретнее.`

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input required' }, { status: 400 })
    }

    const result = await getAIResponseWithFallback(
      [{ role: 'user', content: input }],
      {
        system: SYSTEM_PROMPT,
        temperature: 0.3,
        maxTokens: 300
      }
    )

    // Пробуем распарсить JSON из ответа
    try {
      // Ищем JSON в ответе
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return NextResponse.json({
          isValidBusiness: parsed.isValidBusiness ?? false,
          businessType: parsed.businessType || null,
          response: parsed.response || 'Расскажи подробнее о своём бизнесе',
          source: result.source
        })
      }
    } catch {
      // Если не удалось распарсить JSON, возвращаем сырой ответ
    }

    // Fallback - простая эвристика если AI не смог
    const lower = input.toLowerCase()
    const businessKeywords = [
      'магазин', 'салон', 'студия', 'агентство', 'компания', 'фирма', 
      'сервис', 'услуги', 'продаю', 'занимаюсь', 'работаю', 'бизнес',
      'кафе', 'ресторан', 'клиника', 'школа', 'курсы', 'производство'
    ]
    
    const hasBusinessKeyword = businessKeywords.some(kw => lower.includes(kw))
    const wordCount = input.split(/\s+/).filter(w => w.length > 1).length
    
    return NextResponse.json({
      isValidBusiness: hasBusinessKeyword || wordCount >= 3,
      businessType: hasBusinessKeyword ? input : null,
      response: hasBusinessKeyword 
        ? `Отлично! ${input} - интересная ниша. Давай настроим для тебя AI-ассистента.`
        : 'Расскажи подробнее - чем занимается твой бизнес? Что продаёшь или какие услуги оказываешь?',
      source: 'fallback'
    })

  } catch (error) {
    console.error('[Analyze Input] Error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze input' },
      { status: 500 }
    )
  }
}
