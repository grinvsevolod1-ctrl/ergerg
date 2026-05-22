/**
 * Nexik Multi-Language Detection Service
 * N-gram based language detection without external APIs
 * Supports: RU, EN, UK, BY (Belarusian), KZ, DE, FR, ES, PL, IT, PT, TR
 */

// ==========================================
// LANGUAGE PROFILES (N-gram based)
// ==========================================

// Common 2-3 letter sequences (bigrams/trigrams) for each language
const LANGUAGE_PROFILES: Record<string, { 
  chars: Set<string>
  trigrams: string[]
  words: Set<string>
  name: string
  nativeName: string
}> = {
  ru: {
    chars: new Set('абвгдеёжзийклмнопрстуфхцчшщъыьэюя'),
    trigrams: ['что', 'как', 'это', 'для', 'при', 'все', 'его', 'она', 'они', 'мне', 'вас', 'нас', 'ваш', 'мой', 'был', 'быт', 'ого', 'ени', 'ние', 'ост'],
    words: new Set(['и', 'в', 'не', 'на', 'я', 'что', 'он', 'с', 'как', 'это', 'по', 'но', 'из', 'у', 'к', 'за', 'от', 'до', 'же', 'ты', 'мы', 'вы', 'да', 'нет', 'есть', 'был', 'она', 'они', 'все', 'так', 'его', 'чем', 'или', 'при', 'для', 'уже']),
    name: 'Russian',
    nativeName: 'Русский'
  },
  en: {
    chars: new Set('abcdefghijklmnopqrstuvwxyz'),
    trigrams: ['the', 'ing', 'and', 'ion', 'tio', 'ent', 'ati', 'for', 'her', 'ter', 'hat', 'tha', 'ere', 'ate', 'his', 'con', 'res', 'ver', 'all', 'ons'],
    words: new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'can', 'like', 'just', 'him', 'know', 'take', 'into', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'way', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were', 'been', 'has', 'had', 'did', 'does', 'do', 'yes', 'no', 'ok', 'okay', 'hi', 'hello', 'thanks', 'thank', 'please', 'help']),
    name: 'English',
    nativeName: 'English'
  },
  uk: {
    chars: new Set('абвгґдеєжзиіїйклмнопрстуфхцчшщьюя'),
    trigrams: ['що', 'як', 'для', 'при', 'все', 'його', 'вона', 'вони', 'мені', 'вас', 'нас', 'ваш', 'мій', 'був', 'ого', 'енн', 'ння', 'ість'],
    words: new Set(['і', 'в', 'не', 'на', 'я', 'що', 'він', 'з', 'як', 'це', 'по', 'але', 'із', 'у', 'до', 'за', 'від', 'же', 'ти', 'ми', 'ви', 'так', 'його', 'її', 'або', 'при', 'для', 'вже', 'є', 'був', 'були', 'буде', 'якщо', 'коли', 'тут', 'там', 'чи', 'бо']),
    name: 'Ukrainian',
    nativeName: 'Українська'
  },
  by: {
    chars: new Set('абвгдеёжзійклмнопрстуўфхцчшыьэюя'),
    trigrams: ['што', 'як', 'для', 'пры', 'усе', 'яго', 'яна', 'яны', 'мне', 'вас', 'нас', 'ваш', 'мой', 'быў', 'ога', 'энн', 'нне', 'асц'],
    words: new Set(['і', 'ў', 'не', 'на', 'я', 'што', 'ён', 'з', 'як', 'гэта', 'па', 'але', 'з', 'у', 'да', 'за', 'ад', 'жа', 'ты', 'мы', 'вы', 'так', 'яго', 'яе', 'ці', 'пры', 'для', 'ужо', 'ёсць', 'быў', 'былі', 'будзе', 'калі', 'тут', 'там']),
    name: 'Belarusian',
    nativeName: 'Беларуская'
  },
  kk: {
    chars: new Set('аәбвгғдеёжзийкқлмнңоөпрстуұүфхһцчшщъыіьэюя'),
    trigrams: ['мен', 'бір', 'бол', 'қал', 'жан', 'тар', 'лар', 'лер', 'дер', 'тер', 'ның', 'дің', 'тің'],
    words: new Set(['мен', 'сен', 'ол', 'біз', 'сіз', 'олар', 'бұл', 'осы', 'жоқ', 'бар', 'не', 'қай', 'және', 'бірақ', 'үшін', 'да', 'де', 'болады', 'болды', 'керек', 'деп', 'деді']),
    name: 'Kazakh',
    nativeName: 'Қазақша'
  },
  de: {
    chars: new Set('abcdefghijklmnopqrstuvwxyzäöüß'),
    trigrams: ['der', 'die', 'und', 'ein', 'den', 'das', 'ist', 'von', 'sie', 'des', 'dem', 'mit', 'sich', 'ich', 'auf', 'für', 'nicht', 'sch', 'ung', 'cht'],
    words: new Set(['der', 'die', 'und', 'in', 'zu', 'den', 'das', 'nicht', 'von', 'sie', 'ist', 'des', 'sich', 'mit', 'dem', 'dass', 'er', 'es', 'ein', 'ich', 'auf', 'so', 'eine', 'auch', 'als', 'an', 'nach', 'wie', 'im', 'für', 'ja', 'nein', 'bitte', 'danke', 'hallo', 'gut']),
    name: 'German',
    nativeName: 'Deutsch'
  },
  fr: {
    chars: new Set('abcdefghijklmnopqrstuvwxyzàâæçéèêëîïôùûüœ'),
    trigrams: ['les', 'ent', 'que', 'ion', 'de ', 'ait', 'pour', 'est', 'une', 'ons', 'ant', 'qui', 'eur', 'par', 'tre', 'ien', 'eme', 'ous'],
    words: new Set(['de', 'la', 'le', 'et', 'les', 'des', 'en', 'un', 'du', 'une', 'que', 'est', 'pour', 'qui', 'dans', 'ce', 'il', 'pas', 'plus', 'par', 'je', 'sur', 'se', 'son', 'au', 'oui', 'non', 'merci', 'bonjour', 'bien', 'avec', 'tout', 'elle', 'nous', 'vous']),
    name: 'French',
    nativeName: 'Français'
  },
  es: {
    chars: new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñ'),
    trigrams: ['que', 'los', 'del', 'las', 'por', 'con', 'una', 'para', 'est', 'ión', 'ent', 'ado', 'era', 'cia', 'mente'],
    words: new Set(['de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'es', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'sí', 'hola', 'gracias', 'bien', 'muy', 'todo', 'esto']),
    name: 'Spanish',
    nativeName: 'Español'
  },
  pl: {
    chars: new Set('aąbcćdeęfghijklłmnńoóprsśtuwyzźż'),
    trigrams: ['nie', 'prz', 'pow', 'jak', 'czy', 'ści', 'owa', 'nia', 'kie', 'rze', 'ych', 'ego'],
    words: new Set(['i', 'w', 'nie', 'na', 'z', 'do', 'że', 'to', 'co', 'się', 'jest', 'jak', 'tak', 'ale', 'za', 'od', 'po', 'już', 'czy', 'może', 'tu', 'tam', 'kiedy', 'gdzie', 'dlaczego', 'tak', 'nie', 'proszę', 'dziękuję', 'cześć']),
    name: 'Polish',
    nativeName: 'Polski'
  },
  it: {
    chars: new Set('abcdefghilmnopqrstuvzàèéìòù'),
    trigrams: ['che', 'ell', 'per', 'del', 'lla', 'con', 'ion', 'ent', 'non', 'ato', 'are', 'ere', 'zione'],
    words: new Set(['di', 'che', 'e', 'la', 'il', 'un', 'a', 'per', 'in', 'una', 'non', 'sono', 'da', 'è', 'si', 'come', 'lo', 'ma', 'ho', 'le', 'con', 'cosa', 'no', 'sì', 'grazie', 'ciao', 'bene', 'molto', 'questo', 'tutto']),
    name: 'Italian',
    nativeName: 'Italiano'
  },
  pt: {
    chars: new Set('abcdefghijklmnopqrstuvwxyzáàâãéêíóôõúüç'),
    trigrams: ['que', 'ent', 'ção', 'com', 'par', 'est', 'ade', 'men', 'con', 'dos', 'das', 'por'],
    words: new Set(['de', 'que', 'e', 'o', 'a', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'ao', 'sim', 'obrigado', 'olá', 'bem', 'muito', 'isso']),
    name: 'Portuguese',
    nativeName: 'Português'
  },
  tr: {
    chars: new Set('abcçdefgğhıijklmnoöprsştuüvyz'),
    trigrams: ['lar', 'ler', 'bir', 'için', 'dan', 'den', 'ile', 'mak', 'mek', 'yor', 'dır', 'dir'],
    words: new Set(['ve', 'bir', 'bu', 'da', 'de', 'için', 'ile', 'o', 'ne', 'var', 'daha', 'çok', 'gibi', 'ben', 'sen', 'biz', 'siz', 'evet', 'hayır', 'teşekkürler', 'merhaba', 'iyi', 'tamam']),
    name: 'Turkish',
    nativeName: 'Türkçe'
  }
}

// Language groups for faster initial detection
const CYRILLIC_LANGUAGES = ['ru', 'uk', 'by', 'kk']
const LATIN_LANGUAGES = ['en', 'de', 'fr', 'es', 'pl', 'it', 'pt', 'tr']

// ==========================================
// TYPES
// ==========================================

export type LanguageCode = 'ru' | 'en' | 'uk' | 'by' | 'kk' | 'de' | 'fr' | 'es' | 'pl' | 'it' | 'pt' | 'tr' | 'unknown'

export interface LanguageDetectionResult {
  language: LanguageCode
  confidence: number       // 0.0 to 1.0
  name: string
  nativeName: string
  scores: Record<string, number>
  isReliable: boolean
}

// ==========================================
// DETECTION FUNCTIONS
// ==========================================

/**
 * Detect script type (Cyrillic vs Latin)
 */
function detectScript(text: string): 'cyrillic' | 'latin' | 'mixed' {
  const cleanText = text.toLowerCase().replace(/[^a-zа-яёіїєґўәңғқұүһөө]/g, '')
  
  let cyrillicCount = 0
  let latinCount = 0
  
  for (const char of cleanText) {
    if (/[а-яёіїєґўәңғқұүһөө]/.test(char)) cyrillicCount++
    else if (/[a-z]/.test(char)) latinCount++
  }
  
  const total = cyrillicCount + latinCount
  if (total === 0) return 'mixed'
  
  const cyrillicRatio = cyrillicCount / total
  if (cyrillicRatio > 0.8) return 'cyrillic'
  if (cyrillicRatio < 0.2) return 'latin'
  return 'mixed'
}

/**
 * Calculate language score based on word matching
 */
function calculateWordScore(words: string[], langCode: string): number {
  const profile = LANGUAGE_PROFILES[langCode]
  if (!profile) return 0
  
  let matches = 0
  for (const word of words) {
    if (profile.words.has(word)) {
      matches++
    }
  }
  
  return words.length > 0 ? matches / words.length : 0
}

/**
 * Calculate language score based on trigram matching
 */
function calculateTrigramScore(text: string, langCode: string): number {
  const profile = LANGUAGE_PROFILES[langCode]
  if (!profile) return 0
  
  const cleanText = text.toLowerCase()
  let matches = 0
  
  for (const trigram of profile.trigrams) {
    if (cleanText.includes(trigram)) {
      matches++
    }
  }
  
  return matches / profile.trigrams.length
}

/**
 * Calculate language score based on character set
 */
function calculateCharScore(text: string, langCode: string): number {
  const profile = LANGUAGE_PROFILES[langCode]
  if (!profile) return 0
  
  const cleanText = text.toLowerCase().replace(/[\s\d.,!?;:'"()-]/g, '')
  if (cleanText.length === 0) return 0
  
  let matches = 0
  for (const char of cleanText) {
    if (profile.chars.has(char)) {
      matches++
    }
  }
  
  return matches / cleanText.length
}

/**
 * Detect language of a text
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  // Handle empty or very short text
  if (!text || text.trim().length < 3) {
    return {
      language: 'unknown',
      confidence: 0,
      name: 'Unknown',
      nativeName: 'Unknown',
      scores: {},
      isReliable: false
    }
  }
  
  const cleanText = text.toLowerCase().trim()
  const words = cleanText.split(/[\s,.!?;:]+/).filter(w => w.length > 1)
  
  // Detect script to narrow down candidates
  const script = detectScript(cleanText)
  const candidates = script === 'cyrillic' 
    ? CYRILLIC_LANGUAGES 
    : script === 'latin' 
      ? LATIN_LANGUAGES 
      : [...CYRILLIC_LANGUAGES, ...LATIN_LANGUAGES]
  
  // Calculate scores for each candidate language
  const scores: Record<string, number> = {}
  
  for (const langCode of candidates) {
    const wordScore = calculateWordScore(words, langCode) * 0.5      // 50% weight
    const trigramScore = calculateTrigramScore(cleanText, langCode) * 0.3  // 30% weight
    const charScore = calculateCharScore(cleanText, langCode) * 0.2        // 20% weight
    
    scores[langCode] = wordScore + trigramScore + charScore
  }
  
  // Find the best match
  let bestLang = 'unknown'
  let bestScore = 0
  
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestLang = lang
    }
  }
  
  // If no good match and script is clear, default to most common
  if (bestScore < 0.1) {
    if (script === 'cyrillic') {
      bestLang = 'ru'
      bestScore = 0.3
    } else if (script === 'latin') {
      bestLang = 'en'
      bestScore = 0.3
    }
  }
  
  const profile = LANGUAGE_PROFILES[bestLang]
  const confidence = Math.min(1, bestScore * 2) // Scale to 0-1
  
  return {
    language: bestLang as LanguageCode,
    confidence: Math.round(confidence * 100) / 100,
    name: profile?.name || 'Unknown',
    nativeName: profile?.nativeName || 'Unknown',
    scores,
    isReliable: confidence > 0.5 && words.length >= 3
  }
}

/**
 * Get language-specific system prompt modifier
 */
export function getLanguagePromptModifier(language: LanguageCode): string {
  switch (language) {
    case 'ru':
      return 'Отвечай на русском языке.'
    case 'en':
      return 'Respond in English.'
    case 'uk':
      return 'Відповідай українською мовою.'
    case 'by':
      return 'Адказвай на беларускай мове.'
    case 'kk':
      return 'Қазақ тілінде жауап беріңіз.'
    case 'de':
      return 'Antworte auf Deutsch.'
    case 'fr':
      return 'Réponds en français.'
    case 'es':
      return 'Responde en español.'
    case 'pl':
      return 'Odpowiadaj po polsku.'
    case 'it':
      return 'Rispondi in italiano.'
    case 'pt':
      return 'Responda em português.'
    case 'tr':
      return 'Türkçe yanıt ver.'
    default:
      return ''
  }
}

/**
 * Get greeting in detected language
 */
export function getGreeting(language: LanguageCode): string {
  switch (language) {
    case 'ru': return 'Здравствуйте! Чем могу помочь?'
    case 'en': return 'Hello! How can I help you?'
    case 'uk': return 'Вітаю! Чим можу допомогти?'
    case 'by': return 'Добры дзень! Чым магу дапамагчы?'
    case 'kk': return 'Сәлеметсіз бе! Сізге қалай көмектесе аламын?'
    case 'de': return 'Hallo! Wie kann ich Ihnen helfen?'
    case 'fr': return 'Bonjour! Comment puis-je vous aider?'
    case 'es': return '¡Hola! ¿En qué puedo ayudarle?'
    case 'pl': return 'Dzień dobry! W czym mogę pomóc?'
    case 'it': return 'Ciao! Come posso aiutarti?'
    case 'pt': return 'Olá! Como posso ajudá-lo?'
    case 'tr': return 'Merhaba! Size nasıl yardımcı olabilirim?'
    default: return 'Hello! How can I help you?'
  }
}

/**
 * Get offline message in detected language
 */
export function getOfflineMessage(language: LanguageCode): string {
  switch (language) {
    case 'ru': return 'Мы сейчас офлайн. Оставьте сообщение, и мы ответим как можно скорее.'
    case 'en': return 'We are currently offline. Leave a message and we will get back to you soon.'
    case 'uk': return 'Ми зараз офлайн. Залиште повідомлення, і ми відповімо якнайшвидше.'
    case 'de': return 'Wir sind derzeit offline. Hinterlassen Sie eine Nachricht und wir melden uns bald.'
    case 'fr': return 'Nous sommes actuellement hors ligne. Laissez un message et nous vous répondrons bientôt.'
    case 'es': return 'Estamos fuera de línea. Deje un mensaje y le responderemos pronto.'
    default: return 'We are currently offline. Leave a message and we will get back to you soon.'
  }
}

// ==========================================
// DATABASE INTEGRATION
// ==========================================

/**
 * Update message with detected language
 */
export async function updateMessageLanguage(
  messageId: string,
  language: LanguageCode
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `UPDATE nexik_messages SET detected_language = $1 WHERE id = $2`,
    [language, messageId]
  )
}

/**
 * Update conversation primary language
 */
export async function updateConversationLanguage(
  conversationId: string,
  language: LanguageCode
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `UPDATE nexik_conversations SET primary_language = $1 WHERE id = $2`,
    [language, conversationId]
  )
}

/**
 * Detect and update language for message and conversation
 */
export async function detectAndUpdateLanguage(
  messageId: string,
  conversationId: string,
  content: string
): Promise<LanguageDetectionResult> {
  const result = detectLanguage(content)
  
  // Update message
  await updateMessageLanguage(messageId, result.language)
  
  // Update conversation if reliable
  if (result.isReliable) {
    await updateConversationLanguage(conversationId, result.language)
  }
  
  return result
}
