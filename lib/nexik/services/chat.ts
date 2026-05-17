/**
 * Nexik Chat Service
 * Handles message processing, AI responses, and real-time updates
 */

import { 
  getOrCreateConversation,
  addMessage,
  getConversation,
  updateVisitorInfo,
  markMessagesRead,
  type Message,
  type Conversation
} from '../db/conversations'
import { getWidget, type Widget, type QuickReply } from '../db/widgets'
import { getOrganization, incrementMessagesUsed, checkMessageLimit } from '../db/organizations'
import { getRAGContextForPrompt } from '../db/knowledge'
import { getOllamaClient } from '@/lib/ai/providers'
import { getConfig } from '@/lib/ai/config'
import { 
  getOrgTelegramConfig, 
  notifyNewMessage, 
  notifyNewConversation,
  notifyOperatorRequest 
} from './telegram'
import { pushEvent } from '@/app/api/nexik/events/route'

// Schedule types
interface Schedule {
  mode: 'ai_only' | 'operator_only' | 'hybrid'
  work_hours: { start: string; end: string }
  work_days: string[]
  timezone: string
}

/**
 * Check if current time is within operator working hours
 */
function isWithinSchedule(schedule: Schedule): boolean {
  if (schedule.mode === 'ai_only') return true
  if (schedule.mode === 'operator_only') return false
  
  // Hybrid mode - check time
  const now = new Date()
  
  // Get current time in schedule timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short'
  })
  
  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3) || ''
  
  // Check day
  const dayMap: Record<string, string> = { 'mon': 'mon', 'tue': 'tue', 'wed': 'wed', 'thu': 'thu', 'fri': 'fri', 'sat': 'sat', 'sun': 'sun' }
  if (!schedule.work_days.includes(dayMap[weekday] || weekday)) {
    return true // AI responds outside work days
  }
  
  // Check time
  const currentMinutes = hour * 60 + minute
  const [startH, startM] = schedule.work_hours.start.split(':').map(Number)
  const [endH, endM] = schedule.work_hours.end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  // Outside work hours - AI responds
  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return true
  }
  
  // Within work hours - operator should respond
  return false
}

/**
 * Get schedule for widget/org
 */
async function getSchedule(orgId: string, widgetId?: string): Promise<Schedule | null> {
  try {
    const { query } = await import('@/lib/db')
    
    const schedules = await query<Schedule>(
      `SELECT mode, work_hours, work_days, timezone FROM nexik_schedules 
       WHERE org_id = $1 AND (widget_id = $2 OR widget_id IS NULL)
       ORDER BY widget_id DESC NULLS LAST
       LIMIT 1`,
      [orgId, widgetId]
    )
    
    return schedules[0] || null
  } catch {
    return null
  }
}

export interface ChatRequest {
  org_id: string
  widget_id?: string
  visitor_id: string
  message: string
  visitor_info?: {
    name?: string
    email?: string
    phone?: string
    metadata?: Record<string, unknown>
  }
  page_url?: string
  page_title?: string
}

export interface ChatResponse {
  conversation_id: string
  message: Message
  ai_response?: Message
  quota_remaining?: number
}

export async function processMessage(request: ChatRequest): Promise<ChatResponse> {
  const startTime = Date.now()

  // Get or create conversation
  const { conversation, isNew } = await getOrCreateConversation({
    org_id: request.org_id,
    widget_id: request.widget_id,
    visitor_id: request.visitor_id,
    page_url: request.page_url
  })

  // Update visitor info if provided
  if (request.visitor_info) {
    await updateVisitorInfo(conversation.id, request.visitor_info)
  }

  // Save visitor message
  const visitorMessage = await addMessage({
    conversation_id: conversation.id,
    org_id: request.org_id,
    sender_type: 'visitor',
    content: request.message
  })

  // Check message quota
  const quotaCheck = await checkMessageLimit(request.org_id)
  if (!quotaCheck.allowed) {
    const systemMessage = await addMessage({
      conversation_id: conversation.id,
      org_id: request.org_id,
      sender_type: 'system',
      content: 'Лимит сообщений исчерпан. Пожалуйста, обновите тарифный план.'
    })
    return {
      conversation_id: conversation.id,
      message: visitorMessage,
      ai_response: systemMessage,
      quota_remaining: 0
    }
  }

  // Get widget config
  const widget = request.widget_id ? await getWidget(request.widget_id) : null
  
  // Check schedule - should AI respond or wait for operator?
  const schedule = await getSchedule(request.org_id, request.widget_id || undefined)
  const aiShouldRespond = !schedule || isWithinSchedule(schedule)
  
  // Generate AI response if enabled and schedule allows
  let aiResponse: Message | undefined
  
  // Send real-time event for new message
  pushEvent(request.org_id, {
    type: 'new_message',
    data: {
      conversationId: conversation.id,
      message: visitorMessage,
      isNew
    }
  })

  // Send Telegram notification for new conversations
  if (isNew) {
    const telegramConfig = await getOrgTelegramConfig(request.org_id)
    if (telegramConfig) {
      await notifyNewConversation(telegramConfig, {
        conversationId: conversation.id,
        visitorName: request.visitor_info?.name,
        visitorEmail: request.visitor_info?.email,
        visitorPhone: request.visitor_info?.phone,
        firstMessage: request.message,
        pageUrl: request.page_url,
        dashboardUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://netnext.site/nexik/dashboard'
      })
    }
    
    // Send real-time event for new conversation
    pushEvent(request.org_id, {
      type: 'new_conversation',
      data: {
        conversationId: conversation.id,
        visitor: request.visitor_info
      }
    })
  }

  if (!aiShouldRespond) {
    // Schedule says operator should respond - send waiting message
    aiResponse = await addMessage({
      conversation_id: conversation.id,
      org_id: request.org_id,
      sender_type: 'system',
      content: 'Оператор скоро ответит. Обычно мы отвечаем в течение нескольких минут.',
      quick_replies: []
    })
    
    // Send Telegram notification - operator needed
    const telegramConfig = await getOrgTelegramConfig(request.org_id)
    if (telegramConfig) {
      await notifyNewMessage(telegramConfig, {
        conversationId: conversation.id,
        visitorName: request.visitor_info?.name,
        message: request.message,
        pageUrl: request.page_url,
        dashboardUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://netnext.site/nexik/dashboard'
      })
    }
    
  } else if (widget?.ai_enabled !== false) {
    try {
      aiResponse = await generateAIResponse(
        conversation,
        request.message,
        widget,
        request.org_id,
        startTime
      )
      
      // Increment usage
      await incrementMessagesUsed(request.org_id, 1)
    } catch (error) {
      console.error('[Nexik Chat] AI response failed:', error)
      
      // Send fallback message
      aiResponse = await addMessage({
        conversation_id: conversation.id,
        org_id: request.org_id,
        sender_type: 'system',
        content: 'AI-ассистент временно недоступен. Оператор скоро ответит.',
        quick_replies: [
          { id: 'qr-operator', label: 'Позвать оператора', message: '/operator' }
        ]
      })
    }
  }

  return {
    conversation_id: conversation.id,
    message: visitorMessage,
    ai_response: aiResponse,
    quota_remaining: quotaCheck.remaining
  }
}

async function generateAIResponse(
  conversation: Conversation,
  userMessage: string,
  widget: Widget | null,
  orgId: string,
  startTime: number
): Promise<Message> {
  const config = getConfig()
  const client = getOllamaClient()

  // Get RAG context
  const ragContext = await getRAGContextForPrompt(orgId, userMessage, 3)
  const ragUsed = !!ragContext

  // Build system prompt
  const systemPrompt = buildSystemPrompt(widget, ragContext)

  // Get conversation history (last 10 messages for context)
  const history = await getConversationHistory(conversation.id, 10)

  // Build messages array
  const messages = history.map(m => ({
    role: m.sender_type === 'visitor' ? 'user' as const : 'assistant' as const,
    content: m.content
  }))
  messages.push({ role: 'user' as const, content: userMessage })

  // Call Ollama
  const response = await client.chat(messages, {
    system: systemPrompt,
    temperature: widget?.ai_temperature || config.temperature,
    maxTokens: widget?.ai_max_tokens || config.maxTokens
  })

  const responseTime = Date.now() - startTime

  // Extract quick replies if AI suggested them
  const quickReplies = extractQuickReplies(response)

  // Save AI message
  return addMessage({
    conversation_id: conversation.id,
    org_id: orgId,
    sender_type: 'ai',
    content: cleanResponse(response),
    ai_model: widget?.ai_model || config.model,
    ai_response_time_ms: responseTime,
    rag_context_used: ragUsed,
    quick_replies: quickReplies
  })
}

function buildSystemPrompt(widget: Widget | null, ragContext: string | null): string {
  let prompt = widget?.system_prompt || `Ты — AI-ассистент. Отвечай вежливо и профессионально.
Если не знаешь ответа — честно скажи об этом и предложи связаться с оператором.
Отвечай кратко, но информативно. Не выдумывай информацию.`

  if (ragContext) {
    prompt += `\n\n${ragContext}\n\nИспользуй информацию из контекста выше для ответа. Если вопрос не связан с контекстом, отвечай на основе общих знаний.`
  }

  return prompt
}

async function getConversationHistory(conversationId: string, limit: number): Promise<Message[]> {
  const { query } = await import('@/lib/db')
  
  const messages = await query<Message>(
    `SELECT * FROM nexik_messages 
     WHERE conversation_id = $1 AND sender_type IN ('visitor', 'ai', 'operator')
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit]
  )
  
  return messages.reverse()
}

function extractQuickReplies(response: string): QuickReply[] {
  // Simple extraction - look for numbered options or bullet points
  const replies: QuickReply[] = []
  
  // Match patterns like "1. Option" or "• Option"
  const matches = response.match(/(?:^\d+\.\s*|^[•-]\s*)(.{5,50})$/gm)
  
  if (matches && matches.length >= 2 && matches.length <= 4) {
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const label = match.replace(/^[\d.•-\s]+/, '').trim()
      if (label.length > 3 && label.length < 50) {
        replies.push({ id: `qr-${Date.now()}-${i}`, label, message: label })
      }
    }
  }
  
  return replies
}

function cleanResponse(response: string): string {
  // Remove any markdown artifacts or excessive whitespace
  return response
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// Operator functions
export async function sendOperatorMessage(
  conversationId: string,
  operatorId: string,
  operatorName: string,
  content: string
): Promise<Message> {
  const conversation = await getConversation(conversationId)
  if (!conversation) {
    throw new Error('Conversation not found')
  }

  return addMessage({
    conversation_id: conversationId,
    org_id: conversation.org_id,
    sender_type: 'operator',
    sender_id: operatorId,
    sender_name: operatorName,
    content
  })
}

// Mark visitor messages as read
export async function markConversationRead(conversationId: string): Promise<void> {
  await markMessagesRead(conversationId, 'visitor')
}

// System messages
export async function sendSystemMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  const conversation = await getConversation(conversationId)
  if (!conversation) {
    throw new Error('Conversation not found')
  }

  return addMessage({
    conversation_id: conversationId,
    org_id: conversation.org_id,
    sender_type: 'system',
    content
  })
}
