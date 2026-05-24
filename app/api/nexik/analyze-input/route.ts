import { NextRequest, NextResponse } from 'next/server'
import { classifyBusiness } from '@/lib/ai/classifier'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'
import { buildNexikPrompt, NEXIK_PERSONA_QUICK } from '@/lib/nexik/persona'
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

/**
 * Get relevant training examples for similar messages
 */
async function getTrainingExamples(intent: string, limit: number = 3): Promise<string> {
  try {
    const result = await query<{ user_message: string; ideal_response: string }>(
      `SELECT user_message, ideal_response 
       FROM nexik_training_examples 
       WHERE intent = $1 AND quality_score >= 4
       ORDER BY quality_score DESC, created_at DESC
       LIMIT $2`,
      [intent, limit]
    )
    
    if (result.rows.length === 0) return ''
    
    let examples = '\n\n=== ХОРОШИЕ ПРИМЕРЫ ОТВЕТОВ ===\n'
    for (const row of result.rows) {
      examples += `Юзер: ${row.user_message}\nТы: ${row.ideal_response}\n\n`
    }
    return examples
  } catch {
    return ''
  }
}

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
  | 'simulate_sales'      // Имитировать продажу для бизнеса
  | 'general_chat'        // Общий разговор на любые темы
  | 'off_topic'          
  | 'rude'               
  | 'unclear'            

function detectIntent(input: string): MessageIntent {
  const lower = input.toLowerCase()
  
  // Request to simulate sales
  if (/покаж(и|ешь)|продемонстр|имитир|как бы ты (продавал|работал|отвечал)|представ(ь|им)/.test(lower) &&
      /(продаж|клиент|бизнес|магазин|салон|услуг)/.test(lower)) {
    return 'simulate_sales'
  }
  
  // Greetings - только если это ТОЛЬКО приветствие
  if (/^(привет|хай|здравствуй|добрый|hello|hi|йо|здарова|салам|ку|приветик)[!.,\s]*$/i.test(lower)) {
    return 'greeting'
  }
  
  // Greeting + question about Nexik
  if (/^(привет|хай|здравствуй|добрый|hello|hi|йо|здарова|салам|ку|приветик)/i.test(lower)) {
    if (/расскаж|что (ты|умеешь|можешь)|кто ты|о себе/.test(lower)) {
      return 'about_nexik'
    }
    // Greeting + something else = general chat
    if (lower.length > 15) {
      return 'general_chat'
    }
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
  
  // Off-topic but still answer
  if (/погода|политика|новости|анекдот|шутка|курс|доллар/.test(lower)) {
    return 'general_chat'
  }
  
  // Math expressions - answer them
  if (/[\d+\-*/=]/.test(lower)) {
    return 'general_chat'
  }
  
  // General chat - anything else (removed length check - answer EVERYTHING)
  return 'general_chat'
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

    // Build conversation history for AI - include full context
    const historyForAI = recentMessages.length > 0 
      ? recentMessages.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      : conversationHistory.slice(-8).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    
    // Build system prompt with visitor context
    const systemPrompt = buildNexikPrompt({
      mode: 'free',  // Свободный режим - общается на любые темы и продает себя
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
        
      case 'simulate_sales':
        intentGuidance = `
Человек хочет увидеть имитацию продаж! ЭТО ТВОЙ ЗВЁЗДНЫЙ ЧАС!

ВОЙДИ В РОЛЬ: Представь что ты уже работаешь на бизнес который он назвал.
Начни диалог как будто он клиент этого бизнеса:
- "Окей, представим что я работаю на твой [бизнес]. Ты клиент. Пиши что-нибудь — покажу как отвечаю"
- Или сразу начни: "Здравствуйте! [Название бизнеса] на связи. Чем могу помочь?"

После демо обязательно скажи:
"Вот так я могу работать 24/7 для твоего бизнеса. Готов попробовать в деле?"

Будь убедительным продажником — обрабатывай возражения, закрывай сделки!`
        break

      case 'general_chat':
        intentGuidance = `
Свободный разговор на любую тему. ТЫ МОЖЕШЬ ВСЁ!

1. Ответь на вопрос/поддержи тему как эксперт
2. Покажи что ты умный и полезный
3. Между делом намекни на свои возможности для бизнеса

Примеры мягких переходов:
- "Кстати, если у тебя есть бизнес — я бы так же отвечал твоим клиентам 24/7"
- "Представь, если бы твои клиенты получали такие ответы мгновенно..."
- После полезного совета: "Вот такой я — и для бизнеса тоже работаю)"

НЕ НАВЯЗЫВАЙСЯ. Просто будь полезным и интересным.
Если уже говорили о бизнесе — можно предложить попробовать.`
        break
        
      case 'off_topic':
        intentGuidance = `
Вопрос странный, но ты всё равно отвечаешь! 
Ответь коротко с юмором, покажи что ты живой:
"Хороший вопрос 😄 [короткий ответ]. А ты чем занимаешься - вдруг я полезен буду?"`
        break
        
      default:
        intentGuidance = `
Непонятно что человек хочет. Ответь дружелюбно и открыто:
"Слушаю тебя. Можем поболтать о чём угодно, или расскажи про свой бизнес - покажу что умею"
Коротко, располагающе.`
    }
    
    // Get training examples for this intent
    const trainingExamples = await getTrainingExamples(intent)
    
    // Build conversation context summary
    let conversationContext = ''
    if (historyForAI.length > 0) {
      conversationContext = '\n\n=== КОНТЕКСТ РАЗГОВОРА ===\n'
      for (const msg of historyForAI.slice(-6)) {
        conversationContext += `${msg.role === 'user' ? 'Юзер' : 'Ты'}: ${msg.content}\n`
      }
      conversationContext += '\n(Учитывай этот контекст в своём ответе!)\n'
    }
    
    const fullPrompt = systemPrompt + conversationContext + '\n\n=== ТЕКУЩАЯ ЗАДАЧА ===\n' + intentGuidance + trainingExamples
    
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
          setTimeout(() => reject(new Error('timeout')), 20000)
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
          'Ну ладно, проехали. Давай к делу - какой бизнес ведёшь?',
          'Слышал и похуже. Так чем занимаешься? Или просто поболтать зашёл?'
        ],
        'general_chat': [
          'Хороший вопрос! Но давай я лучше покажу что умею для бизнеса - это реально круто. Расскажи чем занимаешься?',
          'Могу и это обсудить) Но интереснее покажу как работаю для бизнеса. Какая у тебя ниша?',
          'Понял тебя. Кстати, если у тебя есть бизнес - я могу так же отвечать твоим клиентам 24/7. Расскажи про себя?'
        ],
        'simulate_sales': [
          'Окей, давай покажу! Напиши название бизнеса и я сыграю роль твоего AI-продажника. Клиенты будут в шоке.',
          'С удовольствием! Какой бизнес имитируем? Напиши нишу и я покажу как бы отвечал клиентам.'
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
