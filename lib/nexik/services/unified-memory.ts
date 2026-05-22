/**
 * Nexik Unified Memory System
 * 
 * Единая память между всеми страницами и сессиями.
 * Сохраняет: разговоры, бизнес-инфу, предпочтения, контекст.
 * Работает через localStorage + sessionStorage + серверную память.
 */

import { v4 as uuidv4 } from 'uuid'

// ============================================
// TYPES
// ============================================

export interface NexikVisitor {
  id: string
  createdAt: Date
  lastSeenAt: Date
  
  // Identity (собирается постепенно)
  name?: string
  email?: string
  phone?: string
  
  // Business info (из onboarding)
  businessType?: string
  businessDescription?: string
  businessNiche?: string
  platforms?: string[]
  goals?: string[]
  
  // Preferences
  language: string
  timezone?: string
  
  // Stats
  totalMessages: number
  totalSessions: number
  
  // Extracted facts (AI learns about user)
  facts: string[]
  interests: string[]
  painPoints: string[]
}

export interface NexikConversation {
  id: string
  visitorId: string
  startedAt: Date
  lastMessageAt: Date
  page: string  // где начался разговор
  
  messages: NexikMessage[]
  
  // Context
  businessContext?: {
    type: string
    description: string
    platforms: string[]
  }
  
  // State
  stage: 'greeting' | 'discovery' | 'demo' | 'onboarding' | 'active'
  isComplete: boolean
}

export interface NexikMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  
  // Metadata
  intent?: string
  sentiment?: string
  extractedFacts?: string[]
}

export interface NexikMemoryState {
  visitor: NexikVisitor
  currentConversation: NexikConversation | null
  allConversations: NexikConversation[]
}

// ============================================
// STORAGE KEYS
// ============================================

const VISITOR_KEY = 'nexik_visitor'
const CONVERSATIONS_KEY = 'nexik_conversations'
const CURRENT_CONV_KEY = 'nexik_current_conversation'

// ============================================
// VISITOR MANAGEMENT
// ============================================

/**
 * Get or create visitor
 */
export function getOrCreateVisitor(): NexikVisitor {
  if (typeof window === 'undefined') {
    return createNewVisitor()
  }
  
  try {
    const stored = localStorage.getItem(VISITOR_KEY)
    if (stored) {
      const visitor = JSON.parse(stored) as NexikVisitor
      visitor.createdAt = new Date(visitor.createdAt)
      visitor.lastSeenAt = new Date()
      
      // Update last seen
      saveVisitor(visitor)
      return visitor
    }
  } catch {
    // Ignore
  }
  
  const visitor = createNewVisitor()
  saveVisitor(visitor)
  return visitor
}

function createNewVisitor(): NexikVisitor {
  return {
    id: uuidv4(),
    createdAt: new Date(),
    lastSeenAt: new Date(),
    language: typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'ru',
    totalMessages: 0,
    totalSessions: 0,
    facts: [],
    interests: [],
    painPoints: [],
  }
}

export function saveVisitor(visitor: NexikVisitor): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor))
  } catch {
    // Ignore
  }
}

export function updateVisitor(updates: Partial<NexikVisitor>): NexikVisitor {
  const visitor = getOrCreateVisitor()
  const updated = { ...visitor, ...updates, lastSeenAt: new Date() }
  saveVisitor(updated)
  return updated
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================

/**
 * Get current conversation or create new one
 */
export function getCurrentConversation(page: string = 'unknown'): NexikConversation {
  if (typeof window === 'undefined') {
    return createNewConversation(getOrCreateVisitor().id, page)
  }
  
  try {
    // First check session storage for current conversation
    const current = sessionStorage.getItem(CURRENT_CONV_KEY)
    if (current) {
      const conv = JSON.parse(current) as NexikConversation
      conv.startedAt = new Date(conv.startedAt)
      conv.lastMessageAt = new Date(conv.lastMessageAt)
      conv.messages = conv.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }))
      return conv
    }
  } catch {
    // Ignore
  }
  
  // No current conversation - create new
  const visitor = getOrCreateVisitor()
  const conv = createNewConversation(visitor.id, page)
  saveCurrentConversation(conv)
  
  // Update visitor stats
  updateVisitor({ totalSessions: visitor.totalSessions + 1 })
  
  return conv
}

function createNewConversation(visitorId: string, page: string): NexikConversation {
  return {
    id: uuidv4(),
    visitorId,
    startedAt: new Date(),
    lastMessageAt: new Date(),
    page,
    messages: [],
    stage: 'greeting',
    isComplete: false,
  }
}

export function saveCurrentConversation(conv: NexikConversation): void {
  if (typeof window === 'undefined') return
  
  try {
    sessionStorage.setItem(CURRENT_CONV_KEY, JSON.stringify(conv))
    
    // Also save to localStorage for persistence
    const allConvs = getAllConversations()
    const idx = allConvs.findIndex(c => c.id === conv.id)
    if (idx >= 0) {
      allConvs[idx] = conv
    } else {
      allConvs.push(conv)
    }
    // Keep last 20 conversations
    const limited = allConvs.slice(-20)
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(limited))
  } catch {
    // Ignore
  }
}

export function getAllConversations(): NexikConversation[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY)
    if (stored) {
      const convs = JSON.parse(stored) as NexikConversation[]
      return convs.map(c => ({
        ...c,
        startedAt: new Date(c.startedAt),
        lastMessageAt: new Date(c.lastMessageAt),
        messages: c.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }))
    }
  } catch {
    // Ignore
  }
  return []
}

// ============================================
// MESSAGE MANAGEMENT
// ============================================

/**
 * Add message to current conversation
 */
export function addMessage(
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata?: Partial<NexikMessage>
): NexikMessage {
  const conv = getCurrentConversation()
  
  const message: NexikMessage = {
    id: uuidv4(),
    role,
    content,
    timestamp: new Date(),
    ...metadata,
  }
  
  conv.messages.push(message)
  conv.lastMessageAt = new Date()
  
  // Update visitor stats
  if (role === 'user') {
    const visitor = getOrCreateVisitor()
    updateVisitor({ totalMessages: visitor.totalMessages + 1 })
  }
  
  saveCurrentConversation(conv)
  return message
}

/**
 * Get conversation history for AI context
 */
export function getConversationHistory(limit: number = 20): Array<{ role: string; content: string }> {
  const conv = getCurrentConversation()
  return conv.messages.slice(-limit).map(m => ({
    role: m.role,
    content: m.content
  }))
}

// ============================================
// BUSINESS CONTEXT
// ============================================

/**
 * Update business context (from onboarding)
 */
export function updateBusinessContext(context: {
  type?: string
  description?: string
  platforms?: string[]
  niche?: string
  goals?: string[]
}): void {
  const visitor = getOrCreateVisitor()
  const conv = getCurrentConversation()
  
  // Update visitor
  updateVisitor({
    businessType: context.type || visitor.businessType,
    businessDescription: context.description || visitor.businessDescription,
    businessNiche: context.niche || visitor.businessNiche,
    platforms: context.platforms || visitor.platforms,
    goals: context.goals || visitor.goals,
  })
  
  // Update conversation context
  conv.businessContext = {
    type: context.type || conv.businessContext?.type || '',
    description: context.description || conv.businessContext?.description || '',
    platforms: context.platforms || conv.businessContext?.platforms || [],
  }
  
  saveCurrentConversation(conv)
}

/**
 * Get business context for AI
 */
export function getBusinessContext(): string {
  const visitor = getOrCreateVisitor()
  
  const parts: string[] = []
  
  if (visitor.name) {
    parts.push(`Имя клиента: ${visitor.name}`)
  }
  
  if (visitor.businessType) {
    parts.push(`Тип бизнеса: ${visitor.businessType}`)
  }
  
  if (visitor.businessDescription) {
    parts.push(`Описание: ${visitor.businessDescription}`)
  }
  
  if (visitor.platforms && visitor.platforms.length > 0) {
    parts.push(`Платформы: ${visitor.platforms.join(', ')}`)
  }
  
  if (visitor.goals && visitor.goals.length > 0) {
    parts.push(`Цели: ${visitor.goals.join(', ')}`)
  }
  
  if (visitor.facts.length > 0) {
    parts.push(`Известные факты: ${visitor.facts.slice(-5).join('; ')}`)
  }
  
  if (visitor.interests.length > 0) {
    parts.push(`Интересы: ${visitor.interests.slice(-5).join(', ')}`)
  }
  
  if (visitor.painPoints.length > 0) {
    parts.push(`Проблемы: ${visitor.painPoints.slice(-5).join('; ')}`)
  }
  
  return parts.join('\n')
}

// ============================================
// FACT EXTRACTION
// ============================================

/**
 * Add extracted fact about user
 */
export function addFact(fact: string, type: 'fact' | 'interest' | 'painPoint' = 'fact'): void {
  const visitor = getOrCreateVisitor()
  
  switch (type) {
    case 'fact':
      if (!visitor.facts.includes(fact)) {
        visitor.facts.push(fact)
      }
      break
    case 'interest':
      if (!visitor.interests.includes(fact)) {
        visitor.interests.push(fact)
      }
      break
    case 'painPoint':
      if (!visitor.painPoints.includes(fact)) {
        visitor.painPoints.push(fact)
      }
      break
  }
  
  // Keep limited
  visitor.facts = visitor.facts.slice(-20)
  visitor.interests = visitor.interests.slice(-10)
  visitor.painPoints = visitor.painPoints.slice(-10)
  
  saveVisitor(visitor)
}

// ============================================
// STAGE MANAGEMENT
// ============================================

/**
 * Update conversation stage
 */
export function updateStage(stage: NexikConversation['stage']): void {
  const conv = getCurrentConversation()
  conv.stage = stage
  saveCurrentConversation(conv)
}

/**
 * Get current stage
 */
export function getStage(): NexikConversation['stage'] {
  return getCurrentConversation().stage
}

/**
 * Mark conversation as complete (ready to start onboarding)
 */
export function completeDiscovery(): void {
  const conv = getCurrentConversation()
  conv.stage = 'onboarding'
  conv.isComplete = true
  saveCurrentConversation(conv)
}

// ============================================
// FULL STATE
// ============================================

/**
 * Get full memory state
 */
export function getMemoryState(): NexikMemoryState {
  return {
    visitor: getOrCreateVisitor(),
    currentConversation: getCurrentConversation(),
    allConversations: getAllConversations(),
  }
}

/**
 * Clear all memory (for testing)
 */
export function clearMemory(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(VISITOR_KEY)
    localStorage.removeItem(CONVERSATIONS_KEY)
    sessionStorage.removeItem(CURRENT_CONV_KEY)
  } catch {
    // Ignore
  }
}

// ============================================
// SYNC TO SERVER (optional - for persistence across devices)
// ============================================

/**
 * Sync visitor data to server
 */
export async function syncToServer(): Promise<void> {
  const visitor = getOrCreateVisitor()
  const conv = getCurrentConversation()
  
  try {
    await fetch('/api/nexik/visitor-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor,
        currentConversation: conv,
      }),
    })
  } catch {
    // Ignore - sync is optional
  }
}
