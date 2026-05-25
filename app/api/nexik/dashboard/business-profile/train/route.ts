import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'

// Специальный промпт для извлечения бизнес-информации
const EXTRACTION_PROMPT = `Ты - помощник по настройке бизнес-ассистента Nexik.
Твоя задача - помочь пользователю описать его бизнес через естественный диалог.

Когда пользователь рассказывает о своём бизнесе, извлекай и ЗАПОМИНАЙ ключевую информацию:
- Название бизнеса
- Тип бизнеса / отрасль
- Услуги и продукты с ценами
- Целевая аудитория
- Уникальные преимущества
- Контактная информация
- Адрес и часы работы
- Противопоказания и ограничения
- Частые вопросы клиентов

После каждого сообщения пользователя:
1. Подтверди что ты ЗАПОМНИЛ всю информацию (перечисли ключевые факты)
2. Задай уточняющий вопрос, чтобы узнать больше
3. Если пользователь спрашивает что ты запомнил - перечисли ВСЮ информацию

Будь дружелюбным и помогай пользователю структурировать информацию о его бизнесе.
Общайся на том языке, на котором пишет пользователь.
Отвечай кратко, но информативно.

Текущий контекст бизнеса:
{business_context}

История обучения (используй эту информацию!):
{learning_history}`

interface ExtractedFact {
  fact: string
  category: string
  confidence: number
}

// Улучшенное извлечение фактов из ответа AI и сообщения пользователя
function extractFactsFromResponse(response: string, userInput: string): ExtractedFact[] {
  const facts: ExtractedFact[] = []
  const combinedText = `${userInput} ${response}`
  
  // Паттерны для извлечения
  const patterns = [
    { regex: /название.*?[«"]([^»"]+)[»"]/gi, category: 'business_name' },
    { regex: /(?:компания|бизнес|магазин|салон|студия|кабинет)\s+[«"]?([^»",\n]+)[»"]?/gi, category: 'business_name' },
    { regex: /(?:занимаемся|предоставляем|продаём|делаем|услуг[аи])\s+(.+?)(?:\.|,|$)/gim, category: 'services' },
    { regex: /(?:клиенты|аудитория).*?[-–:]\s*(.+?)(?:\.|$)/gim, category: 'target_audience' },
    { regex: /(?:работаем|график|расписание|время работы)\s+(.+?)(?:\.|$)/gim, category: 'working_hours' },
    { regex: /(?:телефон|звонить|номер).*?(\+?\d[\d\s()-]{9,})/gi, category: 'contact' },
    { regex: /(?:email|почта|e-mail).*?([\w.-]+@[\w.-]+)/gi, category: 'contact' },
    { regex: /(?:адрес|находимся|расположен|кабинет по адресу)\s+(.+?)(?:\.|,|$)/gim, category: 'address' },
    { regex: /(\d+)\s*(?:руб|рублей|р\.|BYN|бел)/gi, category: 'pricing' },
    { regex: /(?:цена|стоимость|стоит)\s+(.+?)(?:\.|$)/gim, category: 'pricing' },
    { regex: /(?:противопоказани[яе]|нельзя|запрещено)\s*[:\s]*(.+?)(?:\.|$)/gim, category: 'restrictions' },
  ]
  
  for (const { regex, category } of patterns) {
    let match
    // Reset regex lastIndex
    regex.lastIndex = 0
    while ((match = regex.exec(combinedText)) !== null) {
      if (match[1] && match[1].trim().length > 2 && match[1].trim().length < 500) {
        // Проверяем что факт не дублируется
        const factText = match[1].trim()
        if (!facts.some(f => f.fact.toLowerCase() === factText.toLowerCase())) {
          facts.push({
            fact: factText,
            category,
            confidence: 0.7
          })
        }
      }
    }
  }
  
  // Извлекаем ключевые данные из структурированного текста (списки с временем, ценами)
  const listPatterns = [
    /(?:^|\n)\s*([А-Яа-яЁё\w\s]+)\s*[:\-–]\s*(\d+[^\n]+)/gm, // "Услуга: цена/время"
    /(?:^|\n)\s*(\d+)\.\s*([^\n]+)/gm, // "1. Пункт списка"
  ]
  
  for (const pattern of listPatterns) {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(userInput)) !== null) {
      const fullMatch = `${match[1]}: ${match[2] || ''}`.trim()
      if (fullMatch.length > 5 && fullMatch.length < 200) {
        if (!facts.some(f => f.fact.includes(match[1].trim()))) {
          facts.push({
            fact: fullMatch,
            category: 'service_details',
            confidence: 0.8
          })
        }
      }
    }
  }
  
  return facts.slice(0, 20) // Ограничиваем количество фактов за раз
}

// Лимиты для сообщений
const MAX_MESSAGE_LENGTH = 10000 // ~10K символов - примерно 2500 токенов
const MAX_TOKENS_RESPONSE = 2000 // Увеличенный лимит для полноценных ответов

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member?.org_id || session.org?.id
  const memberId = session.member?.id
  const { message, conversationId = `training_${orgId}` } = await request.json()
  
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }
  
  // Проверка длины сообщения
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ 
      error: `Сообщение слишком длинное (${message.length} символов). Максимум ${MAX_MESSAGE_LENGTH} символов. Пожалуйста, разбейте информацию на несколько сообщений.`,
      code: 'MESSAGE_TOO_LONG',
      maxLength: MAX_MESSAGE_LENGTH,
      actualLength: message.length
    }, { status: 400 })
  }
  
  // Get business profile
  const profiles = await query<{
    business_name: string
    short_description: string
    services: string[]
    products: string[]
    ai_learned_facts: Array<{ fact: string; source: string; timestamp: string }>
  }>(
    `SELECT business_name, short_description, services, products, ai_learned_facts 
     FROM nexik_business_profiles WHERE org_id = $1`,
    [orgId]
  )
  
  const profile = profiles[0]
  
  // Build context
  let businessContext = 'Пока нет информации о бизнесе.'
  if (profile) {
    const parts = []
    if (profile.business_name) parts.push(`Название: ${profile.business_name}`)
    if (profile.short_description) parts.push(`Описание: ${profile.short_description}`)
    if (profile.services?.length) parts.push(`Услуги: ${profile.services.join(', ')}`)
    if (profile.products?.length) parts.push(`Продукты: ${profile.products.join(', ')}`)
    if (parts.length > 0) businessContext = parts.join('\n')
  }
  
  // Get recent training messages - увеличиваем лимит для сохранения контекста
  const recentMessages = await query<{
    role: string
    content: string
  }>(
    `SELECT role, content FROM nexik_personal_messages 
     WHERE org_id = $1 AND conversation_id = $2 
     ORDER BY created_at DESC LIMIT 30`,
    [orgId, conversationId]
  )
  
  // Формируем историю обучения с полным контекстом
  const learningHistory = recentMessages.length > 0
    ? recentMessages.reverse().map(m => `${m.role === 'user' ? 'Пользователь' : 'Nexik'}: ${m.content.substring(0, 2000)}`).join('\n\n')
    : 'Начало обучения.'
  
  // Save user message
  await execute(
    `INSERT INTO nexik_personal_messages (org_id, member_id, conversation_id, role, content)
     VALUES ($1, $2, $3, 'user', $4)`,
    [orgId, memberId, conversationId, message]
  )
  
  // Build prompt
  const systemPrompt = EXTRACTION_PROMPT
    .replace('{business_context}', businessContext)
    .replace('{learning_history}', learningHistory)
  
  // Generate AI response with error handling
  const historyForAI = recentMessages.slice(-10).reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content.substring(0, 3000) // Ограничиваем длину каждого сообщения
  }))
  
  let aiResult
  try {
    aiResult = await routedChat(
      'simple',
      [...historyForAI, { role: 'user', content: message.substring(0, MAX_MESSAGE_LENGTH) }],
      {
        model: AI_SERVERS.fast.defaultModel,
        system: systemPrompt,
        temperature: 0.7,
        maxTokens: MAX_TOKENS_RESPONSE
      }
    )
  } catch (error) {
    console.error('[v0] Train API error:', error)
    return NextResponse.json({ 
      error: 'AI временно недоступен. Попробуйте еще раз.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
  
  if (!aiResult?.response) {
    return NextResponse.json({ 
      error: 'AI не смог сгенерировать ответ. Попробуйте переформулировать сообщение.' 
    }, { status: 500 })
  }
  
  // Save AI response
  await execute(
    `INSERT INTO nexik_personal_messages (org_id, member_id, conversation_id, role, content)
     VALUES ($1, $2, $3, 'assistant', $4)`,
    [orgId, memberId, conversationId, aiResult.response]
  )
  
  // Extract facts from conversation
  const extractedFacts = extractFactsFromResponse(aiResult.response, message)
  
  // Update learned facts if any
  if (extractedFacts.length > 0) {
    const newFacts = extractedFacts.map(f => ({
      fact: f.fact,
      category: f.category,
      source: 'training_chat',
      timestamp: new Date().toISOString()
    }))
    
    await execute(
      `UPDATE nexik_business_profiles 
       SET ai_learned_facts = COALESCE(ai_learned_facts, '[]'::jsonb) || $1::jsonb,
           updated_at = NOW()
       WHERE org_id = $2`,
      [JSON.stringify(newFacts), orgId]
    )
  }
  
  return NextResponse.json({
    success: true,
    response: aiResult.response,
    extractedFacts: extractedFacts.length > 0 ? extractedFacts : undefined
  })
}

// GET - получить историю обучения
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member?.org_id || session.org?.id
  const searchParams = request.nextUrl.searchParams
  const conversationId = searchParams.get('conversationId') || `training_${orgId}`
  
  const messages = await query<{
    id: string
    role: string
    content: string
    created_at: Date
  }>(
    `SELECT id, role, content, created_at FROM nexik_personal_messages 
     WHERE org_id = $1 AND conversation_id = $2 
     ORDER BY created_at ASC`,
    [orgId, conversationId]
  )
  
  return NextResponse.json({
    success: true,
    messages: messages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.created_at
    }))
  })
}
