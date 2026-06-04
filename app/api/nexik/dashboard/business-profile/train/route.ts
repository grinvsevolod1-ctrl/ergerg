import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'
import { routedChat, AI_SERVERS, selectServer } from '@/lib/ai/router'

const EXTRACTION_PROMPT = `Ты - помощник по настройке бизнес-ассистента Nexik.
Твоя задача - помочь пользователю описать его бизнес через естественный диалог.

Когда пользователь рассказывает о своём бизнесе, извлекай и ЗАПОМИНАЙ ключевую информацию:
- Название бизнеса
- Тип бизнеса / отрасль
- Услуги и продукты с ценами
- Целевая аудитория
- Уникальные преимущества

Будь дружелюбным и помогай пользователю структурировать информацию о его бизнесе.
Общайся на том языке, на котором пишет пользователь.
Отвечай кратко, но информативно.

Текущий контекст бизнеса:
{business_context}`

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message } = await request.json()
  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Получаем текущий ai_config
  const result = await query<{ ai_config: any }>(
    'SELECT ai_config FROM nexik_organizations WHERE id = $1',
    [session.member.org_id]
  )
  const aiConfig = result[0]?.ai_config || {}
  const businessContext = aiConfig.business_context || ''

  const systemPrompt = EXTRACTION_PROMPT.replace('{business_context}', businessContext || 'Пока не указано')

  // Выбираем FAST сервер принудительно для обучения (он стабильнее)
  const fastServer = 'fast'
  const serverConfig = AI_SERVERS[fastServer]

  console.log(`[Nexik Train] Using server: ${fastServer}, model: ${serverConfig.defaultModel}`)

  try {
    const aiResult = await routedChat(
      'train',
      [{ role: 'user', content: message }],
      {
        model: serverConfig.defaultModel,
        system: systemPrompt,
        temperature: 0.7,
        maxTokens: 500,
        preferServer: fastServer
      }
    )

    // Обновляем историю обучения
    const updatedHistory = `${aiConfig.learning_history || ''}\n[${new Date().toISOString()}] Пользователь: ${message}\nAI: ${aiResult.response}`
    
    await execute(
      `UPDATE nexik_organizations 
       SET ai_config = jsonb_set(jsonb_set(ai_config, '{learning_history}', $1::jsonb), '{business_context}', $2::jsonb),
           updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(updatedHistory), JSON.stringify(businessContext), session.member.org_id]
    )

    return NextResponse.json({
      response: aiResult.response,
      source: 'ai_train'
    })
  } catch (error) {
    console.error('[Nexik Train] Error:', error)
    return NextResponse.json({ 
      response: 'Извините, произошла ошибка. Попробуйте ещё раз.', 
      source: 'error' 
    }, { status: 500 })
  }
}
