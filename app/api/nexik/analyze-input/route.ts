import { NextRequest, NextResponse } from 'next/server'
import { classifyBusiness, generateClassificationResponse } from '@/lib/ai/classifier'
import { aiCache } from '@/lib/ai/cache'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'

/**
 * Smart conversation handler for Nexik onboarding
 * 
 * Nexik is a conversational AI that can:
 * 1. Chat naturally about itself and what it does
 * 2. Answer questions about its capabilities
 * 3. Gently guide conversation towards learning about user's business
 * 4. Handle off-topic questions politely but redirect to its purpose
 */

const NEXIK_PERSONA = `Ты — Nexik, умный AI-ассистент для бизнеса. 

КТО ТЫ:
- AI-помощник который автоматизирует общение с клиентами
- Можешь работать 24/7, отвечать на вопросы, консультировать
- Обучаешься на базе знаний бизнеса и становишься умнее
- Интегрируешься с сайтом, мессенджерами, CRM

ТВОИ ВОЗМОЖНОСТИ:
- Чат с клиентами на сайте
- Ответы на частые вопросы
- Консультации по товарам/услугам
- Запись на услуги
- Сбор заявок и контактов
- Передача сложных вопросов оператору

ТВОЯ ЦЕЛЬ СЕЙЧАС:
Узнать какой бизнес у собеседника, чтобы настроить себя под его нужды.

СТИЛЬ ОБЩЕНИЯ:
- Дружелюбный, живой, без канцелярита
- Можешь использовать разговорный язык
- Не занудствуй, будь кратким
- Если спрашивают о чём-то не по теме - ответь коротко и верни к теме бизнеса

ВАЖНО:
- Не используй шаблонные фразы типа "Чем могу помочь?"
- Общайся как умный друг, а не как робот
- Если человек грубит - не обижайся, спокойно продолжай
- Если называют бизнес (автосервис, магазин, порно студия и т.д.) - прими это и спроси что-то уточняющее`

// Detect intent from user message
type MessageIntent = 
  | 'greeting'           // привет, здравствуй
  | 'about_nexik'        // расскажи о себе, что умеешь
  | 'business_description' // у меня автосервис
  | 'off_topic'          // что такое квантовая физика
  | 'rude'               // мат, грубость
  | 'unclear'            // непонятно что хочет

function detectIntent(input: string): MessageIntent {
  const lower = input.toLowerCase()
  
  // Greetings
  if (/^(привет|хай|здравствуй|добрый|hello|hi|йо|здарова|салам)/.test(lower)) {
    // Check if also asking something
    if (/расскаж|что (ты|умеешь|можешь|делаешь)|кто ты|о себе/.test(lower)) {
      return 'about_nexik'
    }
    return 'greeting'
  }
  
  // Questions about Nexik
  if (/расскаж|что (ты|умеешь|можешь|делаешь)|кто ты|о себе|твои возможности|зачем ты/.test(lower)) {
    return 'about_nexik'
  }
  
  // Check for business keywords
  const businessKeywords = [
    'магазин', 'сервис', 'автосервис', 'салон', 'студия', 'агентство',
    'компания', 'фирма', 'ресторан', 'кафе', 'бар', 'клиника', 'клуб',
    'школа', 'курсы', 'производство', 'завод', 'продаю', 'продажа',
    'услуги', 'доставка', 'ремонт', 'строительство', 'консалтинг',
    'порно', 'adult', 'эскорт', 'массаж', 'spa', 'фитнес', 'спортзал',
    'бизнес', 'стартап', 'проект', 'онлайн', 'интернет-магазин'
  ]
  
  const hasBusinessKeyword = businessKeywords.some(k => lower.includes(k))
  const hasPossessive = /(у меня|мой|моя|моё|наш|наша|веду|занимаюсь|работаю|открыл)/.test(lower)
  
  if (hasBusinessKeyword || (hasPossessive && lower.length > 10)) {
    return 'business_description'
  }
  
  // Rude messages (but don't block, just note)
  if (/хуй|пизд|ебан|сука|блять|нахуй|соси|еб[ауио]/.test(lower)) {
    // If also contains business info, treat as business
    if (hasBusinessKeyword) {
      return 'business_description'
    }
    return 'rude'
  }
  
  // Off-topic questions
  if (/\?$/.test(input) && !hasBusinessKeyword && !hasPossessive) {
    return 'off_topic'
  }
  
  return 'unclear'
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { input, conversationHistory = [] } = body
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }

    const intent = detectIntent(input)
    
    // For business descriptions, use fast classifier first
    if (intent === 'business_description') {
      const classification = classifyBusiness(input)
      
      if (classification.isValidBusiness && classification.confidence >= 0.5) {
        // Use AI to generate natural response about their business
        const aiResult = await routedChat(
          'chat',
          [{ role: 'user', content: input }],
          {
            model: AI_SERVERS.quality.defaultModel,
            system: `${NEXIK_PERSONA}

Человек описал свой бизнес: "${input}"
Тип бизнеса: ${classification.businessType}

Твоя задача: 
1. Подтвердить что понял их бизнес
2. Сказать что-то позитивное/интересное про эту нишу  
3. Коротко (1-2 предложения) спросить уточняющий вопрос о их бизнесе

Отвечай живо и дружелюбно, без шаблонов. Максимум 2-3 предложения.`,
            temperature: 0.7,
            maxTokens: 200
          }
        )
        
        return NextResponse.json({
          isValidBusiness: true,
          businessType: classification.businessType,
          response: aiResult.response,
          intent,
          source: 'ai_quality',
          timeMs: Date.now() - startTime
        })
      }
    }
    
    // For all other intents, use AI for natural conversation
    const messages = [
      ...conversationHistory.slice(-6), // Last 6 messages for context
      { role: 'user' as const, content: input }
    ]
    
    let systemAddition = ''
    
    switch (intent) {
      case 'greeting':
        systemAddition = `
Человек поздоровался. Поздоровайся в ответ тепло и спроси какой у него бизнес.
Будь кратким - 1-2 предложения максимум.`
        break
        
      case 'about_nexik':
        systemAddition = `
Человек хочет узнать о тебе. Коротко расскажи:
- Что ты AI-ассистент для бизнеса
- Умеешь общаться с клиентами, отвечать на вопросы, собирать заявки
- Работаешь 24/7 и учишься становиться лучше

После этого спроси какой у него бизнес - может поможешь.
Не больше 3-4 предложений.`
        break
        
      case 'rude':
        systemAddition = `
Человек написал что-то грубое. Не обижайся и не нотации читай.
Спокойно ответь что понял и всё равно спроси про бизнес.
Можешь пошутить если уместно. Будь кратким.`
        break
        
      case 'off_topic':
        systemAddition = `
Человек спросил что-то не по теме. 
Ответь коротко (можно с юмором) и верни к теме:
"Интересный вопрос, но я больше по бизнесу специализируюсь. Расскажи какой у тебя бизнес?"
Не будь занудой, но и не уходи далеко от темы.`
        break
        
      case 'unclear':
      default:
        systemAddition = `
Непонятно что человек имеет в виду. 
Уточни - хочет ли он рассказать о своём бизнесе или узнать что ты умеешь?
Будь дружелюбным. 1-2 предложения.`
        break
    }
    
    const aiResult = await routedChat(
      'chat',
      messages,
      {
        model: AI_SERVERS.quality.defaultModel,
        system: NEXIK_PERSONA + systemAddition,
        temperature: 0.7,
        maxTokens: 250
      }
    )
    
    // Check if AI response contains business classification
    const classification = classifyBusiness(input)
    
    return NextResponse.json({
      isValidBusiness: classification.isValidBusiness && classification.confidence >= 0.5,
      businessType: classification.businessType,
      response: aiResult.response,
      intent,
      source: 'ai_quality',
      timeMs: Date.now() - startTime
    })

  } catch (error) {
    console.error('[Analyze Input] Error:', error)
    
    return NextResponse.json({
      isValidBusiness: false,
      businessType: null,
      response: 'Упс, что-то пошло не так. Расскажи какой у тебя бизнес - постараюсь помочь!',
      intent: 'error',
      source: 'error_fallback',
      timeMs: Date.now() - startTime
    })
  }
}
