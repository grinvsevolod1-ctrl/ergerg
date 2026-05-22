/**
 * Fast Business Classifier
 * Rule-based classifier for quick business validation (10ms vs 2-3s with AI)
 * Use this for simple classification tasks, AI only for complex ones
 */

export interface ClassificationResult {
  isValidBusiness: boolean
  businessType: string | null
  confidence: number
  reason: string
}

// Business keywords by category
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  'retail': ['магазин', 'продаю', 'торговля', 'товары', 'продажа', 'shop', 'store', 'sell'],
  'services': ['услуги', 'сервис', 'service', 'ремонт', 'repair', 'консультации', 'помощь'],
  'food': ['кафе', 'ресторан', 'доставка еды', 'кухня', 'еда', 'food', 'cafe', 'restaurant', 'пекарня', 'кондитерская'],
  'beauty': ['салон', 'красота', 'маникюр', 'парикмахер', 'spa', 'beauty', 'косметика', 'визаж'],
  'health': ['клиника', 'медицина', 'врач', 'здоровье', 'clinic', 'medical', 'стоматолог', 'фитнес', 'gym'],
  'education': ['школа', 'курсы', 'обучение', 'тренинг', 'репетитор', 'school', 'course', 'education'],
  'tech': ['it', 'разработка', 'программирование', 'сайт', 'приложение', 'software', 'dev', 'digital'],
  'creative': ['дизайн', 'фото', 'видео', 'студия', 'creative', 'design', 'photo', 'video', 'контент'],
  'realty': ['недвижимость', 'аренда', 'квартиры', 'риелтор', 'real estate', 'realty', 'rent'],
  'auto': ['авто', 'автосервис', 'машины', 'шиномонтаж', 'car', 'auto', 'детейлинг'],
  'legal': ['юрист', 'адвокат', 'право', 'lawyer', 'legal', 'юридические'],
  'finance': ['финансы', 'бухгалтер', 'инвестиции', 'кредит', 'finance', 'accounting', 'банк'],
  'travel': ['туризм', 'путешествия', 'отель', 'travel', 'tourism', 'hotel', 'турагентство'],
  'entertainment': ['развлечения', 'event', 'праздник', 'мероприятие', 'entertainment', 'клуб', 'бар'],
  'adult': ['adult', 'порно', 'эскорт', '18+', 'стриптиз', 'контент для взрослых', 'onlyfans', 'порностудия', 'вебкам', 'webcam'],
  'ecommerce': ['интернет-магазин', 'онлайн', 'маркетплейс', 'e-commerce', 'ecommerce', 'wildberries', 'ozon'],
  'manufacturing': ['производство', 'фабрика', 'завод', 'manufacturing', 'factory', 'цех'],
  'logistics': ['доставка', 'логистика', 'грузоперевозки', 'курьер', 'logistics', 'delivery', 'shipping'],
}

// Activity verbs that indicate business
const ACTIVITY_VERBS = [
  'занимаюсь', 'владею', 'работаю', 'развиваю', 'управляю', 'веду', 'открыл', 'создал',
  'продаю', 'предлагаю', 'оказываю', 'делаю', 'произвожу', 'организую'
]

// Possessive patterns
const POSSESSIVE_PATTERNS = [
  /у меня\s+/i,
  /мой\s+/i, /моя\s+/i, /моё\s+/i, /мои\s+/i,
  /наш\s+/i, /наша\s+/i, /наше\s+/i, /наши\s+/i,
  /свой\s+/i, /своя\s+/i, /своё\s+/i, /свои\s+/i,
  /own\s+/i, /my\s+/i, /our\s+/i,
  /i have\s+/i, /we have\s+/i,
]

// Gibberish patterns to reject
const GIBBERISH_PATTERNS = [
  /^[а-яa-z]{1,2}$/i,           // Too short (1-2 letters only)
  /(.)\1{4,}/i,                  // Repeated chars (aaaaa, ооооооо)
  /^(тест|test|hello|йцукен|qwerty|asdf|фыва)$/i,  // Test words only
  /^[0-9\s\W]+$/,                // Only numbers/symbols
]

// Greetings - valid but need business info
const GREETING_PATTERNS = [
  /^(привет|хай|hi|hello|здравствуй|добрый\s+(день|вечер|утро))[\s!.,]*$/i,
  /^(как дела|как ты|что делаешь)[\s?!.,]*$/i,
]

// Clean profanity but keep message
function cleanText(text: string): string {
  // Remove common profanity prefixes while keeping the business info
  return text
    .replace(/^(бля|блять|нах|хуй|пизд\w*)\s*/gi, '')
    .replace(/\s+(бля|блять|нах)\s*/gi, ' ')
    .trim()
}

/**
 * Fast business classification without AI
 * Returns in ~1-5ms
 */
export function classifyBusiness(input: string): ClassificationResult {
  const original = input.trim()
  const text = cleanText(original).toLowerCase()
  const words = text.split(/\s+/).filter(w => w.length > 1)
  
  // Check for greetings first - need more info
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(original)) {
      return {
        isValidBusiness: false,
        businessType: null,
        confidence: 0.9,
        reason: 'greeting_only'
      }
    }
  }
  
  // FIRST: Check for business keywords BEFORE gibberish check
  // This ensures "у меня автосервис" is recognized as business
  let detectedCategory: string | null = null
  let keywordMatches = 0
  
  for (const [category, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        detectedCategory = category
        keywordMatches++
      }
    }
  }
  
  // If we found a business keyword, it's likely valid - skip gibberish check
  if (keywordMatches > 0 && detectedCategory) {
    // Check for possessive patterns (strong indicator)
    const hasPossessive = POSSESSIVE_PATTERNS.some(p => p.test(text))
    
    // Check for activity verbs
    const hasActivityVerb = ACTIVITY_VERBS.some(v => text.includes(v))
    
    // Calculate confidence
    let confidence = 0.5 // Base confidence for keyword match
    
    if (hasPossessive) confidence += 0.25
    if (hasActivityVerb) confidence += 0.15
    if (keywordMatches > 1) confidence += 0.1
    
    return {
      isValidBusiness: true,
      businessType: detectedCategory,
      confidence: Math.min(confidence, 0.95),
      reason: 'keyword_match'
    }
  }
  
  // THEN: Check for gibberish (only if no business keywords found)
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(text)) {
      return {
        isValidBusiness: false,
        businessType: null,
        confidence: 0.95,
        reason: 'gibberish_pattern'
      }
    }
  }
  
  // Single word that isn't a business keyword - need more context
  if (words.length === 1) {
    return {
      isValidBusiness: false,
      businessType: null,
      confidence: 0.7,
      reason: 'single_word_no_keyword'
    }
  }
  
  // Check for possessive patterns without keywords (might still be valid)
  const hasPossessive = POSSESSIVE_PATTERNS.some(p => p.test(text))
  const hasActivityVerb = ACTIVITY_VERBS.some(v => text.includes(v))
  
  if (hasPossessive || hasActivityVerb) {
    // Looks like they're describing a business but we don't recognize keywords
    return {
      isValidBusiness: true,
      businessType: 'other',
      confidence: 0.6,
      reason: 'possessive_or_activity'
    }
  }
  
  // Default: uncertain, might need more info
  if (words.length >= 2) {
    return {
      isValidBusiness: true,
      businessType: 'unknown',
      confidence: 0.4,
      reason: 'multi_word_unknown'
    }
  }
  
  return {
    isValidBusiness: false,
    businessType: null,
    confidence: 0.5,
    reason: 'unclear'
  }
}

/**
 * Generate response based on classification
 */
export function generateClassificationResponse(
  input: string,
  result: ClassificationResult
): string {
  if (result.isValidBusiness) {
    const responses: Record<string, string> = {
      'retail': 'Розничная торговля - отличная ниша! Nexik поможет автоматизировать консультации по товарам и обработку заказов.',
      'services': 'Сфера услуг - здесь AI-ассистент будет очень полезен для записи клиентов и ответов на типовые вопросы.',
      'food': 'Общепит - популярная ниша! Nexik поможет с приёмом заказов, бронированием столиков и ответами о меню.',
      'beauty': 'Бьюти-индустрия - AI отлично справится с записью на процедуры и консультациями по услугам.',
      'health': 'Медицина и здоровье - Nexik поможет с записью к специалистам и ответами на частые вопросы пациентов.',
      'education': 'Образование - AI-ассистент поможет с записью на курсы и консультациями по программам обучения.',
      'tech': 'IT-сфера - вы точно оцените возможности AI! Nexik поможет с техподдержкой и консультациями.',
      'creative': 'Творческая сфера - Nexik поможет с приёмом заявок на проекты и портфолио-консультациями.',
      'realty': 'Недвижимость - AI отлично справится с первичными консультациями и фильтрацией запросов.',
      'auto': 'Автобизнес - Nexik поможет с записью на сервис и консультациями по услугам.',
      'legal': 'Юридические услуги - AI поможет с первичной квалификацией обращений и записью на консультации.',
      'finance': 'Финансы - Nexik поможет с ответами на типовые вопросы и записью на консультации.',
      'travel': 'Туризм - AI-ассистент отлично подойдёт для подбора туров и консультаций по направлениям.',
      'entertainment': 'Развлечения - Nexik поможет с бронированием и информацией о мероприятиях.',
      'adult': 'Понял, специфическая ниша. Nexik обеспечит конфиденциальность и автоматизирует общение с клиентами.',
      'ecommerce': 'E-commerce - AI-ассистент незаменим для консультаций по товарам и статусам заказов.',
      'manufacturing': 'Производство - Nexik поможет с обработкой B2B-запросов и консультациями по продукции.',
      'logistics': 'Логистика - AI отлично справится с отслеживанием заказов и ответами на вопросы о доставке.',
      'general': 'Отлично! Nexik поможет автоматизировать общение с клиентами в твоей нише.',
    }
    
    return responses[result.businessType || 'general'] || responses['general']
  }
  
  // Not valid - ask for clarification
  const clarifications = [
    'Расскажи подробнее - чем занимается твой бизнес? Например: "у меня автосервис" или "продаю косметику онлайн"',
    'Не совсем понял. Опиши свой бизнес в паре слов - что продаёшь или какие услуги оказываешь?',
    'Давай конкретнее - какой у тебя бизнес? Магазин, услуги, производство?'
  ]
  
  return clarifications[Math.floor(Math.random() * clarifications.length)]
}
