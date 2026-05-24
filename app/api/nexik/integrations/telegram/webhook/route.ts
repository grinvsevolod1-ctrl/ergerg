import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'
import { buildNexikPrompt } from '@/lib/nexik/persona'
import { 
  getOrCreateVisitor, 
  saveMessage, 
  getRecentMessages,
  analyzeSentiment,
  extractFacts 
} from '@/lib/nexik/memory'

const PYTHON_SERVICE_URL = process.env.TELEGRAM_SERVICE_URL || 'http://localhost:8005'

interface TelegramMessage {
  message_id: number
  chat: {
    id: number
    type: string
    title?: string
    username?: string
    first_name?: string
    last_name?: string
  }
  from?: {
    id: number
    is_bot: boolean
    first_name?: string
    last_name?: string
    username?: string
    phone_number?: string
  }
  text?: string
  voice?: {
    file_id: string
    duration: number
  }
  photo?: Array<{
    file_id: string
    width: number
    height: number
  }>
  sticker?: {
    file_id: string
    emoji?: string
  }
  date: number
  reply_to_message?: {
    message_id: number
  }
}

interface TelegramIncomingEvent {
  integration_id: string
  org_id: string
  message: TelegramMessage
}

// Get integration by ID
async function getIntegration(integrationId: string) {
  const result = await query<{
    id: string
    org_id: string
    platform_id: string
    access_token: string
    is_active: boolean
    settings: Record<string, unknown>
  }>(
    `SELECT id, org_id, platform_id, access_token, is_active, settings 
     FROM nexik_integrations 
     WHERE id = $1 AND platform = 'telegram' AND is_active = true`,
    [integrationId]
  )
  return result[0] || null
}

// Get Telegram settings for integration
async function getTelegramSettings(integrationId: string) {
  const result = await query<{
    respond_to_all: boolean
    respond_to_questions_only: boolean
    process_text: boolean
    process_voice: boolean
    process_stickers: boolean
    typing_delay_ms: number
    response_delay_ms: number
    auto_reply_enabled: boolean
  }>(
    `SELECT * FROM nexik_telegram_settings WHERE integration_id = $1`,
    [integrationId]
  )
  
  // Return defaults if no settings
  return result[0] || {
    respond_to_all: true,
    respond_to_questions_only: false,
    process_text: true,
    process_voice: true,
    process_stickers: false,
    typing_delay_ms: 1000,
    response_delay_ms: 2000,
    auto_reply_enabled: true
  }
}

// Check if message should be ignored based on exceptions
async function shouldIgnoreMessage(
  orgId: string, 
  integrationId: string,
  message: TelegramMessage
): Promise<{ ignore: boolean; reason?: string }> {
  const exceptions = await query<{
    exception_type: string
    value: string
    value_normalized: string
    mode: string
  }>(
    `SELECT exception_type, value, value_normalized, mode 
     FROM nexik_telegram_exceptions 
     WHERE org_id = $1 AND (integration_id = $2 OR integration_id IS NULL) AND is_active = true`,
    [orgId, integrationId]
  )
  
  for (const exc of exceptions) {
    const { exception_type, value_normalized, mode } = exc
    
    switch (exception_type) {
      case 'user':
        // Check by username or user ID
        if (message.from?.username?.toLowerCase() === value_normalized ||
            message.from?.id?.toString() === exc.value) {
          return { ignore: mode === 'ignore', reason: `User exception: ${exc.value}` }
        }
        break
        
      case 'chat':
        // Check by chat ID or username
        if (message.chat.id.toString() === exc.value ||
            message.chat.username?.toLowerCase() === value_normalized) {
          return { ignore: mode === 'ignore', reason: `Chat exception: ${exc.value}` }
        }
        break
        
      case 'keyword':
        // Check if message contains keyword
        if (message.text?.toLowerCase().includes(value_normalized || '')) {
          return { ignore: mode === 'ignore', reason: `Keyword exception: ${exc.value}` }
        }
        break
        
      case 'phrase':
        // Check if message contains exact phrase
        if (message.text?.toLowerCase().includes(value_normalized || '')) {
          return { ignore: mode === 'ignore', reason: `Phrase exception: ${exc.value}` }
        }
        break
        
      case 'regex':
        // Check regex pattern
        try {
          const regex = new RegExp(exc.value, 'i')
          if (message.text && regex.test(message.text)) {
            return { ignore: mode === 'ignore', reason: `Regex exception: ${exc.value}` }
          }
        } catch {
          // Invalid regex, skip
        }
        break
    }
  }
  
  return { ignore: false }
}

// Get or create telegram chat record
async function getOrCreateTelegramChat(
  orgId: string,
  integrationId: string,
  message: TelegramMessage
) {
  const chatId = message.chat.id
  
  // Try to find existing chat
  const existing = await query<{
    id: string
    conversation_id: string | null
  }>(
    `SELECT id, conversation_id FROM nexik_telegram_chats 
     WHERE integration_id = $1 AND telegram_chat_id = $2`,
    [integrationId, chatId]
  )
  
  if (existing[0]) {
    return existing[0]
  }
  
  // Create new chat record
  const participantName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean).join(' ') || message.from?.username || 'Unknown'
  
  const result = await query<{ id: string }>(
    `INSERT INTO nexik_telegram_chats (
      org_id, integration_id, telegram_chat_id, chat_type, chat_title, chat_username,
      participant_id, participant_name, participant_username
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id`,
    [
      orgId,
      integrationId,
      chatId,
      message.chat.type,
      message.chat.title || participantName,
      message.chat.username,
      message.from?.id,
      participantName,
      message.from?.username
    ]
  )
  
  return { id: result[0].id, conversation_id: null }
}

// Create nexik conversation for telegram chat
async function createNexikConversation(
  orgId: string,
  telegramChatId: string,
  message: TelegramMessage
) {
  const visitorId = `tg_${message.chat.id}`
  const visitorName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean).join(' ') || message.from?.username || 'Telegram User'
  
  const result = await query<{ id: string }>(
    `INSERT INTO nexik_conversations (
      org_id, visitor_id, visitor_name, status, first_message_at, last_message_at
    ) VALUES ($1, $2, $3, 'active', NOW(), NOW())
    RETURNING id`,
    [orgId, visitorId, visitorName]
  )
  
  // Link conversation to telegram chat
  await execute(
    `UPDATE nexik_telegram_chats SET conversation_id = $1, updated_at = NOW() WHERE id = $2`,
    [result[0].id, telegramChatId]
  )
  
  return result[0].id
}

// Save telegram message to database
async function saveTelegramMessage(
  orgId: string,
  integrationId: string,
  chatDbId: string,
  message: TelegramMessage,
  isOutgoing: boolean = false,
  content?: string,
  nexikMessageId?: string
) {
  const messageType = message.voice ? 'voice' : 
                      message.photo ? 'photo' : 
                      message.sticker ? 'sticker' : 'text'
  
  const senderName = isOutgoing ? 'Nexik AI' : 
    [message.from?.first_name, message.from?.last_name].filter(Boolean).join(' ')
  
  await query(
    `INSERT INTO nexik_telegram_messages (
      org_id, integration_id, chat_id, telegram_message_id, telegram_chat_id,
      sender_id, sender_name, sender_username, is_outgoing,
      message_type, content, telegram_date, nexik_message_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, to_timestamp($12), $13)
    ON CONFLICT (integration_id, telegram_message_id) DO NOTHING`,
    [
      orgId,
      integrationId,
      chatDbId,
      message.message_id,
      message.chat.id,
      isOutgoing ? null : message.from?.id,
      senderName,
      isOutgoing ? null : message.from?.username,
      isOutgoing,
      messageType,
      content || message.text,
      message.date,
      nexikMessageId
    ]
  )
}

// Send typing indicator
async function sendTypingIndicator(sessionString: string, chatId: number) {
  try {
    await fetch(`${PYTHON_SERVICE_URL}/send-typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_string: sessionString, chat_id: chatId })
    })
  } catch {
    // Ignore typing indicator errors
  }
}

// Send message via Python service
async function sendTelegramMessage(
  sessionString: string, 
  chatId: number, 
  text: string,
  replyToMessageId?: number
) {
  const response = await fetch(`${PYTHON_SERVICE_URL}/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      session_string: sessionString, 
      chat_id: chatId, 
      text,
      reply_to_message_id: replyToMessageId
    })
  })
  return response.json()
}

// Get business profile for context
async function getBusinessProfile(orgId: string) {
  const result = await query<{
    business_name: string
    short_description: string
    full_description: string
    services: string[]
    products: string[]
    faq: Array<{ question: string; answer: string }>
    brand_voice: string
  }>(
    `SELECT business_name, short_description, full_description, services, products, faq, brand_voice
     FROM nexik_business_profiles WHERE org_id = $1`,
    [orgId]
  )
  return result[0] || null
}

// Generate AI response
async function generateAIResponse(
  orgId: string,
  visitorId: string,
  conversationId: string,
  messageText: string,
  senderName?: string
) {
  // Get visitor and recent messages
  const visitor = await getOrCreateVisitor(visitorId)
  const recentMessages = await getRecentMessages(visitorId, 10)
  const businessProfile = await getBusinessProfile(orgId)
  
  // Analyze input
  const sentiment = analyzeSentiment(messageText)
  const facts = extractFacts(messageText)
  
  // Save user message
  await saveMessage(visitorId, conversationId, 'user', messageText, { 
    sentiment, 
    extractedFacts: facts,
    source: 'telegram'
  })
  
  // Build conversation history
  const historyForAI = recentMessages.slice(-8).map(m => ({ 
    role: m.role as 'user' | 'assistant', 
    content: m.content 
  }))
  
  // Build system prompt with business context
  let businessContext = ''
  if (businessProfile) {
    businessContext = `
Ты представляешь бизнес: ${businessProfile.business_name || 'компанию клиента'}.
${businessProfile.short_description ? `Описание: ${businessProfile.short_description}` : ''}
${businessProfile.services?.length ? `Услуги: ${businessProfile.services.join(', ')}` : ''}
${businessProfile.products?.length ? `Продукты: ${businessProfile.products.join(', ')}` : ''}
Стиль общения: ${businessProfile.brand_voice || 'профессиональный, но дружелюбный'}.
`
  }
  
  const systemPrompt = buildNexikPrompt({
    mode: 'telegram',
    visitorName: senderName || visitor.name,
    businessContext,
    emotionalState: visitor.emotionalState
  })
  
  // Generate AI response
  const aiResult = await routedChat(
    'simple',
    [...historyForAI, { role: 'user', content: messageText }],
    {
      model: AI_SERVERS.fast.defaultModel,
      system: systemPrompt,
      temperature: 0.8,
      maxTokens: 300
    }
  )
  
  // Save AI response
  await saveMessage(visitorId, conversationId, 'assistant', aiResult.response, {
    source: 'telegram'
  })
  
  return aiResult.response
}

// Check if message is a question
function isQuestion(text: string): boolean {
  const questionPatterns = [
    /\?$/, // Ends with ?
    /^(как|что|где|когда|почему|зачем|кто|какой|какая|сколько|можно|есть ли)/i,
    /^(what|how|where|when|why|who|which|can|is|are|do|does|will)/i
  ]
  return questionPatterns.some(p => p.test(text.trim()))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TelegramIncomingEvent
    console.log('[Telegram Webhook] Received:', JSON.stringify(body, null, 2))
    
    const { integration_id, org_id, message } = body
    
    if (!integration_id || !message) {
      return NextResponse.json({ ok: true, skipped: 'missing_data' })
    }
    
    // Get integration
    const integration = await getIntegration(integration_id)
    if (!integration) {
      console.log(`[Telegram Webhook] Integration not found: ${integration_id}`)
      return NextResponse.json({ ok: true, skipped: 'integration_not_found' })
    }
    
    // Get settings
    const settings = await getTelegramSettings(integration_id)
    
    // Determine message type
    const messageType = message.voice ? 'voice' : 
                        message.photo ? 'photo' : 
                        message.sticker ? 'sticker' : 'text'
    
    // Check message type filters
    if (messageType === 'text' && !settings.process_text) {
      return NextResponse.json({ ok: true, skipped: 'text_disabled' })
    }
    if (messageType === 'voice' && !settings.process_voice) {
      return NextResponse.json({ ok: true, skipped: 'voice_disabled' })
    }
    if (messageType === 'sticker' && !settings.process_stickers) {
      return NextResponse.json({ ok: true, skipped: 'sticker_disabled' })
    }
    
    // Check exceptions
    const exceptionCheck = await shouldIgnoreMessage(org_id || integration.org_id, integration_id, message)
    if (exceptionCheck.ignore) {
      console.log(`[Telegram Webhook] Message ignored: ${exceptionCheck.reason}`)
      return NextResponse.json({ ok: true, skipped: 'exception', reason: exceptionCheck.reason })
    }
    
    // Get or create telegram chat
    const chatRecord = await getOrCreateTelegramChat(
      org_id || integration.org_id, 
      integration_id, 
      message
    )
    
    // Get or create nexik conversation
    let conversationId = chatRecord.conversation_id
    if (!conversationId) {
      conversationId = await createNexikConversation(
        org_id || integration.org_id,
        chatRecord.id,
        message
      )
    }
    
    // Save incoming message
    await saveTelegramMessage(
      org_id || integration.org_id,
      integration_id,
      chatRecord.id,
      message,
      false,
      message.text
    )
    
    // Check if we should respond
    const messageText = message.text || ''
    
    if (!settings.auto_reply_enabled) {
      return NextResponse.json({ ok: true, skipped: 'auto_reply_disabled' })
    }
    
    if (settings.respond_to_questions_only && !isQuestion(messageText)) {
      return NextResponse.json({ ok: true, skipped: 'not_a_question' })
    }
    
    // Skip if no text content
    if (!messageText.trim()) {
      return NextResponse.json({ ok: true, skipped: 'no_text' })
    }
    
    // Send typing indicator
    if (settings.typing_delay_ms > 0) {
      await sendTypingIndicator(integration.access_token, message.chat.id)
      await new Promise(resolve => setTimeout(resolve, settings.typing_delay_ms))
    }
    
    // Generate AI response
    const visitorId = `tg_${message.chat.id}`
    const senderName = [message.from?.first_name, message.from?.last_name]
      .filter(Boolean).join(' ')
    
    const aiResponse = await generateAIResponse(
      org_id || integration.org_id,
      visitorId,
      conversationId,
      messageText,
      senderName
    )
    
    // Add response delay for more natural feel
    if (settings.response_delay_ms > 0) {
      await new Promise(resolve => setTimeout(resolve, settings.response_delay_ms))
    }
    
    // Send response
    const sendResult = await sendTelegramMessage(
      integration.access_token,
      message.chat.id,
      aiResponse,
      message.message_id
    )
    
    // Save outgoing message if send was successful
    if (sendResult.success && sendResult.message_id) {
      const outgoingMessage = { ...message, message_id: sendResult.message_id }
      await saveTelegramMessage(
        org_id || integration.org_id,
        integration_id,
        chatRecord.id,
        outgoingMessage,
        true,
        aiResponse
      )
    }
    
    // Update last message timestamp
    await execute(
      `UPDATE nexik_telegram_chats 
       SET last_message_id = $1, last_message_at = NOW(), updated_at = NOW() 
       WHERE id = $2`,
      [message.message_id, chatRecord.id]
    )
    
    // Update conversation
    await execute(
      `UPDATE nexik_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [conversationId]
    )
    
    return NextResponse.json({ 
      ok: true, 
      responded: true,
      response_length: aiResponse.length
    })
    
  } catch (error) {
    console.error('[Telegram Webhook] Error:', error)
    return NextResponse.json({ ok: true, error: String(error) })
  }
}

// Webhook verification (for initial setup)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('hub.verify_token') || searchParams.get('token')
  const challenge = searchParams.get('hub.challenge') || searchParams.get('challenge')
  
  const expectedToken = process.env.TELEGRAM_WEBHOOK_TOKEN || 'nexik_telegram_2024'
  
  if (token === expectedToken) {
    return new Response(challenge || 'OK', { status: 200 })
  }
  
  return new Response('Forbidden', { status: 403 })
}
