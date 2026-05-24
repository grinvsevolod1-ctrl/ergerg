import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'

// Специальный промпт для извлечения бизнес-информации
const EXTRACTION_PROMPT = `Ты - помощник по настройке бизнес-ассистента Nexik.
Твоя задача - помочь пользователю описать его бизнес через естественный диалог.

Когда пользователь рассказывает о своём бизнесе, извлекай ключевую информацию:
- Название бизнеса
- Тип бизнеса / отрасль
- Услуги и продукты
- Целевая аудитория
- Уникальные преимущества
- Контактная информация
- Часы работы
- Частые вопросы клиентов

После каждого сообщения пользователя:
1. Задай уточняющий вопрос, чтобы узнать больше
2. Подтверди, что ты понял информацию
3. Предложи следующую тему для обсуждения

Будь дружелюбным и помогай пользователю структурировать информацию о его бизнесе.
Общайся на том языке, на котором пишет пользователь.

Текущий контекст бизнеса:
{business_context}

История обучения:
{learning_history}`

interface ExtractedFact {
  fact: string
  category: string
  confidence: number
}

// Простое извлечение фактов из ответа AI
function extractFactsFromResponse(response: string, userInput: string): ExtractedFact[] {
  const facts: ExtractedFact[] = []
  
  // Паттерны для извлечения
  const patterns = [
    { regex: /название.*?[«"]([^»"]+)[»"]/gi, category: 'business_name' },
    { regex: /(?:компания|бизнес|магазин|салон|студия)\s+[«"]([^»"]+)[»"]/gi, category: 'business_name' },
    { regex: /(?:занимаемся|предоставляем|продаём|делаем)\s+(.+?)(?:\.|,|$)/gi, category: 'services' },
    { regex: /(?:клиенты|аудитория).*?[-–]\s*(.+?)(?:\.|$)/gi, category: 'target_audience' },
    { regex: /(?:работаем|график)\s+(.+?)(?:\.|$)/gi, category: 'working_hours' },
    { regex: /(?:телефон|звонить).*?(\+?\d[\d\s-]{9,})/gi, category: 'contact' },
    { regex: /(?:email|почта).*?([\w.-]+@[\w.-]+)/gi, category: 'contact' },
  ]
  
  const combinedText = `${userInput} ${response}`
  
  for (const { regex, category } of patterns) {
    let match
    while ((match = regex.exec(combinedText)) !== null) {
      if (match[1] && match[1].length > 2) {
        facts.push({
          fact: match[1].trim(),
          category,
          confidence: 0.7
        })
      }
    }
  }
  
  return facts
}

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
  
  // Get recent training messages
  const recentMessages = await query<{
    role: string
    content: string
  }>(
    `SELECT role, content FROM nexik_personal_messages 
     WHERE org_id = $1 AND conversation_id = $2 
     ORDER BY created_at DESC LIMIT 10`,
    [orgId, conversationId]
  )
  
  const learningHistory = recentMessages.length > 0
    ? recentMessages.reverse().map(m => `${m.role === 'user' ? 'Пользователь' : 'Nexik'}: ${m.content}`).join('\n')
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
  
  // Generate AI response
  const historyForAI = recentMessages.slice(-6).reverse().map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content
  }))
  
  const aiResult = await routedChat(
    'simple',
    [...historyForAI, { role: 'user', content: message }],
    {
      model: AI_SERVERS.fast.defaultModel,
      system: systemPrompt,
      temperature: 0.7,
      maxTokens: 400
    }
  )
  
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
