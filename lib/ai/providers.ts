/**
 * Nexik AI - Ollama Provider
 * 100% Self-hosted LLM через Ollama
 */

import { getConfig, type OllamaConfig } from './config'

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
    num_predict?: number // max tokens
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

/**
 * Ollama API Client
 */
export class OllamaClient {
  private config: OllamaConfig

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...getConfig(), ...config }
  }

  /** Get the base URL for the Ollama server */
  get baseUrl(): string {
    return this.config.baseUrl
  }

  /**
   * Генерация ответа (chat completion)
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
    const model = options?.model || this.config.model
    
    const requestBody: OllamaGenerateRequest = {
      model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature || this.config.temperature,
        num_predict: options?.maxTokens || this.config.maxTokens,
      },
    }

    // Добавляем system prompt если есть
    if (options?.system) {
      requestBody.messages = [
        { role: 'system', content: options.system },
        ...messages,
      ]
    }

    const response = await this.request('/api/chat', requestBody)
    return response.message?.content || ''
  }

  /**
   * Простая генерация (completion)
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
   * Streaming генерация
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
          // Игнорируем невалидный JSON
        }
      }
    }
  }

  /**
   * Получить список установленных моделей
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    const response = await fetch(`${this.config.baseUrl}/api/tags`)
    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.status}`)
    }
    const data = await response.json()
    return data.models || []
  }

  /**
   * Проверить здоровье сервера
   */
  async health(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000),
      })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Проверить доступность модели
   */
  async isModelAvailable(model?: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      const targetModel = model || this.config.model
      return models.some(m => m.name === targetModel || m.name.startsWith(targetModel))
    } catch {
      return false
    }
  }

  /**
   * Скачать модель (pull)
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

    // Читаем stream до конца
    const reader = response.body?.getReader()
    if (reader) {
      while (true) {
        const { done } = await reader.read()
        if (done) break
      }
    }
  }

  /**
   * Внутренний метод для запросов
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
        
        // Если модель не найдена - пробуем fallback
        if (lastError.message.includes('not found') && this.config.fallbackModel) {
          console.log(`[Ollama] Trying fallback model: ${this.config.fallbackModel}`)
          body.model = this.config.fallbackModel
        }
        
        // Ждём перед повтором
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }

    throw lastError || new Error('Unknown error')
  }
}

// Singleton instance
let clientInstance: OllamaClient | null = null

export function getOllamaClient(config?: Partial<OllamaConfig>): OllamaClient {
  if (!clientInstance || config) {
    clientInstance = new OllamaClient(config)
  }
  return clientInstance
}
