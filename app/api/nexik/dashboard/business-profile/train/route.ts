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
  const lowerCombined = combinedText.toLowerCase()
  
  // Простое извлечение - каждое предложение пользователя это потенциальный факт
  const sentences = userInput.split(/[.!?\n]+/).filter(s => s.trim().length > 10)
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (trimmed.length > 10 && trimmed.length < 500) {
      // Определяем категорию по ключевым словам
      let category = 'general'
      const lower = trimmed.toLowerCase()
      
      if (/название|компания|бизнес|называется|наз[ыв]|мы\s+[-–]\s+/.test(lower)) {
        category = 'business_name'
      } else if (/услуг|делаем|предоставляем|занимаемся|работаем над|выполняем/.test(lower)) {
        category = 'services'
      } else if (/клиент|аудитор|покупател|заказчик|для кого/.test(lower)) {
        category = 'target_audience'
      } else if (/работаем|график|время|час|расписание|открыт|закрыт/.test(lower)) {
        category = 'working_hours'
      } else if (/телефон|звонить|номер|\+\d|mail|почта|контакт/.test(lower)) {
        category = 'contact'
      } else if (/адрес|находим|расположен|город|улица|офис|кабинет/.test(lower)) {
        category = 'address'
      } else if (/руб|цена|стоим|стоит|тариф|прайс|\d+\s*р\.?/.test(lower)) {
        category = 'pricing'
      } else if (/противопоказ|нельзя|запрещ|ограничен|не рекомен/.test(lower)) {
        category = 'restrictions'
      } else if (/преимущ|особен|уникал|отлича|лучш|качеств/.test(lower)) {
        category = 'advantages'
      }
      
      // Не дублируем факты
      if (!facts.some(f => f.fact.toLowerCase() === trimmed.toLowerCase())) {
        facts.push({
          fact: trimmed,
          category,
          confidence: category === 'general' ? 0.5 : 0.8
        })
      }
    }
  }
  
  return facts.slice(0, 15)
}

// Извлечение структурированных данных для обновления профиля
function extractProfileData(userInput: string): Record<string, string | string[]> {
  const data: Record<string, string | string[]> = {}
  const lower = userInput.toLowerCase()
  
  // Название бизнеса - ищем шаблоны
  const namePatterns = [
    /(?:называ[ею]тся|название|компания|бизнес|мы\s*[-–]\s*это)\s*[«""]?([^»"".,\n]{3,100})[»""]?/i,
    /^([^.!?\n]{5,50})(?:\s*[-–]\s*это|\s+занима)/i,
  ]
  for (const p of namePatterns) {
    const m = userInput.match(p)
    if (m && m[1] && m[1].trim().length > 2) {
      data.business_name = m[1].trim()
      break
    }
  }
  
  // Услуги - собираем все упоминания
  const services: string[] = []
  const servicePatterns = [
    /(?:услуги?|делаем|предоставляем|занимаемся)\s*[:\-–]?\s*([^.!?\n]+)/gi,
    /(?:^|\n)\s*[-•]\s*([^.!?\n]{5,100})/gm,
  ]
  for (const p of servicePatterns) {
    let m
    while ((m = p.exec(userInput)) !== null) {
      if (m[1] && m[1].trim().length > 3) {
        services.push(m[1].trim())
      }
    }
  }
  if (services.length > 0) {
    data.services = services.slice(0, 10)
  }
  
  // Отрасль
  const industryKeywords: Record<string, string> = {
    'салон красоты|парикмахерская|маникюр|педикюр|косметолог': 'Красота и уход',
    'массаж|spa|спа': 'Здоровье и SPA',
    'автосервис|автомобил|шиномонтаж|авто': 'Автосервис',
    'ресторан|кафе|еда|доставка еды|кухня': 'Общественное питание',
    'магазин|продажа|товар|интернет-магазин': 'Розничная торговля',
    'клиника|медицин|врач|стоматолог|здоровь': 'Медицина',
    'фитнес|спорт|тренажер|йога': 'Фитнес и спорт',
    'юрист|адвокат|правов': 'Юридические услуги',
    'ремонт|строител|отделк': 'Строительство и ремонт',
    'образован|курсы|обучен|школа': 'Образование',
  }
  
  for (const [keywords, industry] of Object.entries(industryKeywords)) {
    if (new RegExp(keywords, 'i').test(lower)) {
      data.industry = industry
      break
    }
  }
  
  // Контакты
  const phoneMatch = userInput.match(/(\+?\d[\d\s()-]{9,})/g)
  if (phoneMatch) {
    data.contact_phone = phoneMatch[0].replace(/\s+/g, ' ').trim()
  }
  
  const emailMatch = userInput.match(/([\w.-]+@[\w.-]+\.[a-z]{2,})/i)
  if (emailMatch) {
    data.contact_email = emailMatch[1]
  }
  
  return data
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
  
  // Extract structured profile data
  const profileData = extractProfileData(message)
  
  // Update learned facts and profile data
  if (extractedFacts.length > 0 || Object.keys(profileData).length > 0) {
    // Prepare facts for storage
    const newFacts = extractedFacts.map(f => ({
      fact: f.fact,
      category: f.category,
      source: 'training_chat',
      timestamp: new Date().toISOString()
    }))
    
    // Build dynamic update query
    const updates: string[] = []
    const values: (string | null)[] = [orgId]
    let paramIndex = 2
    
    // Always add facts if any
    if (newFacts.length > 0) {
      updates.push(`ai_learned_facts = COALESCE(ai_learned_facts, '[]'::jsonb) || $${paramIndex}::jsonb`)
      values.push(JSON.stringify(newFacts))
      paramIndex++
    }
    
    // Add profile fields if extracted
    if (profileData.business_name) {
      updates.push(`business_name = COALESCE(business_name, $${paramIndex})`)
      values.push(profileData.business_name as string)
      paramIndex++
    }
    if (profileData.industry) {
      updates.push(`industry = COALESCE(industry, $${paramIndex})`)
      values.push(profileData.industry as string)
      paramIndex++
    }
    if (profileData.contact_phone) {
      updates.push(`contact_phone = COALESCE(contact_phone, $${paramIndex})`)
      values.push(profileData.contact_phone as string)
      paramIndex++
    }
    if (profileData.contact_email) {
      updates.push(`contact_email = COALESCE(contact_email, $${paramIndex})`)
      values.push(profileData.contact_email as string)
      paramIndex++
    }
    if (profileData.services && Array.isArray(profileData.services) && profileData.services.length > 0) {
      updates.push(`services = COALESCE(services, ARRAY[]::text[]) || $${paramIndex}::text[]`)
      values.push(JSON.stringify(profileData.services).replace(/^\[/, '{').replace(/\]$/, '}'))
      paramIndex++
    }
    
    updates.push('updated_at = NOW()')
    
    if (updates.length > 1) { // More than just updated_at
      await execute(
        `UPDATE nexik_business_profiles 
         SET ${updates.join(', ')}
         WHERE org_id = $1`,
        values
      )
    }
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
