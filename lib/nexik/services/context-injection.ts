/**
 * Nexik Context Injection System
 * Builds comprehensive context for AI from memory, knowledge, and conversation history
 */

import { getMemoryContext, type MemoryContext } from './memory'
import { getOrgPersonality, buildPersonalityPrompt, type Personality } from './personality'
import { searchKnowledge, type KnowledgeChunk } from '../db/knowledge'
import { query } from '@/lib/db'

// ============================================================
// TYPES
// ============================================================

export interface InjectedContext {
  // System prompt components
  baseSystemPrompt: string
  personalityPrompt: string
  memoryPrompt: string
  knowledgePrompt: string
  
  // Combined system prompt
  fullSystemPrompt: string
  
  // Metadata for logging/debugging
  metadata: {
    visitorId: string
    orgId: string
    hasMemory: boolean
    hasKnowledge: boolean
    knowledgeChunksUsed: number
    memoryFactsUsed: number
    personalityName: string
  }
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface ContextOptions {
  // Include visitor memory
  includeMemory?: boolean
  
  // Include knowledge base (RAG)
  includeKnowledge?: boolean
  knowledgeQuery?: string // Custom query for knowledge search
  maxKnowledgeChunks?: number
  
  // Include conversation history
  maxHistoryMessages?: number
  
  // Personality override
  personalityId?: string
  
  // Additional context
  additionalContext?: string
  
  // Current page/product context
  pageContext?: {
    url?: string
    title?: string
    productId?: string
    productName?: string
    category?: string
  }
}

// ============================================================
// BASE SYSTEM PROMPTS
// ============================================================

const BASE_SYSTEM_PROMPT = `Ты - Nexik, умный AI-ассистент компании. Твоя задача - помогать клиентам, отвечать на вопросы и решать их проблемы.

ВАЖНЫЕ ПРАВИЛА:
1. Отвечай на языке клиента. Если пишут по-русски - отвечай по-русски.
2. Будь дружелюбным и полезным.
3. Если не знаешь ответ - честно скажи об этом.
4. Не выдумывай информацию. Используй только то, что знаешь.
5. Если вопрос требует помощи человека - предложи связаться с оператором.
6. Будь кратким, но информативным. Не лей воду.`

const HUMAN_BEHAVIOR_PROMPT = `
ВЕДИ СЕБЯ КАК ЧЕЛОВЕК:
- НЕ начинай ответы с "Конечно!" или "Отлично!" каждый раз
- Используй разговорный язык, сокращения (ок, норм, ща)
- Иногда задавай уточняющие вопросы
- Если что-то неясно - переспроси
- Можешь использовать короткие фразы типа "ага", "понял", "так"
- НЕ будь слишком формальным и вежливым - это выглядит роботом`

const SAFETY_PROMPT = `
БЕЗОПАСНОСТЬ:
- Не обсуждай политику, религию, и другие спорные темы
- Не давай медицинских, юридических или финансовых советов
- Если клиент агрессивен - сохраняй спокойствие и предложи оператора
- Не раскрывай что ты AI если не спросят напрямую`

// ============================================================
// MAIN CONTEXT BUILDER
// ============================================================

/**
 * Build full context for AI request
 */
export async function buildContext(
  orgId: string,
  visitorId: string,
  currentMessage: string,
  conversationHistory: ConversationMessage[] = [],
  options: ContextOptions = {}
): Promise<InjectedContext> {
  const {
    includeMemory = true,
    includeKnowledge = true,
    maxKnowledgeChunks = 3,
    maxHistoryMessages = 10,
    additionalContext,
    pageContext
  } = options
  
  // Fetch all context in parallel
  const [personality, memoryContext, knowledgeResults] = await Promise.all([
    getOrgPersonality(orgId),
    includeMemory ? getMemoryContext(orgId, visitorId) : null,
    includeKnowledge ? searchKnowledge(orgId, currentMessage, conversationHistory, maxKnowledgeChunks) : []
  ])
  
  // Build personality prompt
  const personalityPrompt = buildPersonalityPrompt(personality)
  
  // Build memory prompt
  const memoryPrompt = memoryContext ? buildMemoryPrompt(memoryContext) : ''
  
  // Build knowledge prompt
  const knowledgePrompt = buildKnowledgePrompt(knowledgeResults)
  
  // Build page context prompt
  const pageContextPrompt = pageContext ? buildPageContextPrompt(pageContext) : ''
  
  // Combine everything
  const fullSystemPrompt = [
    BASE_SYSTEM_PROMPT,
    HUMAN_BEHAVIOR_PROMPT,
    personalityPrompt,
    memoryPrompt,
    knowledgePrompt,
    pageContextPrompt,
    additionalContext,
    SAFETY_PROMPT
  ].filter(Boolean).join('\n\n')
  
  return {
    baseSystemPrompt: BASE_SYSTEM_PROMPT,
    personalityPrompt,
    memoryPrompt,
    knowledgePrompt,
    fullSystemPrompt,
    metadata: {
      visitorId,
      orgId,
      hasMemory: !!memoryContext?.visitor,
      hasKnowledge: knowledgeResults.length > 0,
      knowledgeChunksUsed: knowledgeResults.length,
      memoryFactsUsed: memoryContext?.recentFacts.length || 0,
      personalityName: personality.name
    }
  }
}

/**
 * Build messages array for AI request (with context injection)
 */
export async function buildMessagesWithContext(
  orgId: string,
  visitorId: string,
  currentMessage: string,
  conversationHistory: ConversationMessage[] = [],
  options: ContextOptions = {}
): Promise<{
  messages: ConversationMessage[]
  context: InjectedContext
}> {
  const { maxHistoryMessages = 10 } = options
  
  // Build context
  const context = await buildContext(
    orgId,
    visitorId,
    currentMessage,
    conversationHistory,
    options
  )
  
  // Build messages array
  const messages: ConversationMessage[] = [
    // System prompt with all context
    { role: 'system', content: context.fullSystemPrompt },
    
    // Conversation history (trimmed to last N)
    ...conversationHistory.slice(-maxHistoryMessages),
    
    // Current message
    { role: 'user', content: currentMessage }
  ]
  
  return { messages, context }
}

// ============================================================
// CONTEXT BUILDERS
// ============================================================

/**
 * Build memory prompt from visitor memory
 */
function buildMemoryPrompt(memoryContext: MemoryContext): string {
  if (!memoryContext.visitor && memoryContext.recentFacts.length === 0) {
    return ''
  }
  
  const parts: string[] = ['=== ИНФОРМАЦИЯ О КЛИЕНТЕ ===']
  
  // Add context prompt (already formatted by memory system)
  if (memoryContext.contextPrompt) {
    parts.push(memoryContext.contextPrompt)
  }
  
  // Add personalized greeting suggestion
  if (memoryContext.personalizedGreeting) {
    parts.push(`\nРекомендуемое приветствие: "${memoryContext.personalizedGreeting}"`)
  }
  
  return parts.join('\n')
}

/**
 * Build knowledge prompt from RAG results
 */
function buildKnowledgePrompt(results: KnowledgeSearchResult[]): string {
  if (results.length === 0) {
    return ''
  }
  
  const parts: string[] = ['=== РЕЛЕВАНТНАЯ ИНФОРМАЦИЯ ИЗ БАЗЫ ЗНАНИЙ ===']
  parts.push('Используй эту информацию для ответа, но не копируй дословно:\n')
  
  for (const result of results) {
    parts.push(`[${result.title || 'Документ'}]`)
    parts.push(result.content)
    parts.push('')
  }
  
  parts.push('Если информация из базы знаний не релевантна вопросу - не используй её.')
  
  return parts.join('\n')
}

/**
 * Build page context prompt
 */
function buildPageContextPrompt(pageContext: NonNullable<ContextOptions['pageContext']>): string {
  const parts: string[] = ['=== ТЕКУЩИЙ КОНТЕКСТ ===']
  
  if (pageContext.productName) {
    parts.push(`Клиент смотрит товар: ${pageContext.productName}`)
    if (pageContext.category) {
      parts.push(`Категория: ${pageContext.category}`)
    }
  }
  
  if (pageContext.title && !pageContext.productName) {
    parts.push(`Клиент на странице: ${pageContext.title}`)
  }
  
  if (pageContext.url) {
    parts.push(`URL: ${pageContext.url}`)
  }
  
  return parts.length > 1 ? parts.join('\n') : ''
}

/**
 * Search knowledge base with conversation context
 */
async function searchKnowledge(
  orgId: string,
  currentMessage: string,
  history: ConversationMessage[],
  maxChunks: number
): Promise<KnowledgeSearchResult[]> {
  // Build search query from current message + recent context
  const recentUserMessages = history
    .filter(m => m.role === 'user')
    .slice(-3)
    .map(m => m.content)
  
  const searchQuery = [currentMessage, ...recentUserMessages].join(' ')
  
  try {
    return await searchKnowledge(orgId, searchQuery, maxChunks)
  } catch (error) {
    console.error('[Context] Knowledge search failed:', error)
    return []
  }
}

// ============================================================
// CONVERSATION HISTORY HELPERS
// ============================================================

/**
 * Get conversation history from database
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 20
): Promise<ConversationMessage[]> {
  const messages = await query<{
    sender_type: 'visitor' | 'ai' | 'operator'
    content: string
    created_at: Date
  }>(
    `SELECT sender_type, content, created_at 
     FROM nexik_messages 
     WHERE conversation_id = $1 
     ORDER BY created_at ASC
     LIMIT $2`,
    [conversationId, limit]
  )
  
  return messages.map(m => ({
    role: m.sender_type === 'visitor' ? 'user' : 'assistant' as const,
    content: m.content,
    timestamp: m.created_at
  }))
}

/**
 * Summarize long conversation history
 */
export function summarizeHistory(
  history: ConversationMessage[],
  maxMessages: number = 10
): ConversationMessage[] {
  if (history.length <= maxMessages) {
    return history
  }
  
  // Keep first message (context) and last N messages
  const first = history[0]
  const recent = history.slice(-maxMessages + 1)
  
  // Add summary of omitted messages
  const omittedCount = history.length - maxMessages
  const summaryMessage: ConversationMessage = {
    role: 'system',
    content: `[Пропущено ${omittedCount} сообщений из истории диалога]`
  }
  
  return [first, summaryMessage, ...recent]
}

// ============================================================
// QUICK CONTEXT BUILDERS
// ============================================================

/**
 * Build minimal context for simple queries (faster)
 */
export async function buildMinimalContext(
  orgId: string,
  currentMessage: string
): Promise<string> {
  const personality = await getOrgPersonality(orgId)
  const personalityPrompt = buildPersonalityPrompt(personality)
  
  return [
    BASE_SYSTEM_PROMPT,
    HUMAN_BEHAVIOR_PROMPT,
    personalityPrompt
  ].join('\n\n')
}

/**
 * Build context with just knowledge (no memory)
 */
export async function buildKnowledgeOnlyContext(
  orgId: string,
  currentMessage: string,
  maxChunks: number = 3
): Promise<string> {
  const [personality, knowledge] = await Promise.all([
    getOrgPersonality(orgId),
    searchKnowledge(orgId, currentMessage, maxChunks)
  ])
  
  return [
    BASE_SYSTEM_PROMPT,
    HUMAN_BEHAVIOR_PROMPT,
    buildPersonalityPrompt(personality),
    buildKnowledgePrompt(knowledge)
  ].join('\n\n')
}

// ============================================================
// CONTEXT DEBUGGING
// ============================================================

/**
 * Get readable context summary for debugging
 */
export function formatContextDebug(context: InjectedContext): string {
  const lines = [
    '=== CONTEXT DEBUG ===',
    `Org: ${context.metadata.orgId}`,
    `Visitor: ${context.metadata.visitorId}`,
    `Personality: ${context.metadata.personalityName}`,
    `Has Memory: ${context.metadata.hasMemory}`,
    `Memory Facts: ${context.metadata.memoryFactsUsed}`,
    `Has Knowledge: ${context.metadata.hasKnowledge}`,
    `Knowledge Chunks: ${context.metadata.knowledgeChunksUsed}`,
    '',
    '=== SYSTEM PROMPT LENGTH ===',
    `${context.fullSystemPrompt.length} chars`,
    '',
    '=== COMPONENTS ===',
    `Base: ${context.baseSystemPrompt.length} chars`,
    `Personality: ${context.personalityPrompt.length} chars`,
    `Memory: ${context.memoryPrompt.length} chars`,
    `Knowledge: ${context.knowledgePrompt.length} chars`,
  ]
  
  return lines.join('\n')
}
