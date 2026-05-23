/**
 * NEXIK Memory System v3.0
 * Долгосрочная память с классификацией и эмоциональным контекстом
 */

import { query, execute } from '@/lib/db'

// Типы памяти
export interface VisitorMemory {
  visitorId: string
  name?: string
  email?: string
  phone?: string
  company?: string
  businessType?: string
  businessDescription?: string
  emotionalState: 'positive' | 'neutral' | 'negative' | 'angry'
  totalInteractions: number
  firstSeen: Date
  lastSeen: Date
  tags: string[]
  notes: string[]
}

export interface ConversationMemory {
  id: string
  visitorId: string
  messages: MemoryMessage[]
  summary?: string
  extractedFacts: string[]
  promises: string[] // Что Nexik обещал сделать
  createdAt: Date
  updatedAt: Date
}

export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  sentiment?: 'positive' | 'neutral' | 'negative'
  intent?: string
}

/**
 * Получить или создать visitor
 */
export async function getOrCreateVisitor(visitorId: string): Promise<VisitorMemory> {
  try {
    // Попробуем найти существующего
    const result = await query<VisitorMemory>(
      `SELECT * FROM nexik_visitors WHERE visitor_id = $1`,
      [visitorId]
    )
    
    if (result.rows.length > 0) {
      const row = result.rows[0]
      // Обновляем last_seen
      await execute(
        `UPDATE nexik_visitors SET last_seen = NOW(), total_interactions = total_interactions + 1 WHERE visitor_id = $1`,
        [visitorId]
      )
      return {
        visitorId: row.visitor_id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        company: row.company,
        businessType: row.business_type,
        businessDescription: row.business_description,
        emotionalState: row.emotional_state || 'neutral',
        totalInteractions: (row.total_interactions || 0) + 1,
        firstSeen: row.first_seen,
        lastSeen: new Date(),
        tags: row.tags || [],
        notes: row.notes || []
      }
    }
    
    // Создаём нового
    await execute(
      `INSERT INTO nexik_visitors (visitor_id, emotional_state, total_interactions, first_seen, last_seen, tags, notes)
       VALUES ($1, 'neutral', 1, NOW(), NOW(), '{}', '{}')`,
      [visitorId]
    )
    
    return {
      visitorId,
      emotionalState: 'neutral',
      totalInteractions: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      tags: [],
      notes: []
    }
  } catch (error) {
    console.error('[Nexik Memory] Error getting visitor:', error)
    // Fallback - возвращаем пустой объект
    return {
      visitorId,
      emotionalState: 'neutral',
      totalInteractions: 1,
      firstSeen: new Date(),
      lastSeen: new Date(),
      tags: [],
      notes: []
    }
  }
}

/**
 * Обновить информацию о visitor
 */
export async function updateVisitor(
  visitorId: string, 
  updates: Partial<Omit<VisitorMemory, 'visitorId' | 'firstSeen' | 'lastSeen'>>
): Promise<void> {
  try {
    const setClauses: string[] = []
    const values: unknown[] = []
    let paramIndex = 1
    
    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`)
      values.push(updates.name)
    }
    if (updates.email !== undefined) {
      setClauses.push(`email = $${paramIndex++}`)
      values.push(updates.email)
    }
    if (updates.phone !== undefined) {
      setClauses.push(`phone = $${paramIndex++}`)
      values.push(updates.phone)
    }
    if (updates.company !== undefined) {
      setClauses.push(`company = $${paramIndex++}`)
      values.push(updates.company)
    }
    if (updates.businessType !== undefined) {
      setClauses.push(`business_type = $${paramIndex++}`)
      values.push(updates.businessType)
    }
    if (updates.businessDescription !== undefined) {
      setClauses.push(`business_description = $${paramIndex++}`)
      values.push(updates.businessDescription)
    }
    if (updates.emotionalState !== undefined) {
      setClauses.push(`emotional_state = $${paramIndex++}`)
      values.push(updates.emotionalState)
    }
    if (updates.tags !== undefined) {
      setClauses.push(`tags = $${paramIndex++}`)
      values.push(updates.tags)
    }
    if (updates.notes !== undefined) {
      setClauses.push(`notes = $${paramIndex++}`)
      values.push(updates.notes)
    }
    
    if (setClauses.length === 0) return
    
    setClauses.push(`last_seen = NOW()`)
    values.push(visitorId)
    
    await execute(
      `UPDATE nexik_visitors SET ${setClauses.join(', ')} WHERE visitor_id = $${paramIndex}`,
      values
    )
  } catch (error) {
    console.error('[Nexik Memory] Error updating visitor:', error)
  }
}

/**
 * Сохранить сообщение в историю
 */
export async function saveMessage(
  visitorId: string,
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: {
    sentiment?: 'positive' | 'neutral' | 'negative'
    intent?: string
    extractedFacts?: string[]
    promises?: string[]
  }
): Promise<void> {
  try {
    await execute(
      `INSERT INTO nexik_messages 
       (visitor_id, conversation_id, role, content, sentiment, intent, extracted_facts, promises, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        visitorId,
        conversationId,
        role,
        content,
        metadata?.sentiment || 'neutral',
        metadata?.intent,
        metadata?.extractedFacts || [],
        metadata?.promises || []
      ]
    )
  } catch (error) {
    console.error('[Nexik Memory] Error saving message:', error)
  }
}

/**
 * Получить последние сообщения visitor-а
 */
export async function getRecentMessages(
  visitorId: string, 
  limit: number = 20
): Promise<MemoryMessage[]> {
  try {
    const result = await query<{
      role: 'user' | 'assistant'
      content: string
      created_at: Date
      sentiment: string
      intent: string
    }>(
      `SELECT role, content, created_at, sentiment, intent 
       FROM nexik_messages 
       WHERE visitor_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [visitorId, limit]
    )
    
    return result.rows.reverse().map(row => ({
      role: row.role,
      content: row.content,
      timestamp: row.created_at,
      sentiment: row.sentiment as 'positive' | 'neutral' | 'negative',
      intent: row.intent
    }))
  } catch (error) {
    console.error('[Nexik Memory] Error getting messages:', error)
    return []
  }
}

/**
 * Получить обещания Nexik-а которые нужно выполнить
 */
export async function getActivePromises(visitorId: string): Promise<string[]> {
  try {
    const result = await query<{ promises: string[] }>(
      `SELECT promises FROM nexik_messages 
       WHERE visitor_id = $1 AND role = 'assistant' AND promises != '{}'
       ORDER BY created_at DESC
       LIMIT 10`,
      [visitorId]
    )
    
    const allPromises: string[] = []
    for (const row of result.rows) {
      if (row.promises) {
        allPromises.push(...row.promises)
      }
    }
    
    return [...new Set(allPromises)] // уникальные
  } catch (error) {
    console.error('[Nexik Memory] Error getting promises:', error)
    return []
  }
}

/**
 * Анализ настроения сообщения
 */
export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const lower = text.toLowerCase()
  
  // Негативные маркеры
  const negativeWords = [
    'плохо', 'ужас', 'отстой', 'дорого', 'долго', 'не работает', 'сломал',
    'злит', 'бесит', 'надоел', 'хуй', 'блять', 'пиздец', 'нахуй', 'сука',
    'отвратительно', 'кошмар', 'разочарован', 'обман', 'развод'
  ]
  
  // Позитивные маркеры
  const positiveWords = [
    'спасибо', 'круто', 'отлично', 'класс', 'супер', 'нравится', 'здорово',
    'молодец', 'красавчик', 'топ', 'огонь', 'кайф', 'рад', 'доволен'
  ]
  
  let score = 0
  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 1
  }
  for (const word of positiveWords) {
    if (lower.includes(word)) score += 1
  }
  
  if (score <= -2) return 'negative'
  if (score >= 2) return 'positive'
  return 'neutral'
}

/**
 * Извлечение фактов из сообщения пользователя
 */
export function extractFacts(text: string): string[] {
  const facts: string[] = []
  const lower = text.toLowerCase()
  
  // Извлекаем имя
  const namePatterns = [
    /меня зовут\s+(\w+)/i,
    /я\s+(\w+)/i,
    /это\s+(\w+)/i
  ]
  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match && match[1].length > 2 && match[1].length < 20) {
      facts.push(`name:${match[1]}`)
      break
    }
  }
  
  // Извлекаем бизнес
  const businessPatterns = [
    /у меня\s+(.+?)(?:\.|,|$)/i,
    /занимаюсь\s+(.+?)(?:\.|,|$)/i,
    /мой бизнес\s+(.+?)(?:\.|,|$)/i,
    /работаю в\s+(.+?)(?:\.|,|$)/i
  ]
  for (const pattern of businessPatterns) {
    const match = text.match(pattern)
    if (match && match[1].length > 3) {
      facts.push(`business:${match[1].trim()}`)
      break
    }
  }
  
  // Извлекаем email
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)
  if (emailMatch) {
    facts.push(`email:${emailMatch[0]}`)
  }
  
  // Извлекаем телефон
  const phoneMatch = text.match(/\+?[\d\s-]{10,}/)
  if (phoneMatch) {
    facts.push(`phone:${phoneMatch[0].replace(/\s/g, '')}`)
  }
  
  // Извлекаем количество (клиентов, сотрудников и т.д.)
  const numberPatterns = [
    /(\d+)\s*клиент/i,
    /(\d+)\s*сотрудник/i,
    /(\d+)\s*человек/i,
    /(\d+)\s*заказ/i
  ]
  for (const pattern of numberPatterns) {
    const match = lower.match(pattern)
    if (match) {
      facts.push(`scale:${match[0]}`)
    }
  }
  
  return facts
}

/**
 * Извлечение обещаний из ответа Nexik
 */
export function extractPromises(text: string): string[] {
  const promises: string[] = []
  const lower = text.toLowerCase()
  
  const promisePatterns = [
    /я\s+(?:сейчас\s+)?(?:пришлю|отправлю|вышлю)/i,
    /я\s+(?:сейчас\s+)?(?:проверю|посмотрю|уточню)/i,
    /я\s+(?:сейчас\s+)?(?:соединю|подключу)/i,
    /через\s+(\d+)\s+(минут|часов?|дней)/i,
    /завтра\s+(?:пришлю|напишу|позвоню)/i
  ]
  
  for (const pattern of promisePatterns) {
    const match = text.match(pattern)
    if (match) {
      promises.push(match[0])
    }
  }
  
  return promises
}

/**
 * Генерация краткой сводки о visitor для контекста
 */
export async function generateVisitorContext(visitorId: string): Promise<string> {
  const visitor = await getOrCreateVisitor(visitorId)
  const recentMessages = await getRecentMessages(visitorId, 10)
  const promises = await getActivePromises(visitorId)
  
  let context = ''
  
  if (visitor.name) {
    context += `Имя: ${visitor.name}. `
  }
  
  if (visitor.businessType || visitor.businessDescription) {
    context += `Бизнес: ${visitor.businessDescription || visitor.businessType}. `
  }
  
  if (visitor.totalInteractions > 1) {
    context += `Это ${visitor.totalInteractions}-й визит. `
  }
  
  if (visitor.emotionalState !== 'neutral') {
    const states = {
      positive: 'Позитивно настроен',
      negative: 'Был недоволен ранее',
      angry: 'Был очень недоволен!'
    }
    context += `${states[visitor.emotionalState]}. `
  }
  
  if (promises.length > 0) {
    context += `Ты обещал: ${promises.join(', ')}. `
  }
  
  if (recentMessages.length > 0) {
    const lastUserMsg = recentMessages.filter(m => m.role === 'user').pop()
    if (lastUserMsg) {
      context += `Последнее сообщение: "${lastUserMsg.content.slice(0, 100)}..."`
    }
  }
  
  return context || 'Новый посетитель, история отсутствует.'
}

/**
 * SQL для создания таблиц (выполнить один раз)
 */
export const MEMORY_TABLES_SQL = `
-- Таблица посетителей
CREATE TABLE IF NOT EXISTS nexik_visitors (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  business_type VARCHAR(100),
  business_description TEXT,
  emotional_state VARCHAR(20) DEFAULT 'neutral',
  total_interactions INTEGER DEFAULT 0,
  first_seen TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW(),
  tags TEXT[] DEFAULT '{}',
  notes TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS nexik_messages (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  sentiment VARCHAR(20) DEFAULT 'neutral',
  intent VARCHAR(100),
  extracted_facts TEXT[] DEFAULT '{}',
  promises TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_nexik_visitors_visitor_id ON nexik_visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_visitor_id ON nexik_messages(visitor_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_conversation_id ON nexik_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_nexik_messages_created_at ON nexik_messages(created_at);
`
