import { NextRequest, NextResponse } from 'next/server'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'
import { buildNexikPrompt } from '@/lib/nexik/persona'
import { query } from '@/lib/db'
import {
  getOrCreateVisitor,
  updateVisitor,
  saveMessage,
  getRecentMessages,
  getActivePromises,
  analyzeSentiment,
  extractFacts,
  extractPromises,
  generateVisitorContext
} from '@/lib/nexik/memory'

type MessageIntent =
  | 'greeting' | 'about_nexik' | 'business_description' | 'price_question'
  | 'how_it_works' | 'general_chat' | 'off_topic' | 'rude' | 'unclear'

function detectIntent(input: string): MessageIntent {
  const lower = input.toLowerCase()
  if (/^(привет|хай|здравствуй|добрый|hello|hi|здарова|ку)/i.test(lower)) return 'greeting'
  if (/расскаж|что ты умеешь|кто ты|о себе|твои возможности/.test(lower)) return 'about_nexik'
  if (/магазин|салон|авто|ресторан|кафе|клиника|фитнес|услуги|бизнес/.test(lower)) return 'business_description'
  if (/сколько стоит|цена|стоимость|тариф/.test(lower)) return 'price_question'
  if (/как работает|настроить|подключить/.test(lower)) return 'how_it_works'
  if (/хуй|пизд|ебан|сука|блять|соси/.test(lower)) return 'rude'
  return 'general_chat'
}

// Простая round-robin балансировка
let serverIndex = 0
const serverList = Object.keys(AI_SERVERS)

function getNextServer(): string {
  const server = serverList[serverIndex % serverList.length]
  serverIndex++
  return server
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { input, conversationHistory = [], visitorId = `visitor_${Date.now()}`, conversationId = `conv_${Date.now()}` } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    const visitor = await getOrCreateVisitor(visitorId)
    const recentMessages = await getRecentMessages(visitorId, 10)
    const activePromises = await getActivePromises(visitorId)

    const intent = detectIntent(input)
    const sentiment = analyzeSentiment(input)
    const facts = extractFacts(input)

    await saveMessage(visitorId, conversationId, 'user', input, { sentiment, intent, extractedFacts: facts })

    const visitorContext = await generateVisitorContext(visitorId)

    const historyForAI = recentMessages.length > 0
      ? recentMessages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      : conversationHistory.slice(-8).map((m: { role: string; content: string }) => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const systemPrompt = buildNexikPrompt({
      mode: 'demo',
      visitorName: visitor.name,
      visitorHistory: visitorContext,
      businessContext: visitor.businessDescription,
      previousPromises: activePromises,
      emotionalState: visitor.emotionalState
    })

    // Выбираем сервер по round-robin
    const selectedServer = getNextServer()
    const serverConfig = AI_SERVERS[selectedServer]
    
    console.log(`[Nexik] Using server: ${selectedServer}, model: ${serverConfig.defaultModel}`)

    // Прямой вызов AI
    const aiResult = await routedChat(
      'simple',
      [...historyForAI, { role: 'user', content: input }],
      {
        model: serverConfig.defaultModel,
        system: systemPrompt,
        temperature: 0.8,
        maxTokens: 250,
        preferServer: selectedServer
      }
    )

    const promises = extractPromises(aiResult.response)
    await saveMessage(visitorId, conversationId, 'assistant', aiResult.response, { intent, promises })

    return NextResponse.json({
      response: aiResult.response,
      isValidBusiness: false,
      businessType: null,
      intent,
      sentiment,
      visitorId,
      serverUsed: selectedServer,
      source: 'ai_v3',
      timeMs: Date.now() - startTime
    })

  } catch (error) {
    console.error('[Nexik API] Error:', error)
    return NextResponse.json({
      response: 'Ошибка AI. Попробуй ещё раз или напиши позже.',
      isValidBusiness: false,
      source: 'error',
      timeMs: Date.now() - startTime
    })
  }
}
