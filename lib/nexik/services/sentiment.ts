/**
 * Nexik Sentiment Analysis Service
 * Lexical-based sentiment analysis for RU/EN without external APIs
 */

// ==========================================
// SENTIMENT DICTIONARIES (RU/EN)
// ==========================================

const POSITIVE_WORDS_RU = new Set([
  'спасибо', 'благодарю', 'отлично', 'прекрасно', 'замечательно', 'супер',
  'круто', 'здорово', 'класс', 'молодец', 'великолепно', 'чудесно',
  'восхитительно', 'потрясающе', 'изумительно', 'превосходно', 'шикарно',
  'хорошо', 'нравится', 'люблю', 'рад', 'рада', 'доволен', 'довольна',
  'счастлив', 'счастлива', 'удобно', 'быстро', 'легко', 'понятно',
  'помогли', 'помогло', 'работает', 'получилось', 'успешно', 'идеально',
  'рекомендую', 'советую', 'вернусь', 'приду', 'закажу', 'куплю',
  'понравилось', 'устраивает', 'подходит', 'то что нужно', 'ок', 'окей'
])

const NEGATIVE_WORDS_RU = new Set([
  'плохо', 'ужасно', 'отвратительно', 'кошмар', 'ужас', 'жесть',
  'не работает', 'сломано', 'баг', 'ошибка', 'проблема', 'глючит',
  'зависает', 'тормозит', 'медленно', 'долго', 'не понимаю', 'непонятно',
  'сложно', 'трудно', 'невозможно', 'не могу', 'не получается',
  'раздражает', 'бесит', 'злит', 'достало', 'надоело', 'утомило',
  'разочарован', 'разочарована', 'расстроен', 'расстроена', 'обман',
  'мошенники', 'развод', 'кидалово', 'воры', 'жулики', 'верните',
  'деньги', 'возврат', 'отмена', 'отменить', 'жалоба', 'претензия',
  'некачественно', 'брак', 'дефект', 'недоволен', 'недовольна',
  'не рекомендую', 'не советую', 'больше не приду', 'никогда', 'хуже'
])

const POSITIVE_WORDS_EN = new Set([
  'thank', 'thanks', 'great', 'excellent', 'amazing', 'awesome',
  'wonderful', 'fantastic', 'perfect', 'love', 'loved', 'happy',
  'satisfied', 'pleased', 'delighted', 'good', 'nice', 'cool',
  'helpful', 'easy', 'fast', 'quick', 'works', 'working', 'solved',
  'fixed', 'resolved', 'recommend', 'best', 'brilliant', 'superb'
])

const NEGATIVE_WORDS_EN = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'angry',
  'frustrated', 'annoyed', 'disappointed', 'upset', 'broken', 'bug',
  'error', 'issue', 'problem', 'slow', 'stuck', 'crash', 'fail',
  'failed', 'failing', 'useless', 'waste', 'scam', 'fraud', 'refund',
  'cancel', 'complaint', 'unacceptable', 'ridiculous', 'pathetic'
])

// Urgency/frustration patterns (multi-word)
const URGENCY_PATTERNS_RU = [
  /срочно/i, /немедленно/i, /сейчас же/i, /как можно скорее/i,
  /асап/i, /критично/i, /важно/i, /помогите/i, /sos/i,
  /уже \d+ (час|дн|минут)/i, /жду ответа/i, /никто не отвечает/i,
  /сколько можно/i, /когда уже/i, /почему так долго/i
]

const URGENCY_PATTERNS_EN = [
  /urgent/i, /asap/i, /immediately/i, /right now/i, /critical/i,
  /emergency/i, /help me/i, /please help/i, /waiting for/i,
  /no response/i, /how long/i, /still waiting/i
]

// Frustration amplifiers
const FRUSTRATION_AMPLIFIERS = [
  /!{2,}/,           // Multiple exclamation marks
  /\?{2,}/,          // Multiple question marks
  /\.{3,}/,          // Extended ellipsis
  /[A-ZА-Я]{3,}/,    // CAPS LOCK
  /[!?]{2,}/         // Mixed punctuation
]

// Positive emoji
const POSITIVE_EMOJI = ['😊', '😃', '😄', '🙂', '😀', '👍', '👏', '❤️', '💚', '💙', '🎉', '✨', '🌟', '⭐', '💯', '🔥', '✅', '👌', '🙏', '😍', '🥰', '😘']

// Negative emoji  
const NEGATIVE_EMOJI = ['😠', '😡', '🤬', '😤', '😞', '😢', '😭', '😩', '😫', '😣', '👎', '💔', '❌', '⚠️', '🚫', '😒', '🙄', '😑', '😐', '😔']

// ==========================================
// TYPES
// ==========================================

export type SentimentLabel = 'positive' | 'neutral' | 'negative' | 'urgent'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'

export interface SentimentResult {
  score: number            // -1.0 to +1.0
  label: SentimentLabel
  confidence: number       // 0.0 to 1.0
  urgency: number          // 0.0 to 1.0
  frustration: number      // 0.0 to 1.0
  signals: string[]        // What contributed to the score
}

export interface ConversationSentiment {
  trend: number            // Overall trend -1 to +1
  averageScore: number
  messageCount: number
  priority: Priority
  escalationReason?: string
}

// ==========================================
// ANALYSIS FUNCTIONS
// ==========================================

/**
 * Analyze sentiment of a single message
 */
export function analyzeSentiment(text: string): SentimentResult {
  const signals: string[] = []
  let positiveScore = 0
  let negativeScore = 0
  let urgencyScore = 0
  let frustrationScore = 0
  
  // Normalize text
  const normalizedText = text.toLowerCase()
  const words = normalizedText.split(/[\s,.!?;:]+/).filter(w => w.length > 1)
  
  // Count positive words
  let positiveCount = 0
  for (const word of words) {
    if (POSITIVE_WORDS_RU.has(word) || POSITIVE_WORDS_EN.has(word)) {
      positiveCount++
      signals.push(`+word:${word}`)
    }
  }
  
  // Count negative words
  let negativeCount = 0
  for (const word of words) {
    if (NEGATIVE_WORDS_RU.has(word) || NEGATIVE_WORDS_EN.has(word)) {
      negativeCount++
      signals.push(`-word:${word}`)
    }
  }
  
  // Check for multi-word patterns
  for (const pattern of [...URGENCY_PATTERNS_RU, ...URGENCY_PATTERNS_EN]) {
    if (pattern.test(text)) {
      urgencyScore += 0.3
      signals.push(`urgency:${pattern.source}`)
    }
  }
  
  // Check frustration amplifiers
  for (const pattern of FRUSTRATION_AMPLIFIERS) {
    const matches = text.match(pattern)
    if (matches) {
      frustrationScore += 0.2 * matches.length
      signals.push(`frustration:${pattern.source}`)
    }
  }
  
  // Check emoji sentiment
  for (const emoji of POSITIVE_EMOJI) {
    if (text.includes(emoji)) {
      positiveScore += 0.15
      signals.push(`+emoji:${emoji}`)
    }
  }
  
  for (const emoji of NEGATIVE_EMOJI) {
    if (text.includes(emoji)) {
      negativeScore += 0.15
      signals.push(`-emoji:${emoji}`)
    }
  }
  
  // Calculate word-based scores
  const wordCount = words.length || 1
  positiveScore += (positiveCount / wordCount) * 2
  negativeScore += (negativeCount / wordCount) * 2
  
  // Amplify negative by frustration
  negativeScore *= (1 + frustrationScore * 0.5)
  
  // Cap scores
  positiveScore = Math.min(positiveScore, 1)
  negativeScore = Math.min(negativeScore, 1)
  urgencyScore = Math.min(urgencyScore, 1)
  frustrationScore = Math.min(frustrationScore, 1)
  
  // Calculate final score (-1 to +1)
  const rawScore = positiveScore - negativeScore
  const score = Math.max(-1, Math.min(1, rawScore))
  
  // Determine label
  let label: SentimentLabel
  if (urgencyScore > 0.5 || (negativeScore > 0.5 && frustrationScore > 0.3)) {
    label = 'urgent'
  } else if (score > 0.2) {
    label = 'positive'
  } else if (score < -0.2) {
    label = 'negative'
  } else {
    label = 'neutral'
  }
  
  // Calculate confidence based on signal strength
  const signalStrength = Math.abs(positiveScore) + Math.abs(negativeScore) + urgencyScore
  const confidence = Math.min(1, signalStrength / 2)
  
  return {
    score: Math.round(score * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100,
    urgency: Math.round(urgencyScore * 100) / 100,
    frustration: Math.round(frustrationScore * 100) / 100,
    signals: signals.slice(0, 10) // Limit signals for storage
  }
}

/**
 * Calculate conversation-level sentiment and priority
 */
export function calculateConversationSentiment(
  messageSentiments: Array<{ score: number; label: SentimentLabel; urgency: number }>
): ConversationSentiment {
  if (messageSentiments.length === 0) {
    return {
      trend: 0,
      averageScore: 0,
      messageCount: 0,
      priority: 'normal'
    }
  }
  
  // Calculate average score
  const totalScore = messageSentiments.reduce((sum, m) => sum + m.score, 0)
  const averageScore = totalScore / messageSentiments.length
  
  // Calculate trend (recent messages weighted more)
  const recentMessages = messageSentiments.slice(-5)
  const weights = recentMessages.map((_, i) => i + 1) // 1, 2, 3, 4, 5
  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const weightedScore = recentMessages.reduce((sum, m, i) => sum + m.score * weights[i], 0)
  const trend = weightedScore / totalWeight
  
  // Determine priority based on patterns
  let priority: Priority = 'normal'
  let escalationReason: string | undefined
  
  // Check for urgent messages
  const urgentCount = messageSentiments.filter(m => m.label === 'urgent').length
  if (urgentCount > 0) {
    priority = 'urgent'
    escalationReason = `${urgentCount} urgent message(s)`
  }
  
  // Check for negative trend
  else if (recentMessages.length >= 3) {
    const lastThree = recentMessages.slice(-3)
    const isNegativeTrend = lastThree.every(m => m.score < 0)
    if (isNegativeTrend) {
      priority = 'high'
      escalationReason = 'Negative sentiment trend'
    }
  }
  
  // Check for consistently negative
  else if (averageScore < -0.3 && messageSentiments.length >= 2) {
    priority = 'high'
    escalationReason = 'Overall negative sentiment'
  }
  
  // Check for positive sentiment
  else if (averageScore > 0.3) {
    priority = 'low'
  }
  
  return {
    trend: Math.round(trend * 100) / 100,
    averageScore: Math.round(averageScore * 100) / 100,
    messageCount: messageSentiments.length,
    priority,
    escalationReason
  }
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: Priority): string {
  switch (priority) {
    case 'urgent': return '#ef4444' // red
    case 'high': return '#f97316'   // orange
    case 'normal': return '#3b82f6' // blue
    case 'low': return '#22c55e'    // green
  }
}

/**
 * Get sentiment emoji for quick display
 */
export function getSentimentEmoji(label: SentimentLabel): string {
  switch (label) {
    case 'positive': return '😊'
    case 'neutral': return '😐'
    case 'negative': return '😞'
    case 'urgent': return '🚨'
  }
}

// ==========================================
// DATABASE INTEGRATION
// ==========================================

/**
 * Update message with sentiment analysis
 */
export async function updateMessageSentiment(
  messageId: string,
  sentiment: SentimentResult
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `UPDATE nexik_messages 
     SET sentiment_score = $1, sentiment_label = $2, sentiment_data = $3
     WHERE id = $4`,
    [sentiment.score, sentiment.label, JSON.stringify(sentiment), messageId]
  )
}

/**
 * Update conversation sentiment and priority
 */
export async function updateConversationSentiment(
  conversationId: string,
  sentiment: ConversationSentiment
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `UPDATE nexik_conversations 
     SET sentiment_trend = $1, priority = $2
     WHERE id = $3`,
    [sentiment.trend, sentiment.priority, conversationId]
  )
}

/**
 * Get sentiment history for a conversation
 */
export async function getConversationSentimentHistory(
  conversationId: string
): Promise<Array<{ score: number; label: SentimentLabel; urgency: number }>> {
  const { query } = await import('@/lib/db')
  
  const messages = await query<{ 
    sentiment_score: number
    sentiment_label: SentimentLabel
    sentiment_data: { urgency?: number } | null
  }>(
    `SELECT sentiment_score, sentiment_label, sentiment_data
     FROM nexik_messages 
     WHERE conversation_id = $1 
       AND sender_type = 'visitor'
       AND sentiment_score IS NOT NULL
     ORDER BY created_at ASC`,
    [conversationId]
  )
  
  return messages.map(m => ({
    score: m.sentiment_score,
    label: m.sentiment_label,
    urgency: m.sentiment_data?.urgency || 0
  }))
}

/**
 * Analyze and update sentiment for a message and its conversation
 */
export async function analyzeAndUpdateSentiment(
  messageId: string,
  conversationId: string,
  content: string
): Promise<{ message: SentimentResult; conversation: ConversationSentiment }> {
  // Analyze message
  const messageSentiment = analyzeSentiment(content)
  
  // Update message
  await updateMessageSentiment(messageId, messageSentiment)
  
  // Get history and calculate conversation sentiment
  const history = await getConversationSentimentHistory(conversationId)
  history.push({
    score: messageSentiment.score,
    label: messageSentiment.label,
    urgency: messageSentiment.urgency
  })
  
  const conversationSentiment = calculateConversationSentiment(history)
  
  // Update conversation
  await updateConversationSentiment(conversationId, conversationSentiment)
  
  return {
    message: messageSentiment,
    conversation: conversationSentiment
  }
}
