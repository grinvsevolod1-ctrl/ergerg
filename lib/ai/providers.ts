/**
 * Nexik AI - Ollama Provider with Fallback Chain
 * 100% Self-hosted LLM with multi-model fallback
 * 
 * Better than Intercom/Tidio:
 * - Multi-model fallback chain (no single point of failure)
 * - Rule-based responses when AI is unavailable
 * - Graceful degradation with operator notification
 */

import { getConfig, type OllamaConfig, OLLAMA_MODELS } from './config'

// =====================================================
// TYPES
// =====================================================

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OllamaGenerateRequest {
  model: string
  prompt?: string
  messages?: OllamaMessage[]
  system?: string
  stream?: boolean
  options?: {
    temperature?: number
    num_predict?: number
    top_p?: number
    top_k?: number
    stop?: string[]
  }
}

export interface OllamaGenerateResponse {
  model: string
  created_at: string
  message?: {
    role: string
    content: string
  }
  response?: string
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
  eval_duration?: number
}

export interface OllamaModelInfo {
  name: string
  modified_at: string
  size: number
  digest: string
}

export interface FallbackResponse {
  content: string
  source: 'ai' | 'fallback_ai' | 'rule_based' | 'graceful_degradation'
  model?: string
  error?: string
}

// =====================================================
// FALLBACK CHAIN CONFIGURATION
// =====================================================

const FALLBACK_CHAIN = {
  // Primary models to try (in order)
  models: [
    'qwen2.5:7b',      // Primary - best for Russian
    'llama3.1:8b',     // Fallback 1 - great quality
    'mistral:7b',      // Fallback 2 - reliable
    'qwen2.5:3b',      // Fallback 3 - lightweight
    'llama3.2:3b',     // Fallback 4 - very fast
    'phi3:mini',       // Fallback 5 - minimal
    'tinyllama',       // Last resort - tiny but works
  ],
  
  // Timeout for each model attempt (ms)
  modelTimeout: 30000,
  
  // Total timeout for all attempts (ms)
  totalTimeout: 90000,
  
  // Rule-based responses (when all AI fails)
  ruleBasedResponses: {
    greetings: {
      patterns: [/привет/i, /здравствуй/i, /добрый\s+(день|вечер|утро)/i, /hello/i, /hi\b/i],
      responses: [
        'Здравствуйте! Чем могу помочь?',
        'Привет! Как я могу вам помочь?',
        'Добрый день! Чем могу быть полезен?'
      ]
    },
    goodbye: {
      patterns: [/пока/i, /до свидания/i, /спасибо.*всё/i, /goodbye/i, /bye/i],
      responses: [
        'До свидания! Обращайтесь, если возникнут вопросы.',
        'Всего доброго! Буду рад помочь в следующий раз.',
        'Спасибо за обращение! Удачи!'
      ]
    },
    thanks: {
      patterns: [/спасибо/i, /благодарю/i, /thank/i],
      responses: [
        'Пожалуйста! Рад был помочь.',
        'Не за что! Обращайтесь, если будут ещё вопросы.',
        'Всегда рад помочь!'
      ]
    },
    operator: {
      patterns: [/оператор/i, /человек/i, /менеджер/i, /живой/i, /connect.*agent/i, /talk.*human/i],
      responses: [
        'Понял вас! Оператор подключится в ближайшее время. Можете описать ваш вопрос подробнее, пока ждёте.',
        'Сейчас передам ваш вопрос оператору. Обычно они отвечают в течение нескольких минут.'
      ]
    },
    prices: {
      patterns: [/цен/i, /стоим/i, /сколько.*стоит/i, /price/i, /cost/i],
      responses: [
        'Для уточнения цен рекомендую связаться с нашим менеджером. Хотите, чтобы я передал ваш вопрос оператору?',
        'Стоимость зависит от конкретных требований. Могу соединить вас с менеджером для подробной консультации.'
      ]
    },
    contact: {
      patterns: [/контакт/i, /телефон/i, /email|почт/i, /связ/i, /contact/i, /phone/i],
      responses: [
        'Вы можете связаться с нами через этот чат, или оставьте свои контакты — мы перезвоним.',
        'Чтобы мы могли связаться с вами, пожалуйста, оставьте ваш email или телефон.'
      ]
    }
  },
  
  // Graceful degradation message
  degradationMessage: 'Извините, AI-ассистент временно недоступен. Оператор скоро ответит на ваш вопрос. Среднее время ожидания — несколько минут.'
}

// =====================================================
// OLLAMA CLIENT
// =====================================================

export class OllamaClient {
  private config: OllamaConfig
  private availableModels: Set<string> = new Set()
  private lastHealthCheck: number = 0
  private isHealthy: boolean = false

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...getConfig(), ...config }
  }

  get baseUrl(): string {
    return this.config.baseUrl
  }

  /**
   * Chat with fallback chain - MAIN METHOD
   * Tries multiple models and strategies to always return a response
   */
  async chatWithFallback(
    messages: OllamaMessage[],
    options?: {
      model?: string
      system?: string
      temperature?: number
      maxTokens?: number
      ragContext?: string
    }
  ): Promise<FallbackResponse> {
    const startTime = Date.now()
    const errors: string[] = []
    
    // Build the model chain
    const modelsToTry = this.buildModelChain(options?.model)
    
    // Step 1: Try AI models in sequence
    for (const model of modelsToTry) {
      if (Date.now() - startTime > FALLBACK_CHAIN.totalTimeout) {
        break
      }
      
      try {
        const response = await this.tryModel(model, messages, options)
        
        if (response) {
          const source = model === modelsToTry[0] ? 'ai' : 'fallback_ai'
          return {
            content: response,
            source,
            model
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${model}: ${errorMsg}`)
        console.warn(`[Ollama] Model ${model} failed:`, errorMsg)
      }
    }
    
    // Step 2: Try rule-based response
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''
    const ruleBasedResponse = this.getRuleBasedResponse(lastUserMessage)
    
    if (ruleBasedResponse) {
      return {
        content: ruleBasedResponse,
        source: 'rule_based',
        error: errors.join('; ')
      }
    }
    
    // Step 3: Try RAG-only response (if we have context)
    if (options?.ragContext) {
      const ragResponse = this.formatRagAsResponse(options.ragContext, lastUserMessage)
      if (ragResponse) {
        return {
          content: ragResponse,
          source: 'rule_based',
          error: errors.join('; ')
        }
      }
    }
    
    // Step 4: Graceful degradation
    return {
      content: FALLBACK_CHAIN.degradationMessage,
      source: 'graceful_degradation',
      error: errors.join('; ')
    }
  }

  /**
   * Build ordered list of models to try
   */
  private buildModelChain(preferredModel?: string): string[] {
    const chain: string[] = []
    
    // Start with preferred model if specified
    if (preferredModel) {
      chain.push(preferredModel)
    }
    
    // Add config model
    if (this.config.model && !chain.includes(this.config.model)) {
      chain.push(this.config.model)
    }
    
    // Add fallback model from config
    if (this.config.fallbackModel && !chain.includes(this.config.fallbackModel)) {
      chain.push(this.config.fallbackModel)
    }
    
    // Add remaining fallback chain models
    for (const model of FALLBACK_CHAIN.models) {
      if (!chain.includes(model)) {
        chain.push(model)
      }
    }
    
    return chain
  }

  /**
   * Try a single model with timeout
   */
  private async tryModel(
    model: string,
    messages: OllamaMessage[],
    options?: {
      system?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string | null> {
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      FALLBACK_CHAIN.modelTimeout
    )
    
    try {
      const allMessages = options?.system
        ? [{ role: 'system' as const, content: options.system }, ...messages]
        : messages

      const requestBody: OllamaGenerateRequest = {
        model,
        messages: allMessages,
        stream: false,
        options: {
          temperature: options?.temperature || this.config.temperature,
          num_predict: options?.maxTokens || this.config.maxTokens,
        },
      }

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json() as OllamaGenerateResponse
      const content = data.message?.content?.trim()
      
      if (!content || content.length < 2) {
        throw new Error('Empty response')
      }
      
      return content
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Get rule-based response if message matches a pattern
   */
  private getRuleBasedResponse(message: string): string | null {
    const rules = FALLBACK_CHAIN.ruleBasedResponses
    
    for (const [, rule] of Object.entries(rules)) {
      for (const pattern of rule.patterns) {
        if (pattern.test(message)) {
          const responses = rule.responses
          return responses[Math.floor(Math.random() * responses.length)]
        }
      }
    }
    
    return null
  }

  /**
   * Format RAG context as a direct response when AI is unavailable
   */
  private formatRagAsResponse(ragContext: string, _query: string): string | null {
    // Extract the most relevant part of RAG context
    const lines = ragContext.split('\n').filter(l => l.trim())
    const contentLines = lines.filter(l => !l.startsWith('#') && !l.startsWith('---'))
    
    if (contentLines.length === 0) return null
    
    // Take first few lines as response
    const response = contentLines.slice(0, 5).join('\n').trim()
    
    if (response.length < 20) return null
    
    return `На основе нашей базы знаний:\n\n${response}\n\n_Если нужна дополнительная информация, оператор скоро подключится._`
  }

  /**
   * Standard chat (without fallback chain)
   */
  async chat(
    messages: OllamaMessage[],
    options?: {
      model?: string
      system?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string> {
    const result = await this.chatWithFallback(messages, options)
    return result.content
  }

  /**
   * Simple generation (completion)
   */
  async generate(
    prompt: string,
    options?: {
      model?: string
      system?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<string> {
    const model = options?.model || this.config.model

    const requestBody: OllamaGenerateRequest = {
      model,
      prompt,
      system: options?.system,
      stream: false,
      options: {
        temperature: options?.temperature || this.config.temperature,
        num_predict: options?.maxTokens || this.config.maxTokens,
      },
    }

    const response = await this.request('/api/generate', requestBody)
    return response.response || ''
  }

  /**
   * Streaming chat generation
   */
  async *chatStream(
    messages: OllamaMessage[],
    options?: {
      model?: string
      system?: string
      temperature?: number
      maxTokens?: number
    }
  ): AsyncGenerator<string, void, unknown> {
    const model = options?.model || this.config.model

    const allMessages = options?.system
      ? [{ role: 'system' as const, content: options.system }, ...messages]
      : messages

    const requestBody: OllamaGenerateRequest = {
      model,
      messages: allMessages,
      stream: true,
      options: {
        temperature: options?.temperature || this.config.temperature,
        num_predict: options?.maxTokens || this.config.maxTokens,
      },
    }

    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line) as OllamaGenerateResponse
          if (data.message?.content) {
            yield data.message.content
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    }
  }

  /**
   * List installed models
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`)
      }
      const data = await response.json()
      const models = data.models || []
      
      // Cache available models
      this.availableModels = new Set(models.map((m: OllamaModelInfo) => m.name))
      
      return models
    } catch (error) {
      console.error('[Ollama] Failed to list models:', error)
      return []
    }
  }

  /**
   * Health check with caching
   */
  async health(): Promise<boolean> {
    // Cache health check for 30 seconds
    if (Date.now() - this.lastHealthCheck < 30000) {
      return this.isHealthy
    }
    
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      this.isHealthy = response.ok
      this.lastHealthCheck = Date.now()
      return this.isHealthy
    } catch {
      this.isHealthy = false
      this.lastHealthCheck = Date.now()
      return false
    }
  }

  /**
   * Check if specific model is available
   */
  async isModelAvailable(model?: string): Promise<boolean> {
    try {
      if (this.availableModels.size === 0) {
        await this.listModels()
      }
      
      const targetModel = model || this.config.model
      return this.availableModels.has(targetModel) || 
             [...this.availableModels].some(m => m.startsWith(targetModel))
    } catch {
      return false
    }
  }

  /**
   * Pull (download) a model
   */
  async pullModel(model: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model }),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (reader) {
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }
    }
  }

  /**
   * Internal request method with retries
   */
  private async request(
    endpoint: string,
    body: OllamaGenerateRequest,
    retries = this.config.retries
  ): Promise<OllamaGenerateResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

        const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Ollama API error ${response.status}: ${errorText}`)
        }

        return await response.json()
      } catch (error) {
        lastError = error as Error
        console.error(`[Ollama] Attempt ${attempt + 1} failed:`, error)
        
        if (lastError.message.includes('not found') && this.config.fallbackModel) {
          body.model = this.config.fallbackModel
        }
        
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }

    throw lastError || new Error('Unknown error')
  }
}

// =====================================================
// SINGLETON
// =====================================================

let clientInstance: OllamaClient | null = null

export function getOllamaClient(config?: Partial<OllamaConfig>): OllamaClient {
  if (!clientInstance || config) {
    clientInstance = new OllamaClient(config)
  }
  return clientInstance
}

/**
 * Get AI response with full fallback chain
 * This is the recommended method for Nexik chat
 */
export async function getAIResponseWithFallback(
  messages: OllamaMessage[],
  options?: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
    ragContext?: string
  }
): Promise<FallbackResponse> {
  const client = getOllamaClient()
  return client.chatWithFallback(messages, options)
}

export function getOllamaBaseUrl(): string {
  return process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
}
