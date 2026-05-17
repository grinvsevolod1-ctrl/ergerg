/**
 * Nexik AI Router
 * 100% Self-hosted через Ollama
 */

import { getConfig, type OllamaConfig } from './config'
import { getOllamaClient, type OllamaMessage } from './providers'
import { getRAGContext, initializeDefaultKnowledge } from './knowledge'

export interface ChatContext {
  // ID клиента для RAG (multi-tenant)
  clientId?: string
  // Информация о компании клиента
  companyName?: string
  companyDescription?: string
  // База знаний (FAQ, документы) - напрямую или через RAG
  knowledgeBase?: string
  // Использовать RAG для автоматического поиска
  useRAG?: boolean
  // Предыдущие сообщения для контекста
  previousMessages?: OllamaMessage[]
  // Язык ответов
  language?: 'ru' | 'en'
}

export interface GenerateOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

/**
 * Системный промпт для Nexik
 */
function buildSystemPrompt(context: ChatContext): string {
  const companyInfo = context.companyName 
    ? `Ты AI-ассистент компании "${context.companyName}".${context.companyDescription ? ` ${context.companyDescription}` : ''}`
    : 'Ты AI-ассистент Nexik.'

  const knowledgeSection = context.knowledgeBase
    ? `\n\nБаза знаний:\n${context.knowledgeBase}`
    : ''

  return `${companyInfo}

Твоя задача — помогать посетителям сайта, отвечать на вопросы и направлять к нужной информации.

Правила:
1. Отвечай кратко и по делу (2-4 предложения)
2. Будь дружелюбным и профессиональным
3. Если не знаешь ответ — предложи связаться с оператором
4. Не выдумывай информацию, которой нет в базе знаний
5. Используй markdown для форматирования (жирный, списки)
6. Отвечай на языке пользователя${knowledgeSection}

Если пользователь хочет связаться с человеком, сообщи что можешь подключить оператора.`
}

/**
 * Генерация ответа через Ollama
 */
export async function generateResponse(
  message: string,
  context: ChatContext = {},
  options: GenerateOptions = {}
): Promise<{ text: string; model: string; ragUsed?: boolean }> {
  const config = getConfig()
  const client = getOllamaClient()
  
  // Инициализируем базу знаний по умолчанию
  await initializeDefaultKnowledge()

  // Получаем контекст из RAG если включен
  let ragContext = ''
  let ragUsed = false
  
  if (context.useRAG !== false) {
    const clientId = context.clientId || 'netnext'
    const ragResult = await getRAGContext(clientId, message, { topK: 3 })
    
    if (ragResult.formattedContext) {
      ragContext = ragResult.formattedContext
      ragUsed = true
    }
  }

  // Объединяем RAG контекст с переданной базой знаний
  const combinedKnowledge = [
    ragContext,
    context.knowledgeBase,
  ].filter(Boolean).join('\n\n---\n\n')

  const enrichedContext: ChatContext = {
    ...context,
    knowledgeBase: combinedKnowledge || undefined,
  }

  const systemPrompt = buildSystemPrompt(enrichedContext)
  const messages: OllamaMessage[] = [
    ...(context.previousMessages || []),
    { role: 'user', content: message }
  ]

  try {
    const text = await client.chat(messages, {
      model: options.model || config.model,
      system: systemPrompt,
      maxTokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    })

    return {
      text,
      model: options.model || config.model,
      ragUsed,
    }
  } catch (error) {
    console.error('[Nexik AI] Ollama error:', error)
    
    // Возвращаем fallback ответ
    return {
      text: 'Извините, AI-ассистент временно недоступен. Попробуйте позже или свяжитесь с оператором.',
      model: config.model,
      ragUsed,
    }
  }
}

/**
 * Streaming генерация для real-time ответов
 */
export async function* streamResponse(
  message: string,
  context: ChatContext = {},
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const config = getConfig()
  const client = getOllamaClient()

  // RAG context
  let ragContext = ''
  if (context.useRAG !== false) {
    await initializeDefaultKnowledge()
    const clientId = context.clientId || 'netnext'
    const ragResult = await getRAGContext(clientId, message, { topK: 3 })
    if (ragResult.formattedContext) {
      ragContext = ragResult.formattedContext
    }
  }

  const enrichedContext: ChatContext = {
    ...context,
    knowledgeBase: [ragContext, context.knowledgeBase].filter(Boolean).join('\n\n---\n\n') || undefined,
  }

  const systemPrompt = buildSystemPrompt(enrichedContext)
  const messages: OllamaMessage[] = [
    ...(context.previousMessages || []),
    { role: 'user', content: message }
  ]

  try {
    for await (const chunk of client.chatStream(messages, {
      model: options.model || config.model,
      system: systemPrompt,
      maxTokens: options.maxTokens || config.maxTokens,
      temperature: options.temperature || config.temperature,
    })) {
      yield chunk
    }
  } catch (error) {
    console.error('[Nexik AI] Stream error:', error)
    yield 'Извините, произошла ошибка. Попробуйте позже.'
  }
}

/**
 * Проверка статуса Ollama сервера
 */
export async function checkHealth(): Promise<{
  healthy: boolean
  model: string
  modelAvailable: boolean
  availableModels: string[]
}> {
  const config = getConfig()
  const client = getOllamaClient()

  try {
    const healthy = await client.health()
    if (!healthy) {
      return {
        healthy: false,
        model: config.model,
        modelAvailable: false,
        availableModels: [],
      }
    }

    const models = await client.listModels()
    const availableModels = models.map(m => m.name)
    const modelAvailable = availableModels.some(
      m => m === config.model || m.startsWith(config.model.split(':')[0])
    )

    return {
      healthy: true,
      model: config.model,
      modelAvailable,
      availableModels,
    }
  } catch (error) {
    console.error('[Nexik AI] Health check failed:', error)
    return {
      healthy: false,
      model: config.model,
      modelAvailable: false,
      availableModels: [],
    }
  }
}

/**
 * Получить информацию о конфигурации
 */
export function getAIInfo(): {
  baseUrl: string
  model: string
  fallbackModel?: string
  maxTokens: number
  temperature: number
} {
  const config = getConfig()
  return {
    baseUrl: config.baseUrl,
    model: config.model,
    fallbackModel: config.fallbackModel,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  }
}
