/**
 * Nexik Auto-Tagging Service
 * Automatic conversation categorization and intent detection
 */

// ==========================================
// INTENT PATTERNS
// ==========================================

type Intent = 'question' | 'complaint' | 'request' | 'feedback' | 'greeting' | 'farewell' | 'gratitude' | 'support' | 'sales' | 'other'

const INTENT_PATTERNS: Record<Intent, { ru: RegExp[]; en: RegExp[] }> = {
  question: {
    ru: [
      /\?$/,
      /^(как|что|где|когда|почему|зачем|кто|какой|какая|какие|сколько|можно ли|есть ли)/i,
      /(подскажите|скажите|расскажите|объясните)/i
    ],
    en: [
      /\?$/,
      /^(how|what|where|when|why|who|which|can|could|would|is there|are there|do you|does)/i,
      /(tell me|explain|clarify)/i
    ]
  },
  complaint: {
    ru: [
      /(не работает|сломано|баг|ошибка|проблема|глючит|не могу|невозможно)/i,
      /(плохо|ужасно|отвратительно|разочарован|недоволен)/i,
      /(жалоба|претензия|верните деньги|возврат|отмена)/i
    ],
    en: [
      /(not working|broken|bug|error|issue|problem|cannot|unable)/i,
      /(bad|terrible|awful|disappointed|unhappy|frustrated)/i,
      /(complaint|refund|cancel|return)/i
    ]
  },
  request: {
    ru: [
      /(хочу|хотел бы|нужно|необходимо|требуется)/i,
      /(сделайте|помогите|настройте|подключите|добавьте)/i,
      /(прошу|пожалуйста|можете ли)/i
    ],
    en: [
      /(i want|i need|i would like|require|looking for)/i,
      /(please|could you|can you|help me)/i,
      /(set up|configure|add|create|make)/i
    ]
  },
  feedback: {
    ru: [
      /(отзыв|мнение|впечатление|оценка)/i,
      /(понравилось|не понравилось|хотелось бы)/i,
      /(предложение|идея|было бы хорошо)/i
    ],
    en: [
      /(feedback|opinion|review|rating)/i,
      /(liked|loved|suggestion|idea)/i,
      /(would be nice|it would be great)/i
    ]
  },
  greeting: {
    ru: [/^(привет|здравствуйте|добрый день|добрый вечер|доброе утро|салют|хай|хей)[\s!.,]*$/i],
    en: [/^(hi|hello|hey|good morning|good afternoon|good evening|greetings)[\s!.,]*$/i]
  },
  farewell: {
    ru: [/(пока|до свидания|всего доброго|до встречи|удачи|спасибо за помощь$)/i],
    en: [/(bye|goodbye|see you|take care|thanks for your help$)/i]
  },
  gratitude: {
    ru: [/(спасибо|благодарю|благодарность|признателен)/i],
    en: [/(thank|thanks|appreciate|grateful)/i]
  },
  support: {
    ru: [/(техподдержка|поддержка|саппорт|оператор|менеджер|человек)/i],
    en: [/(support|help|agent|operator|human|representative)/i]
  },
  sales: {
    ru: [/(цена|стоимость|тариф|план|купить|заказать|оформить|оплата)/i],
    en: [/(price|cost|plan|pricing|buy|purchase|order|payment)/i]
  },
  other: { ru: [], en: [] }
}

// ==========================================
// TOPIC KEYWORDS
// ==========================================

const TOPIC_KEYWORDS: Record<string, { ru: string[]; en: string[] }> = {
  billing: {
    ru: ['оплата', 'счёт', 'счет', 'платёж', 'платеж', 'тариф', 'подписка', 'цена', 'стоимость', 'деньги', 'карта', 'возврат'],
    en: ['billing', 'payment', 'invoice', 'subscription', 'price', 'cost', 'money', 'card', 'refund', 'charge']
  },
  technical: {
    ru: ['ошибка', 'баг', 'не работает', 'проблема', 'сломано', 'глючит', 'зависает', 'api', 'интеграция', 'настройка'],
    en: ['error', 'bug', 'not working', 'issue', 'broken', 'crash', 'freeze', 'api', 'integration', 'setup']
  },
  account: {
    ru: ['аккаунт', 'профиль', 'пароль', 'логин', 'вход', 'регистрация', 'данные', 'настройки', 'удаление'],
    en: ['account', 'profile', 'password', 'login', 'sign in', 'register', 'data', 'settings', 'delete']
  },
  shipping: {
    ru: ['доставка', 'заказ', 'отправка', 'трек', 'отслеживание', 'курьер', 'посылка', 'адрес'],
    en: ['delivery', 'shipping', 'order', 'track', 'tracking', 'courier', 'package', 'address']
  },
  product: {
    ru: ['товар', 'продукт', 'функция', 'возможность', 'характеристики', 'качество', 'размер', 'цвет'],
    en: ['product', 'item', 'feature', 'capability', 'specs', 'quality', 'size', 'color']
  },
  general: {
    ru: ['информация', 'вопрос', 'помощь', 'консультация'],
    en: ['information', 'question', 'help', 'consultation']
  }
}

// ==========================================
// TYPES
// ==========================================

export interface TaggingResult {
  intent: Intent
  intentConfidence: number
  topics: string[]
  keywords: string[]
  suggestedTags: string[]
  customRulesMatched: string[]
}

export interface AutoTagRule {
  id: string
  org_id: string
  name: string
  patterns: string[]
  keywords: string[]
  tag: string
  priority: number
  is_active: boolean
}

// ==========================================
// TAGGING FUNCTIONS
// ==========================================

/**
 * Detect intent from message
 */
function detectIntent(text: string): { intent: Intent; confidence: number } {
  const normalizedText = text.toLowerCase().trim()
  
  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    const allPatterns = [...patterns.ru, ...patterns.en]
    
    let matchCount = 0
    for (const pattern of allPatterns) {
      if (pattern.test(normalizedText)) {
        matchCount++
      }
    }
    
    if (matchCount > 0) {
      const confidence = Math.min(1, matchCount / 2)
      return { intent: intent as Intent, confidence }
    }
  }
  
  return { intent: 'other', confidence: 0.5 }
}

/**
 * Detect topics from message
 */
function detectTopics(text: string): string[] {
  const normalizedText = text.toLowerCase()
  const topics: string[] = []
  
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const allKeywords = [...keywords.ru, ...keywords.en]
    
    for (const keyword of allKeywords) {
      if (normalizedText.includes(keyword)) {
        if (!topics.includes(topic)) {
          topics.push(topic)
        }
        break
      }
    }
  }
  
  return topics
}

/**
 * Extract key terms from message using TF-IDF-like approach
 */
function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  // Normalize and tokenize
  const words = text.toLowerCase()
    .replace(/[^\w\sа-яёa-z]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)
  
  // Stop words to filter out
  const stopWords = new Set([
    // Russian
    'это', 'как', 'так', 'что', 'для', 'все', 'его', 'она', 'они', 'мне', 'вас', 'нас',
    'был', 'были', 'быть', 'будет', 'есть', 'нет', 'уже', 'ещё', 'еще', 'тоже', 'также',
    'очень', 'можно', 'нужно', 'надо', 'если', 'когда', 'где', 'кто', 'вот', 'там', 'тут',
    // English
    'the', 'and', 'for', 'that', 'with', 'this', 'from', 'have', 'been', 'were', 'are',
    'was', 'will', 'would', 'could', 'should', 'can', 'may', 'but', 'not', 'you', 'your',
    'they', 'them', 'their', 'has', 'had', 'does', 'did', 'just', 'very', 'also', 'some'
  ])
  
  // Count word frequencies
  const wordFreq: Record<string, number> = {}
  for (const word of words) {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  }
  
  // Sort by frequency and return top keywords
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * Check custom rules for organization
 */
async function checkCustomRules(text: string, orgId: string): Promise<{ matched: string[]; tags: string[] }> {
  try {
    const { query } = await import('@/lib/db')
    
    const rules = await query<AutoTagRule>(
      `SELECT * FROM nexik_auto_tag_rules 
       WHERE org_id = $1 AND is_active = true
       ORDER BY priority DESC`,
      [orgId]
    )
    
    const matched: string[] = []
    const tags: string[] = []
    const normalizedText = text.toLowerCase()
    
    for (const rule of rules) {
      let isMatch = false
      
      // Check regex patterns
      for (const pattern of rule.patterns || []) {
        try {
          const regex = new RegExp(pattern, 'i')
          if (regex.test(text)) {
            isMatch = true
            break
          }
        } catch {
          // Invalid regex, skip
        }
      }
      
      // Check keywords
      if (!isMatch) {
        for (const keyword of rule.keywords || []) {
          if (normalizedText.includes(keyword.toLowerCase())) {
            isMatch = true
            break
          }
        }
      }
      
      if (isMatch) {
        matched.push(rule.name)
        if (!tags.includes(rule.tag)) {
          tags.push(rule.tag)
        }
      }
    }
    
    return { matched, tags }
  } catch {
    return { matched: [], tags: [] }
  }
}

/**
 * Auto-tag a message
 */
export async function autoTag(text: string, orgId?: string): Promise<TaggingResult> {
  // Detect intent
  const { intent, confidence: intentConfidence } = detectIntent(text)
  
  // Detect topics
  const topics = detectTopics(text)
  
  // Extract keywords
  const keywords = extractKeywords(text)
  
  // Build suggested tags from intent and topics
  const suggestedTags: string[] = []
  
  if (intent !== 'other') {
    suggestedTags.push(intent)
  }
  
  for (const topic of topics) {
    if (!suggestedTags.includes(topic)) {
      suggestedTags.push(topic)
    }
  }
  
  // Check custom rules if org provided
  let customRulesMatched: string[] = []
  if (orgId) {
    const customResults = await checkCustomRules(text, orgId)
    customRulesMatched = customResults.matched
    
    for (const tag of customResults.tags) {
      if (!suggestedTags.includes(tag)) {
        suggestedTags.push(tag)
      }
    }
  }
  
  return {
    intent,
    intentConfidence,
    topics,
    keywords,
    suggestedTags,
    customRulesMatched
  }
}

/**
 * Tag a full conversation based on all messages
 */
export async function tagConversation(
  conversationId: string,
  messages: Array<{ content: string; sender_type: string }>
): Promise<{ tags: string[]; intent: Intent; topics: string[] }> {
  // Combine all visitor messages for analysis
  const visitorMessages = messages
    .filter(m => m.sender_type === 'visitor')
    .map(m => m.content)
    .join(' ')
  
  if (!visitorMessages) {
    return { tags: [], intent: 'other', topics: [] }
  }
  
  // Get org_id from conversation
  const { queryOne } = await import('@/lib/db')
  const conversation = await queryOne<{ org_id: string }>(
    'SELECT org_id FROM nexik_conversations WHERE id = $1',
    [conversationId]
  )
  
  const result = await autoTag(visitorMessages, conversation?.org_id)
  
  return {
    tags: result.suggestedTags,
    intent: result.intent,
    topics: result.topics
  }
}

// ==========================================
// DATABASE INTEGRATION
// ==========================================

/**
 * Update conversation with auto-detected tags
 */
export async function updateConversationTags(
  conversationId: string,
  tags: string[],
  intent: Intent,
  topics: string[]
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `UPDATE nexik_conversations 
     SET auto_tags = $1, detected_intent = $2, detected_topics = $3
     WHERE id = $4`,
    [tags, intent, topics, conversationId]
  )
}

/**
 * Create or update auto-tag rule
 */
export async function upsertAutoTagRule(rule: Omit<AutoTagRule, 'id'> & { id?: string }): Promise<AutoTagRule> {
  const { query } = await import('@/lib/db')
  
  if (rule.id) {
    // Update
    const result = await query<AutoTagRule>(
      `UPDATE nexik_auto_tag_rules 
       SET name = $1, patterns = $2, keywords = $3, tag = $4, priority = $5, is_active = $6
       WHERE id = $7 AND org_id = $8
       RETURNING *`,
      [rule.name, rule.patterns, rule.keywords, rule.tag, rule.priority, rule.is_active, rule.id, rule.org_id]
    )
    return result[0]
  } else {
    // Insert
    const result = await query<AutoTagRule>(
      `INSERT INTO nexik_auto_tag_rules (org_id, name, patterns, keywords, tag, priority, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [rule.org_id, rule.name, rule.patterns, rule.keywords, rule.tag, rule.priority, rule.is_active]
    )
    return result[0]
  }
}

/**
 * Get all auto-tag rules for organization
 */
export async function getAutoTagRules(orgId: string): Promise<AutoTagRule[]> {
  const { query } = await import('@/lib/db')
  
  return query<AutoTagRule>(
    `SELECT * FROM nexik_auto_tag_rules 
     WHERE org_id = $1 
     ORDER BY priority DESC, name ASC`,
    [orgId]
  )
}

/**
 * Delete auto-tag rule
 */
export async function deleteAutoTagRule(ruleId: string, orgId: string): Promise<boolean> {
  const { execute } = await import('@/lib/db')
  
  const result = await execute(
    'DELETE FROM nexik_auto_tag_rules WHERE id = $1 AND org_id = $2',
    [ruleId, orgId]
  )
  
  return result.rowCount > 0
}
