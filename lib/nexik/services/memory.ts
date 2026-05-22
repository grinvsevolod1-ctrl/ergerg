/**
 * Nexik Memory System
 * Long-term memory about visitors/clients for personalized interactions
 * Makes AI indistinguishable from human by remembering everything
 */

import { query, queryOne, execute } from '@/lib/db'

// ============================================================
// TYPES
// ============================================================

export interface VisitorMemory {
  id: string
  org_id: string
  visitor_id: string
  
  // Identity
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  
  // Personality profile (learned over time)
  communication_style: 'formal' | 'casual' | 'mixed' | null
  preferred_language: string | null
  timezone: string | null
  response_speed_preference: 'fast' | 'detailed' | null
  
  // Business context
  company_name: string | null
  job_title: string | null
  industry: string | null
  company_size: string | null
  
  // Interests & preferences
  interests: string[]
  pain_points: string[]
  goals: string[]
  
  // Purchase/conversion history
  customer_since: Date | null
  total_purchases: number
  total_spent: number
  last_purchase_at: Date | null
  products_interested: string[]
  products_purchased: string[]
  
  // Interaction stats
  total_conversations: number
  total_messages: number
  avg_sentiment_score: number | null
  last_sentiment: 'positive' | 'neutral' | 'negative' | null
  
  // Important facts (AI extracts these from conversations)
  facts: MemoryFact[]
  
  // Conversation summaries
  conversation_summaries: ConversationSummary[]
  
  // Timestamps
  first_seen_at: Date
  last_seen_at: Date
  updated_at: Date
}

export interface MemoryFact {
  id: string
  fact: string
  category: 'personal' | 'business' | 'preference' | 'complaint' | 'request' | 'other'
  confidence: number
  source_conversation_id: string
  extracted_at: Date
}

export interface ConversationSummary {
  conversation_id: string
  summary: string
  outcome: 'resolved' | 'pending' | 'escalated' | 'converted' | null
  key_points: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  date: Date
}

export interface MemoryContext {
  visitor: VisitorMemory | null
  recentFacts: MemoryFact[]
  lastConversations: ConversationSummary[]
  personalizedGreeting: string | null
  contextPrompt: string
}

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Get or create visitor memory
 */
export async function getOrCreateVisitorMemory(
  orgId: string,
  visitorId: string,
  initialData?: Partial<VisitorMemory>
): Promise<VisitorMemory> {
  // Try to get existing
  const existing = await queryOne<VisitorMemory>(
    `SELECT * FROM nexik_visitor_memory WHERE org_id = $1 AND visitor_id = $2`,
    [orgId, visitorId]
  )
  
  if (existing) {
    // Update last_seen_at
    await execute(
      `UPDATE nexik_visitor_memory SET last_seen_at = NOW() WHERE id = $1`,
      [existing.id]
    )
    return parseMemory(existing)
  }
  
  // Create new memory
  const result = await queryOne<VisitorMemory>(
    `INSERT INTO nexik_visitor_memory (
      org_id, visitor_id, name, email, phone,
      interests, pain_points, goals, products_interested, products_purchased,
      facts, conversation_summaries,
      first_seen_at, last_seen_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12,
      NOW(), NOW()
    ) RETURNING *`,
    [
      orgId,
      visitorId,
      initialData?.name || null,
      initialData?.email || null,
      initialData?.phone || null,
      JSON.stringify(initialData?.interests || []),
      JSON.stringify(initialData?.pain_points || []),
      JSON.stringify(initialData?.goals || []),
      JSON.stringify(initialData?.products_interested || []),
      JSON.stringify(initialData?.products_purchased || []),
      JSON.stringify([]),
      JSON.stringify([])
    ]
  )
  
  return parseMemory(result!)
}

/**
 * Update visitor memory with new information
 */
export async function updateVisitorMemory(
  memoryId: string,
  updates: Partial<VisitorMemory>
): Promise<VisitorMemory> {
  const setClauses: string[] = []
  const values: unknown[] = []
  let paramIndex = 1
  
  const allowedFields = [
    'name', 'email', 'phone', 'avatar_url',
    'communication_style', 'preferred_language', 'timezone', 'response_speed_preference',
    'company_name', 'job_title', 'industry', 'company_size',
    'customer_since', 'total_purchases', 'total_spent', 'last_purchase_at',
    'total_conversations', 'total_messages', 'avg_sentiment_score', 'last_sentiment'
  ]
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      setClauses.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }
  
  // Handle array fields
  const arrayFields = ['interests', 'pain_points', 'goals', 'products_interested', 'products_purchased']
  for (const field of arrayFields) {
    if (updates[field as keyof VisitorMemory] !== undefined) {
      setClauses.push(`${field} = $${paramIndex}`)
      values.push(JSON.stringify(updates[field as keyof VisitorMemory]))
      paramIndex++
    }
  }
  
  if (setClauses.length === 0) {
    const current = await queryOne<VisitorMemory>(
      `SELECT * FROM nexik_visitor_memory WHERE id = $1`,
      [memoryId]
    )
    return parseMemory(current!)
  }
  
  setClauses.push('updated_at = NOW()')
  values.push(memoryId)
  
  const result = await queryOne<VisitorMemory>(
    `UPDATE nexik_visitor_memory 
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    values
  )
  
  return parseMemory(result!)
}

/**
 * Add a fact to visitor memory
 */
export async function addMemoryFact(
  memoryId: string,
  fact: Omit<MemoryFact, 'id' | 'extracted_at'>
): Promise<void> {
  const memory = await queryOne<{ facts: string }>(
    `SELECT facts FROM nexik_visitor_memory WHERE id = $1`,
    [memoryId]
  )
  
  if (!memory) return
  
  const facts: MemoryFact[] = JSON.parse(memory.facts || '[]')
  
  // Check for duplicate facts
  const isDuplicate = facts.some(f => 
    f.fact.toLowerCase() === fact.fact.toLowerCase()
  )
  
  if (!isDuplicate) {
    facts.push({
      ...fact,
      id: crypto.randomUUID(),
      extracted_at: new Date()
    })
    
    // Keep only last 50 facts
    const trimmedFacts = facts.slice(-50)
    
    await execute(
      `UPDATE nexik_visitor_memory SET facts = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(trimmedFacts), memoryId]
    )
  }
}

/**
 * Add conversation summary
 */
export async function addConversationSummary(
  memoryId: string,
  summary: Omit<ConversationSummary, 'date'>
): Promise<void> {
  const memory = await queryOne<{ conversation_summaries: string }>(
    `SELECT conversation_summaries FROM nexik_visitor_memory WHERE id = $1`,
    [memoryId]
  )
  
  if (!memory) return
  
  const summaries: ConversationSummary[] = JSON.parse(memory.conversation_summaries || '[]')
  
  summaries.push({
    ...summary,
    date: new Date()
  })
  
  // Keep only last 20 summaries
  const trimmedSummaries = summaries.slice(-20)
  
  await execute(
    `UPDATE nexik_visitor_memory 
     SET conversation_summaries = $1, 
         total_conversations = total_conversations + 1,
         updated_at = NOW() 
     WHERE id = $2`,
    [JSON.stringify(trimmedSummaries), memoryId]
  )
}

/**
 * Increment message count
 */
export async function incrementMessageCount(memoryId: string): Promise<void> {
  await execute(
    `UPDATE nexik_visitor_memory 
     SET total_messages = total_messages + 1, last_seen_at = NOW() 
     WHERE id = $1`,
    [memoryId]
  )
}

/**
 * Update sentiment tracking
 */
export async function updateSentiment(
  memoryId: string,
  sentiment: 'positive' | 'neutral' | 'negative',
  score: number
): Promise<void> {
  // Calculate running average
  await execute(
    `UPDATE nexik_visitor_memory 
     SET last_sentiment = $1,
         avg_sentiment_score = COALESCE(
           (avg_sentiment_score * total_messages + $2) / (total_messages + 1),
           $2
         ),
         updated_at = NOW()
     WHERE id = $3`,
    [sentiment, score, memoryId]
  )
}

// ============================================================
// CONTEXT GENERATION
// ============================================================

/**
 * Get memory context for AI prompt injection
 */
export async function getMemoryContext(
  orgId: string,
  visitorId: string
): Promise<MemoryContext> {
  const memory = await getOrCreateVisitorMemory(orgId, visitorId)
  
  // Get recent facts (last 10, high confidence)
  const recentFacts = memory.facts
    .filter(f => f.confidence >= 0.7)
    .slice(-10)
  
  // Get last 3 conversation summaries
  const lastConversations = memory.conversation_summaries.slice(-3)
  
  // Generate personalized greeting
  const personalizedGreeting = generatePersonalizedGreeting(memory)
  
  // Build context prompt for AI
  const contextPrompt = buildContextPrompt(memory, recentFacts, lastConversations)
  
  return {
    visitor: memory,
    recentFacts,
    lastConversations,
    personalizedGreeting,
    contextPrompt
  }
}

/**
 * Generate personalized greeting based on memory
 */
function generatePersonalizedGreeting(memory: VisitorMemory): string | null {
  const name = memory.name
  const lastSeen = memory.last_seen_at
  const totalConversations = memory.total_conversations
  
  if (!name) return null
  
  const now = new Date()
  const daysSinceLastVisit = lastSeen 
    ? Math.floor((now.getTime() - new Date(lastSeen).getTime()) / (1000 * 60 * 60 * 24))
    : null
  
  if (totalConversations === 0) {
    return `Привет, ${name}! Рад знакомству!`
  }
  
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 30) {
    return `${name}, давно не виделись! Рад что вернулся!`
  }
  
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 7) {
    return `${name}, привет! Как дела с прошлого раза?`
  }
  
  return `${name}, привет! Чем могу помочь?`
}

/**
 * Build context prompt for AI injection
 */
function buildContextPrompt(
  memory: VisitorMemory,
  facts: MemoryFact[],
  summaries: ConversationSummary[]
): string {
  const parts: string[] = []
  
  // Basic info
  if (memory.name) {
    parts.push(`Клиента зовут ${memory.name}.`)
  }
  
  if (memory.company_name) {
    parts.push(`Работает в ${memory.company_name}${memory.job_title ? ` как ${memory.job_title}` : ''}.`)
  }
  
  // Communication style
  if (memory.communication_style === 'casual') {
    parts.push(`Предпочитает неформальное общение.`)
  } else if (memory.communication_style === 'formal') {
    parts.push(`Предпочитает формальное общение.`)
  }
  
  // Customer status
  if (memory.customer_since) {
    parts.push(`Клиент с ${new Date(memory.customer_since).toLocaleDateString('ru-RU')}.`)
  }
  
  if (memory.total_purchases > 0) {
    parts.push(`Совершил ${memory.total_purchases} покупок на сумму ${memory.total_spent}₽.`)
  }
  
  // Recent sentiment
  if (memory.last_sentiment === 'negative') {
    parts.push(`ВНИМАНИЕ: В последний раз клиент был недоволен. Будь особенно внимателен.`)
  }
  
  // Interests
  if (memory.interests.length > 0) {
    parts.push(`Интересуется: ${memory.interests.slice(0, 5).join(', ')}.`)
  }
  
  // Pain points
  if (memory.pain_points.length > 0) {
    parts.push(`Известные проблемы: ${memory.pain_points.slice(0, 3).join(', ')}.`)
  }
  
  // Facts
  if (facts.length > 0) {
    parts.push(`\nВажные факты о клиенте:`)
    for (const fact of facts.slice(-5)) {
      parts.push(`- ${fact.fact}`)
    }
  }
  
  // Last conversations
  if (summaries.length > 0) {
    parts.push(`\nПоследние разговоры:`)
    for (const summary of summaries.slice(-2)) {
      parts.push(`- ${summary.summary} (${summary.outcome || 'не завершен'})`)
    }
  }
  
  if (parts.length === 0) {
    return 'Это новый посетитель, о нём пока ничего не известно.'
  }
  
  return parts.join('\n')
}

// ============================================================
// FACT EXTRACTION (AI-powered)
// ============================================================

/**
 * Extract facts from conversation message (to be called after each message)
 */
export async function extractFactsFromMessage(
  message: string,
  memoryId: string,
  conversationId: string
): Promise<MemoryFact[]> {
  const extractedFacts: MemoryFact[] = []
  
  // Pattern-based extraction (fast, no AI needed)
  const patterns: { regex: RegExp; category: MemoryFact['category'] }[] = [
    // Name patterns
    { regex: /меня зовут ([а-яё]+)/i, category: 'personal' },
    { regex: /я\s+([а-яё]+),/i, category: 'personal' },
    
    // Company patterns
    { regex: /работаю в ([^,.]+)/i, category: 'business' },
    { regex: /наша компания ([^,.]+)/i, category: 'business' },
    { regex: /у нас ([^,.]+) бизнес/i, category: 'business' },
    
    // Contact patterns
    { regex: /мой (?:номер|телефон)[:\s]+([+\d\s-]+)/i, category: 'personal' },
    { regex: /почта[:\s]+([^\s,]+@[^\s,]+)/i, category: 'personal' },
    
    // Preference patterns
    { regex: /предпочитаю ([^,.]+)/i, category: 'preference' },
    { regex: /мне (?:нравится|важно) ([^,.]+)/i, category: 'preference' },
    
    // Complaint patterns
    { regex: /проблема (?:в том что|с) ([^,.]+)/i, category: 'complaint' },
    { regex: /не работает ([^,.]+)/i, category: 'complaint' },
    { regex: /не могу ([^,.]+)/i, category: 'complaint' },
    
    // Request patterns
    { regex: /мне нужн[оа] ([^,.]+)/i, category: 'request' },
    { regex: /хочу ([^,.]+)/i, category: 'request' },
    { regex: /можете ([^?]+)\?/i, category: 'request' },
  ]
  
  for (const { regex, category } of patterns) {
    const match = message.match(regex)
    if (match && match[1]) {
      const fact = match[1].trim()
      if (fact.length > 2 && fact.length < 200) {
        extractedFacts.push({
          id: crypto.randomUUID(),
          fact: `${category === 'personal' ? '' : category + ': '}${fact}`,
          category,
          confidence: 0.8,
          source_conversation_id: conversationId,
          extracted_at: new Date()
        })
      }
    }
  }
  
  // Add facts to memory
  for (const fact of extractedFacts) {
    await addMemoryFact(memoryId, fact)
  }
  
  return extractedFacts
}

// ============================================================
// HELPERS
// ============================================================

function parseMemory(raw: VisitorMemory): VisitorMemory {
  return {
    ...raw,
    interests: typeof raw.interests === 'string' ? JSON.parse(raw.interests) : raw.interests || [],
    pain_points: typeof raw.pain_points === 'string' ? JSON.parse(raw.pain_points) : raw.pain_points || [],
    goals: typeof raw.goals === 'string' ? JSON.parse(raw.goals) : raw.goals || [],
    products_interested: typeof raw.products_interested === 'string' ? JSON.parse(raw.products_interested) : raw.products_interested || [],
    products_purchased: typeof raw.products_purchased === 'string' ? JSON.parse(raw.products_purchased) : raw.products_purchased || [],
    facts: typeof raw.facts === 'string' ? JSON.parse(raw.facts) : raw.facts || [],
    conversation_summaries: typeof raw.conversation_summaries === 'string' ? JSON.parse(raw.conversation_summaries) : raw.conversation_summaries || [],
  }
}
