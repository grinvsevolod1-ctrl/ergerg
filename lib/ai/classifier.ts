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
  'adult': ['adult', 'порно', 'эскорт', '18+', 'стриптиз', 'контент для взрослых', 'onlyfans'],
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
  /^[а-яa-z]{1,3}$/i,           // Too short (1-3 letters)
  /(.)\1{3,}/i,                  // Repeated chars (aaaa, ооооо)
  /^(тест|test|hello|привет|хай|hi|йцукен|qwerty|asdf|фыва)$/i,  // Test words
  /^[0-9\s\W]+$/,                // Only numbers/symbols
  /^(хз|пофиг|незнаю|не знаю|потом|ничего|нет)$/i,  // Refusals
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
  
  // Check for gibberish
  for (const pattern of GIBBERISH_PATTERNS) {
    if (pattern.test(original)) {
      return {
        isValidBusiness: false,
        businessType: null,
        confidence: 0.95,
        reason: 'gibberish_pattern'
      }
    }
  }
  
  // Too short
  if (words.length < 2) {
    return {
      isValidBusiness: false,
      businessType: null,
      confidence: 0.8,
      reason: 'too_short'
    }
  }
  
  // Check for possessive patterns (strong indicator)
  const hasPossessive = POSSESSIVE_PATTERNS.some(p => p.test(text))
  
  // Check for activity verbs
  const hasActivityVerb = ACTIVITY_VERBS.some(v => text.includes(v))
  
  // Check for business keywords
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
  
  // Calculate confidence
  let confidence = 0
  const reasons: string[] = []
  
  if (keywordMatches > 0) {
    confidence += 0.4 + (keywordMatches * 0.1)
    reasons.push('keyword_match')
  }
  
  if (hasPossessive) {
    confidence += 0.25
    reasons.push('possessive')
  }
  
  if (hasActivityVerb) {
    confidence += 0.2
    reasons.push('activity_verb')
  }
  
  if (words.length >= 3) {
    confidence += 0.15
    reasons.push('sufficient_length')
  }
  
  // Normalize confidence
  confidence = Math.min(confidence, 1)
  
  // Decision threshold
  const isValid = confidence >= 0.35 || keywordMatches > 0
  
  return {
    isValidBusiness: isValid,
    businessType: isValid ? (detectedCategory || 'general') : null,
    confidence,
    reason: reasons.length > 0 ? reasons.join(',') : 'no_match'
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
