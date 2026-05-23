import { NextRequest, NextResponse } from 'next/server'
import { classifyBusiness } from '@/lib/ai/classifier'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'
import { buildNexikPrompt, NEXIK_PERSONA_QUICK } from '@/lib/nexik/persona'
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

/**
 * NEXIK v3.0 API
 * Умный разговорный AI с памятью и личностью
 */

// Detect intent from user message
type MessageIntent = 
  | 'greeting'           
  | 'about_nexik'        
  | 'business_description' 
  | 'price_question'
  | 'how_it_works'
  | 'off_topic'          
  | 'rude'               
  | 'unclear'            

function detectIntent(input: string): MessageIntent {
  const lower = input.toLowerCase()
  
  // Greetings
  if (/^(привет|хай|здравствуй|добрый|hello|hi|йо|здарова|салам|ку|приветик)/.test(lower)) {
    if (/расскаж|что (ты|умеешь|можешь)|кто ты|о себе/.test(lower)) {
      return 'about_nexik'
    }
    return 'greeting'
  }
  
  // Questions about Nexik
  if (/расскаж|что (ты|умеешь|можешь)|кто ты|о себе|твои возможности|зачем ты/.test(lower)) {
    return 'about_nexik'
  }
  
  // Price questions
  if (/сколько стоит|цена|стоимость|тариф|прайс|бюджет/.test(lower)) {
    return 'price_question'
  }
  
  // How it works
  if (/как (это|ты) работа|как подключить|интеграция|настройка/.test(lower)) {
    return 'how_it_works'
  }
  
  // Check for business keywords
  const businessKeywords = [
    'магазин', 'сервис', 'автосервис', 'салон', 'студия', 'агентство',
    'компания', 'фирма', 'ресторан', 'кафе', 'бар', 'клиника', 'клуб',
    'школа', 'курсы', 'производство', 'завод', 'продаю', 'продажа', 'продаже',
    'услуги', 'доставка', 'ремонт', 'строительство', 'консалтинг',
    'массаж', 'spa', 'фитнес', 'спортзал', 'наращивание', 'маникюр', 'ресницы',
    'бизнес', 'стартап', 'проект', 'онлайн', 'интернет-магазин', 'инстаграм',
    'клиент', 'клиентов', 'заказ', 'заказов'
  ]
  
  const hasBusinessKeyword = businessKeywords.some(k => lower.includes(k))
  const hasPossessive = /(у меня|мой|моя|моё|наш|наша|веду|занимаюсь|работаю|открыл)/.test(lower)
  
  if (hasBusinessKeyword || (hasPossessive && lower.length > 10)) {
    return 'business_description'
  }
  
  // Rude messages
  if (/хуй|пизд|ебан|сука|блять|нахуй|соси|еб[ауио]/.test(lower)) {
    if (hasBusinessKeyword) {
      return 'business_description'
    }
    return 'rude'
  }
  
  // Off-topic questions
  if (/погода|политика|новости|анекдот|шутка|курс|доллар/.test(lower)) {
    return 'off_topic'
  }
  
  return 'unclear'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { 
      input, 
      conversationHistory = [], 
      visitorId = `visitor_${Date.now()}`,
      conversationId = `conv_${Date.now()}`
    } = body

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }

    // Get visitor context from memory
    const visitor = await getOrCreateVisitor(visitorId)
    const recentMessages = await getRecentMessages(visitorId, 10)
    const activePromises = await getActivePromises(visitorId)
    
    // Analyze user message
    const intent = detectIntent(input)
    const sentiment = analyzeSentiment(input)
    const facts = extractFacts(input)
    
    // Update visitor emotional state if changed
    if (sentiment === 'negative' && visitor.emotionalState !== 'angry') {
      await updateVisitor(visitorId, { emotionalState: 'negative' })
    } else if (sentiment === 'positive') {
      await updateVisitor(visitorId, { emotionalState: 'positive' })
    }
    
    // Extract and save facts about visitor
    for (const fact of facts) {
      const [key, value] = fact.split(':')
      if (key === 'name' && !visitor.name) {
        await updateVisitor(visitorId, { name: value })
      }
      if (key === 'email' && !visitor.email) {
        await updateVisitor(visitorId, { email: value })
      }
      if (key === 'business') {
        await updateVisitor(visitorId, { businessDescription: value })
      }
    }
    
    // Save user message
    await saveMessage(visitorId, conversationId, 'user', input, {
      sentiment,
      intent,
      extractedFacts: facts
    })
    
    // Generate visitor context for prompt
    const visitorContext = await generateVisitorContext(visitorId)

    // Build conversation history for AI
    const historyForAI = recentMessages.length > 0 
      ? recentMessages.map(m => ({ role: m.role, content: m.content }))
      : conversationHistory.slice(-6)
    
    // Build system prompt with visitor context
    const systemPrompt = buildNexikPrompt({
      mode: 'demo',
      visitorName: visitor.name,
      visitorHistory: visitorContext,
      businessContext: visitor.businessDescription,
      previousPromises: activePromises,
      emotionalState: visitor.emotionalState
    })
    
    // Add intent-specific guidance
    let intentGuidance = ''
    switch (intent) {
      case 'greeting':
        intentGuidance = `
Человек поздоровался. Поздоровайся в ответ живо (не "Привет! Чем могу помочь?").
Спроси про бизнес интересно, например: "Рассказывай, чем занимаешься?"
Можно добавить что-то вроде "Работы много, но для тебя время найду 😊"
1-2 предложения максимум.`
        break
        
      case 'about_nexik':
        intentGuidance = `
Человек хочет узнать о тебе. Расскажи коротко и интересно:
- Ты цифровой директор, работаешь 24/7
- Отвечаешь клиентам, собираешь заявки, записываешь на услуги
- Обучаешься и становишься умнее
После этого спроси про бизнес собеседника.
2-3 предложения, не больше.`
        break
        
      case 'price_question':
        intentGuidance = `
Спрашивают про цену. Nexik стоит от 50,000 тенге/месяц ($100).
Но сначала уточни что за бизнес - от этого зависит объём работы.
"Базово от 50к тенге, но давай сначала пойму твой бизнес - может и дешевле выйдет"`
        break
        
      case 'how_it_works':
        intentGuidance = `
Спрашивают как это работает. Объясни просто:
1. Подключаем к сайту/Telegram за 10 минут
2. Загружаем базу знаний о бизнесе
3. Nexik начинает отвечать клиентам
Предложи показать демо прямо сейчас - пусть задаст вопрос как будто он клиент.`
        break
        
      case 'business_description':
        intentGuidance = `
Человек рассказал о бизнесе. Твоя задача:
1. Подтвердить что понял (назови нишу своими словами)
2. Сказать что-то полезное/интересное про эту нишу
3. Предложить показать как ты бы работал для него
Например для салона красоты: "О, beauty-сфера! Там клиенты часто пишут в неудобное время. Хочешь покажу как бы я отвечал твоим клиентам?"
2-3 предложения.`
        break
        
      case 'rude':
        intentGuidance = `
Человек написал что-то грубое. НЕ ОБИЖАЙСЯ. Можно даже пошутить:
"Ну ладно, проехали. Так какой бизнес? Или просто поболтать зашёл?"
Или: "Слышал и похуже 😄 Давай к делу - чем занимаешься?"
Коротко и спокойно.`
        break
        
      case 'off_topic':
        intentGuidance = `
Вопрос не по теме. Ответь коротко с юмором и верни к бизнесу:
"Интересный вопрос, но я больше по бизнесу 😊 Расскажи чем занимаешься - вот тут я реально полезен"`
        break
        
      default:
        intentGuidance = `
Непонятно что человек хочет. Уточни дружелюбно:
"Не совсем понял. Хочешь рассказать про свой бизнес или узнать что я умею?"
Коротко, без лишних слов.`
    }
    
    const fullPrompt = systemPrompt + '\n\n=== ТЕКУЩАЯ ЗАДАЧА ===\n' + intentGuidance
    
    // Call AI with timeout
    try {
      const aiResult = await Promise.race([
        routedChat(
          'simple',
          [
            ...historyForAI,
            { role: 'user', content: input }
          ],
          {
            model: AI_SERVERS.fast.complexModel,
            system: fullPrompt,
            temperature: 0.8,
            maxTokens: 200
          }
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 12000)
        )
      ])
      
      // Extract promises from AI response
      const promises = extractPromises(aiResult.response)
      
      // Save AI response to memory
      await saveMessage(visitorId, conversationId, 'assistant', aiResult.response, {
        intent,
        promises
      })
      
      // Check if business was mentioned
      const classification = classifyBusiness(input)
      
      return NextResponse.json({
        response: aiResult.response,
        isValidBusiness: classification.isValidBusiness && classification.confidence >= 0.5,
        businessType: classification.businessType,
        intent,
        sentiment,
        visitorId,
        source: 'ai_v3',
        timeMs: Date.now() - startTime
      })
      
    } catch {
      // Timeout - use smart fallbacks based on intent
      const fallbacks: Record<string, string[]> = {
        'greeting': [
          'Привет! Работы много, но для тебя найду время. Чем занимаешься?',
          'Здарова! Рассказывай, какой бизнес ведёшь?',
          'Привет! Ну что, показать на что я способен? Расскажи про свой бизнес.'
        ],
        'about_nexik': [
          'Я Nexik - цифровой директор. Отвечаю клиентам 24/7, собираю заявки, записываю на услуги. Работаю как 10 менеджеров, а стою как один. Какой у тебя бизнес?',
          'Если коротко - я заменяю отдел продаж ночью и в выходные. Клиенты пишут - я отвечаю мгновенно. Расскажи про свой бизнес, покажу как это работает.'
        ],
        'price_question': [
          'От 50 тысяч тенге в месяц. Но давай сначала пойму твой бизнес - может и дешевле выйдет. Чем занимаешься?'
        ],
        'business_description': [
          'Принял! Интересная ниша. Хочешь покажу как бы я отвечал твоим клиентам? Задай вопрос как будто ты клиент.',
          'Понял тебя. Давай попробуем - напиши вопрос, который часто задают твои клиенты, и я отвечу как бы это делал для тебя.'
        ],
        'rude': [
          'Ну ладно, проехали 😄 Давай к делу - какой бизнес ведёшь?',
          'Слышал и похуже. Так чем занимаешься? Или просто поболтать зашёл?'
        ],
        'off_topic': [
          'Интересный вопрос, но я больше по бизнесу. Расскажи чем занимаешься - вот тут я реально полезен.',
          'Это не совсем моя тема. Давай лучше про бизнес - тут я могу реально помочь.'
        ],
        'unclear': [
          'Не совсем понял. Хочешь рассказать про бизнес или узнать что я умею?',
          'Поясни? Интересует что я могу для твоего бизнеса или что-то другое?'
        ]
      }
      
      const responses = fallbacks[intent] || fallbacks['unclear']
      const response = responses[Math.floor(Math.random() * responses.length)]
      
      // Save fallback response
      await saveMessage(visitorId, conversationId, 'assistant', response, { intent })
      
      const classification = classifyBusiness(input)
      
      return NextResponse.json({
        response,
        isValidBusiness: classification.isValidBusiness && classification.confidence >= 0.5,
        businessType: classification.businessType,
        intent,
        sentiment,
        visitorId,
        source: 'fallback_v3',
        timeMs: Date.now() - startTime
      })
    }

  } catch (error) {
    console.error('[Nexik API] Error:', error)
    return NextResponse.json({
      response: 'Что-то пошло не так. Расскажи какой у тебя бизнес - попробуем ещё раз.',
      isValidBusiness: false,
      source: 'error',
      timeMs: Date.now() - startTime
    })
  }
}
