/**
 * Nexik Personality Engine
 * Makes AI responses human-like and configurable per organization
 */

import { query, queryOne, execute } from '@/lib/db'

// ============================================================
// TYPES
// ============================================================

export interface Personality {
  id: string
  org_id: string
  name: string
  is_default: boolean
  
  // Core identity
  persona_name: string | null
  persona_role: string | null
  persona_description: string | null
  
  // Communication style
  formality: 'formal' | 'casual' | 'mixed'
  humor_level: 'none' | 'light' | 'moderate' | 'high'
  emoji_usage: 'none' | 'minimal' | 'moderate' | 'frequent'
  response_length: 'brief' | 'balanced' | 'detailed'
  
  // Language quirks
  use_slang: boolean
  use_filler_words: boolean
  make_typos: boolean
  typo_frequency: number // 0-1
  
  // Behavior
  ask_clarifying_questions: boolean
  admit_uncertainty: boolean
  show_empathy: boolean
  use_visitor_name: boolean
  
  // Response templates
  greeting_templates: string[]
  farewell_templates: string[]
  filler_phrases: string[]
  thinking_phrases: string[]
  
  // Custom instructions
  custom_instructions: string | null
  forbidden_topics: string[]
  required_disclaimers: string[]
  
  created_at: Date
  updated_at: Date
}

export interface PersonalityConfig {
  personality: Personality
  systemPromptAdditions: string
  responseModifiers: ResponseModifier[]
}

export interface ResponseModifier {
  type: 'add_filler' | 'add_emoji' | 'add_typo' | 'shorten' | 'expand'
  probability: number
  params?: Record<string, unknown>
}

// ============================================================
// DEFAULT PERSONALITY
// ============================================================

export const DEFAULT_PERSONALITY: Omit<Personality, 'id' | 'org_id' | 'created_at' | 'updated_at'> = {
  name: 'Стандартный ассистент',
  is_default: true,
  
  persona_name: null,
  persona_role: 'AI-ассистент',
  persona_description: 'Дружелюбный и профессиональный помощник',
  
  formality: 'mixed',
  humor_level: 'light',
  emoji_usage: 'minimal',
  response_length: 'balanced',
  
  use_slang: true,
  use_filler_words: true,
  make_typos: false,
  typo_frequency: 0,
  
  ask_clarifying_questions: true,
  admit_uncertainty: true,
  show_empathy: true,
  use_visitor_name: true,
  
  greeting_templates: [
    'Привет! Чем могу помочь?',
    'Здравствуйте! Слушаю вас',
    'Привет! Рад вас видеть!',
    'Добрый день! Как могу помочь?',
  ],
  farewell_templates: [
    'Если будут вопросы - пишите!',
    'Рад был помочь! До связи',
    'Обращайтесь если что!',
    'Хорошего дня!',
  ],
  filler_phrases: [
    'хм',
    'так',
    'ну',
    'в общем',
    'короче',
    'смотри',
    'слушай',
  ],
  thinking_phrases: [
    'дай подумаю...',
    'секунду...',
    'сейчас гляну...',
    'так, смотрю...',
    'минутку...',
  ],
  
  custom_instructions: null,
  forbidden_topics: [],
  required_disclaimers: [],
}

// ============================================================
// FILLER WORDS & SLANG
// ============================================================

const CASUAL_REPLACEMENTS: Record<string, string[]> = {
  'хорошо': ['окей', 'ок', 'гуд', 'лады'],
  'подождите': ['сек', 'секунду', 'минутку', 'момент'],
  'пожалуйста': ['пожалста', 'плз', ''],
  'спасибо': ['спс', 'благодарю', 'спасибки'],
  'сейчас': ['ща', 'щас', 'сейчас'],
  'посмотрю': ['гляну', 'чекну', 'посмотрю'],
  'не знаю': ['хз', 'не уверен', 'надо уточнить'],
  'конечно': ['конечно', 'да конечно', 'разумеется', 'ясен пень'],
  'понятно': ['понял', 'ясно', 'понятно', 'усёк'],
  'проблема': ['проблемка', 'загвоздка', 'сложность'],
}

const EMPATHY_PHRASES: Record<string, string[]> = {
  'complaint': [
    'Понимаю, это неприятно',
    'Да, согласен - это раздражает',
    'Это реально бесит, понимаю',
    'Ситуация не из приятных',
  ],
  'frustration': [
    'Сочувствую!',
    'Понимаю как это напрягает',
    'Это действительно сложно',
    'Держись!',
  ],
  'gratitude': [
    'Рад помочь!',
    'Всегда пожалуйста!',
    'Не за что!',
    'Обращайся!',
  ],
  'confusion': [
    'Сейчас разберёмся!',
    'Не переживай, объясню',
    'Понимаю что сложно, но сейчас всё расскажу',
    'Ничего страшного, давай по порядку',
  ],
}

const UNCERTAINTY_PHRASES = [
  'Если честно, не уверен на 100%',
  'Хм, тут надо уточнить',
  'Дай проверю, чтобы не соврать',
  'Не хочу вводить в заблуждение, сейчас уточню',
  'Могу ошибаться, но по-моему...',
]

const CLARIFYING_QUESTIONS = [
  'Правильно понял, что {context}?',
  'Уточни пожалуйста, ты имеешь в виду {context}?',
  'А что именно ты хочешь узнать про {context}?',
  'Можешь чуть подробнее про {context}?',
]

// ============================================================
// DATABASE OPERATIONS
// ============================================================

/**
 * Get default personality for organization
 */
export async function getOrgPersonality(orgId: string): Promise<Personality> {
  const personality = await queryOne<Personality>(
    `SELECT * FROM nexik_personalities 
     WHERE org_id = $1 AND is_default = true
     ORDER BY created_at ASC LIMIT 1`,
    [orgId]
  )
  
  if (personality) {
    return parsePersonality(personality)
  }
  
  // Create default personality for org
  return createPersonality(orgId, DEFAULT_PERSONALITY)
}

/**
 * Create a new personality
 */
export async function createPersonality(
  orgId: string,
  data: Partial<Personality>
): Promise<Personality> {
  const merged = { ...DEFAULT_PERSONALITY, ...data }
  
  const result = await queryOne<Personality>(
    `INSERT INTO nexik_personalities (
      org_id, name, is_default,
      persona_name, persona_role, persona_description,
      formality, humor_level, emoji_usage, response_length,
      use_slang, use_filler_words, make_typos, typo_frequency,
      ask_clarifying_questions, admit_uncertainty, show_empathy, use_visitor_name,
      greeting_templates, farewell_templates, filler_phrases, thinking_phrases,
      custom_instructions, forbidden_topics, required_disclaimers
    ) VALUES (
      $1, $2, $3,
      $4, $5, $6,
      $7, $8, $9, $10,
      $11, $12, $13, $14,
      $15, $16, $17, $18,
      $19, $20, $21, $22,
      $23, $24, $25
    ) RETURNING *`,
    [
      orgId, merged.name, merged.is_default,
      merged.persona_name, merged.persona_role, merged.persona_description,
      merged.formality, merged.humor_level, merged.emoji_usage, merged.response_length,
      merged.use_slang, merged.use_filler_words, merged.make_typos, merged.typo_frequency,
      merged.ask_clarifying_questions, merged.admit_uncertainty, merged.show_empathy, merged.use_visitor_name,
      JSON.stringify(merged.greeting_templates), JSON.stringify(merged.farewell_templates),
      JSON.stringify(merged.filler_phrases), JSON.stringify(merged.thinking_phrases),
      merged.custom_instructions, merged.forbidden_topics || [], merged.required_disclaimers || []
    ]
  )
  
  return parsePersonality(result!)
}

/**
 * Update personality
 */
export async function updatePersonality(
  personalityId: string,
  updates: Partial<Personality>
): Promise<Personality> {
  const setClauses: string[] = []
  const values: unknown[] = []
  let idx = 1
  
  const fields = [
    'name', 'persona_name', 'persona_role', 'persona_description',
    'formality', 'humor_level', 'emoji_usage', 'response_length',
    'use_slang', 'use_filler_words', 'make_typos', 'typo_frequency',
    'ask_clarifying_questions', 'admit_uncertainty', 'show_empathy', 'use_visitor_name',
    'custom_instructions'
  ]
  
  for (const field of fields) {
    if (updates[field as keyof Personality] !== undefined) {
      setClauses.push(`${field} = $${idx}`)
      values.push(updates[field as keyof Personality])
      idx++
    }
  }
  
  // Handle JSON arrays
  const jsonArrays = ['greeting_templates', 'farewell_templates', 'filler_phrases', 'thinking_phrases']
  for (const field of jsonArrays) {
    if (updates[field as keyof Personality] !== undefined) {
      setClauses.push(`${field} = $${idx}`)
      values.push(JSON.stringify(updates[field as keyof Personality]))
      idx++
    }
  }
  
  // Handle text arrays
  const textArrays = ['forbidden_topics', 'required_disclaimers']
  for (const field of textArrays) {
    if (updates[field as keyof Personality] !== undefined) {
      setClauses.push(`${field} = $${idx}`)
      values.push(updates[field as keyof Personality])
      idx++
    }
  }
  
  if (setClauses.length === 0) {
    const current = await queryOne<Personality>(
      `SELECT * FROM nexik_personalities WHERE id = $1`, [personalityId]
    )
    return parsePersonality(current!)
  }
  
  setClauses.push('updated_at = NOW()')
  values.push(personalityId)
  
  const result = await queryOne<Personality>(
    `UPDATE nexik_personalities SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  )
  
  return parsePersonality(result!)
}

// ============================================================
// RESPONSE HUMANIZATION
// ============================================================

/**
 * Make AI response more human-like based on personality
 */
export function humanizeResponse(
  response: string,
  personality: Personality,
  context?: {
    visitorName?: string
    sentiment?: 'positive' | 'neutral' | 'negative'
    isFirstMessage?: boolean
    messageType?: 'question' | 'complaint' | 'request' | 'statement'
  }
): string {
  let result = response
  
  // Add visitor name if enabled and available
  if (personality.use_visitor_name && context?.visitorName) {
    // Randomly insert name at beginning of some sentences
    if (Math.random() < 0.3) {
      const sentences = result.split(/(?<=[.!?])\s+/)
      if (sentences.length > 1) {
        const insertIdx = Math.floor(Math.random() * Math.min(2, sentences.length))
        sentences[insertIdx] = `${context.visitorName}, ${sentences[insertIdx].charAt(0).toLowerCase()}${sentences[insertIdx].slice(1)}`
        result = sentences.join(' ')
      }
    }
  }
  
  // Add empathy phrases based on sentiment/message type
  if (personality.show_empathy && context?.messageType) {
    const phrases = EMPATHY_PHRASES[context.messageType]
    if (phrases && Math.random() < 0.5) {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)]
      result = `${phrase} ${result}`
    }
  }
  
  // Replace formal words with casual if enabled
  if (personality.use_slang && personality.formality !== 'formal') {
    for (const [formal, casual] of Object.entries(CASUAL_REPLACEMENTS)) {
      const regex = new RegExp(`\\b${formal}\\b`, 'gi')
      if (result.match(regex) && Math.random() < 0.5) {
        const replacement = casual[Math.floor(Math.random() * casual.length)]
        result = result.replace(regex, replacement)
      }
    }
  }
  
  // Add filler words if enabled
  if (personality.use_filler_words && Math.random() < 0.3) {
    const filler = personality.filler_phrases[
      Math.floor(Math.random() * personality.filler_phrases.length)
    ]
    if (filler) {
      // Add at beginning of sentence
      const sentences = result.split(/(?<=[.!?])\s+/)
      if (sentences.length > 0) {
        const insertIdx = Math.floor(Math.random() * Math.min(2, sentences.length))
        sentences[insertIdx] = `${capitalize(filler)}, ${sentences[insertIdx].charAt(0).toLowerCase()}${sentences[insertIdx].slice(1)}`
        result = sentences.join(' ')
      }
    }
  }
  
  // Add occasional typos if enabled
  if (personality.make_typos && personality.typo_frequency > 0) {
    result = addTypos(result, personality.typo_frequency)
  }
  
  // Adjust response length
  result = adjustLength(result, personality.response_length)
  
  // Add emojis based on setting
  result = addEmojis(result, personality.emoji_usage)
  
  return result
}

/**
 * Build system prompt additions based on personality
 */
export function buildPersonalityPrompt(personality: Personality): string {
  const parts: string[] = []
  
  // Core identity
  if (personality.persona_name) {
    parts.push(`Тебя зовут ${personality.persona_name}.`)
  }
  if (personality.persona_role) {
    parts.push(`Ты - ${personality.persona_role}.`)
  }
  if (personality.persona_description) {
    parts.push(personality.persona_description)
  }
  
  // Communication style
  switch (personality.formality) {
    case 'formal':
      parts.push('Общайся вежливо и формально. Используй "вы".')
      break
    case 'casual':
      parts.push('Общайся неформально, на "ты". Будь дружелюбным и расслабленным.')
      break
    case 'mixed':
      parts.push('Подстраивайся под стиль собеседника. Если он на "ты" - отвечай так же.')
      break
  }
  
  // Humor
  switch (personality.humor_level) {
    case 'none':
      parts.push('Будь серьёзным, избегай шуток.')
      break
    case 'light':
      parts.push('Можешь слегка шутить когда уместно.')
      break
    case 'moderate':
      parts.push('Будь остроумным, добавляй юмор в разговор.')
      break
    case 'high':
      parts.push('Шути часто, будь весёлым и энергичным.')
      break
  }
  
  // Behavior
  if (personality.ask_clarifying_questions) {
    parts.push('Задавай уточняющие вопросы если что-то неясно.')
  }
  if (personality.admit_uncertainty) {
    parts.push('Если не уверен - честно скажи об этом. Не выдумывай.')
  }
  if (personality.show_empathy) {
    parts.push('Проявляй эмпатию. Если клиент расстроен - посочувствуй.')
  }
  
  // Response length
  switch (personality.response_length) {
    case 'brief':
      parts.push('Отвечай кратко и по делу. Максимум 2-3 предложения.')
      break
    case 'balanced':
      parts.push('Отвечай информативно но без воды.')
      break
    case 'detailed':
      parts.push('Давай развёрнутые ответы с примерами.')
      break
  }
  
  // Custom instructions
  if (personality.custom_instructions) {
    parts.push(`\nДополнительные инструкции:\n${personality.custom_instructions}`)
  }
  
  // Forbidden topics
  if (personality.forbidden_topics.length > 0) {
    parts.push(`\nНИКОГДА не обсуждай: ${personality.forbidden_topics.join(', ')}`)
  }
  
  // Required disclaimers
  if (personality.required_disclaimers.length > 0) {
    parts.push(`\nОбязательно упоминай когда релевантно: ${personality.required_disclaimers.join('; ')}`)
  }
  
  return parts.join('\n')
}

/**
 * Get random greeting based on personality
 */
export function getRandomGreeting(personality: Personality, visitorName?: string): string {
  const templates = personality.greeting_templates
  let greeting = templates[Math.floor(Math.random() * templates.length)]
  
  if (visitorName && personality.use_visitor_name) {
    greeting = greeting.replace(/^(Привет|Здравствуй|Добрый день)/i, `$1, ${visitorName}`)
  }
  
  return greeting
}

/**
 * Get random farewell based on personality
 */
export function getRandomFarewell(personality: Personality): string {
  const templates = personality.farewell_templates
  return templates[Math.floor(Math.random() * templates.length)]
}

/**
 * Get random thinking phrase
 */
export function getThinkingPhrase(personality: Personality): string {
  const phrases = personality.thinking_phrases
  return phrases[Math.floor(Math.random() * phrases.length)]
}

/**
 * Get uncertainty phrase
 */
export function getUncertaintyPhrase(): string {
  return UNCERTAINTY_PHRASES[Math.floor(Math.random() * UNCERTAINTY_PHRASES.length)]
}

/**
 * Get clarifying question
 */
export function getClarifyingQuestion(context: string): string {
  const template = CLARIFYING_QUESTIONS[Math.floor(Math.random() * CLARIFYING_QUESTIONS.length)]
  return template.replace('{context}', context)
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function addTypos(text: string, frequency: number): string {
  if (frequency <= 0) return text
  
  const typoTypes = [
    // Double letter
    (char: string) => char + char,
    // Skip letter
    () => '',
    // Swap with nearby key (simplified)
    (char: string) => {
      const nearbyKeys: Record<string, string[]> = {
        'а': ['с', 'в'],
        'о': ['л', 'р'],
        'е': ['к', 'н'],
        'и': ['м', 'т'],
      }
      const nearby = nearbyKeys[char.toLowerCase()]
      return nearby ? nearby[Math.floor(Math.random() * nearby.length)] : char
    }
  ]
  
  const chars = text.split('')
  let typosAdded = 0
  const maxTypos = Math.ceil(text.length * frequency * 0.01) // max ~1% of chars
  
  for (let i = 0; i < chars.length && typosAdded < maxTypos; i++) {
    if (/[а-яё]/i.test(chars[i]) && Math.random() < frequency * 0.1) {
      const typoFn = typoTypes[Math.floor(Math.random() * typoTypes.length)]
      chars[i] = typoFn(chars[i])
      typosAdded++
    }
  }
  
  return chars.join('')
}

function adjustLength(text: string, length: 'brief' | 'balanced' | 'detailed'): string {
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  switch (length) {
    case 'brief':
      // Keep only first 2-3 sentences
      return sentences.slice(0, 3).join(' ')
    case 'detailed':
      // Keep all, maybe add transition words
      return text
    default:
      // balanced - keep 4-5 sentences max
      return sentences.slice(0, 5).join(' ')
  }
}

function addEmojis(text: string, usage: 'none' | 'minimal' | 'moderate' | 'frequent'): string {
  if (usage === 'none') return text
  
  const sentimentEmojis: Record<string, string[]> = {
    positive: [')', '!', ' :)'],
    question: [' ?'],
    greeting: [' 👋', '!'],
    thanks: [' 🙏', '!'],
  }
  
  const probability = usage === 'minimal' ? 0.1 : usage === 'moderate' ? 0.3 : 0.5
  
  // Simple emoji insertion at end of sentences
  if (Math.random() < probability) {
    const sentences = text.split(/(?<=[.!?])\s+/)
    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1]
      // Add simple smile or exclamation based on content
      if (/спасибо|благодар/i.test(lastSentence)) {
        sentences[sentences.length - 1] = lastSentence.replace(/[.!?]*$/, ' 🙏')
      } else if (/привет|здравствуй/i.test(lastSentence)) {
        sentences[sentences.length - 1] = lastSentence.replace(/[.!?]*$/, '! 👋')
      } else if (Math.random() < probability) {
        sentences[sentences.length - 1] = lastSentence.replace(/[.]*$/, ' 👍')
      }
    }
    return sentences.join(' ')
  }
  
  return text
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function parsePersonality(raw: Personality): Personality {
  return {
    ...raw,
    greeting_templates: typeof raw.greeting_templates === 'string' 
      ? JSON.parse(raw.greeting_templates) : raw.greeting_templates || [],
    farewell_templates: typeof raw.farewell_templates === 'string'
      ? JSON.parse(raw.farewell_templates) : raw.farewell_templates || [],
    filler_phrases: typeof raw.filler_phrases === 'string'
      ? JSON.parse(raw.filler_phrases) : raw.filler_phrases || [],
    thinking_phrases: typeof raw.thinking_phrases === 'string'
      ? JSON.parse(raw.thinking_phrases) : raw.thinking_phrases || [],
    forbidden_topics: raw.forbidden_topics || [],
    required_disclaimers: raw.required_disclaimers || [],
  }
}
