/**
 * Nexik AI Router - Dual Server Architecture
 * 
 * FAST server (5.35.80.242): qwen2.5:1.5b, qwen2.5:3b - for simple tasks
 * QUALITY server (31.76.93.2): qwen2.5:7b - for complex tasks
 */

import { getConfig } from './config'

// Server configuration
export const AI_SERVERS = {
  fast: {
    name: 'FAST',
    url: process.env.OLLAMA_FAST_URL || 'http://5.35.80.242:11434',
    models: ['qwen2.5:1.5b', 'qwen2.5:3b'],
    defaultModel: 'qwen2.5:1.5b',
    complexModel: 'qwen2.5:3b',
    tasks: ['classify', 'sentiment', 'language', 'tagging', 'simple', 'analyze'],
    maxTokens: 256,
    timeout: 30000,
  },
  quality: {
    name: 'QUALITY',
    url: process.env.OLLAMA_QUALITY_URL || 'http://31.76.93.2:11434',
    models: ['qwen2.5:7b'],
    defaultModel: 'qwen2.5:7b',
    complexModel: 'qwen2.5:7b',
    tasks: ['chat', 'rag', 'complex', 'creative', 'generate'],
    maxTokens: 2048,
    timeout: 120000,
  },
} as const

export type ServerType = keyof typeof AI_SERVERS
export type TaskType = 'classify' | 'sentiment' | 'language' | 'tagging' | 'simple' | 'analyze' | 'chat' | 'rag' | 'complex' | 'creative' | 'generate'

// Health status tracking
interface ServerHealth {
  isHealthy: boolean
  lastCheck: number
  latency: number
  errorCount: number
  lastError?: string
}

const serverHealth: Record<ServerType, ServerHealth> = {
  fast: { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0 },
  quality: { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0 },
}

const HEALTH_CHECK_INTERVAL = 30000
const MAX_ERRORS_BEFORE_UNHEALTHY = 3

/**
 * Check server health
 */
export async function checkServerHealth(server: ServerType): Promise<boolean> {
  const config = AI_SERVERS[server]
  const now = Date.now()
  
  if (now - serverHealth[server].lastCheck < HEALTH_CHECK_INTERVAL) {
    return serverHealth[server].isHealthy
  }
  
  try {
    const start = Date.now()
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    const response = await fetch(`${config.url}/api/tags`, {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      serverHealth[server] = {
        isHealthy: true,
        lastCheck: now,
        latency: Date.now() - start,
        errorCount: 0,
      }
      return true
    }
  } catch (error) {
    serverHealth[server].errorCount++
    serverHealth[server].lastError = error instanceof Error ? error.message : 'Unknown error'
    if (serverHealth[server].errorCount >= MAX_ERRORS_BEFORE_UNHEALTHY) {
      serverHealth[server].isHealthy = false
    }
    serverHealth[server].lastCheck = now
  }
  
  return serverHealth[server].isHealthy
}

/**
 * Get all servers health status
 */
export async function getAllServersHealth(): Promise<Record<ServerType, ServerHealth & { config: typeof AI_SERVERS[ServerType] }>> {
  await Promise.all([
    checkServerHealth('fast'),
    checkServerHealth('quality'),
  ])
  
  return {
    fast: { ...serverHealth.fast, config: AI_SERVERS.fast },
    quality: { ...serverHealth.quality, config: AI_SERVERS.quality },
  }
}

/**
 * Route task to appropriate server
 */
export function getServerForTask(task: TaskType): ServerType {
  if ((AI_SERVERS.fast.tasks as readonly string[]).includes(task)) {
    return 'fast'
  }
  return 'quality'
}

/**
 * Get best available server for task (with fallback)
 */
export async function getBestServer(task: TaskType): Promise<{
  server: ServerType
  config: typeof AI_SERVERS[ServerType]
  isFallback: boolean
}> {
  const preferredServer = getServerForTask(task)
  const preferredHealthy = await checkServerHealth(preferredServer)
  
  if (preferredHealthy) {
    return {
      server: preferredServer,
      config: AI_SERVERS[preferredServer],
      isFallback: false,
    }
  }
  
  const fallbackServer: ServerType = preferredServer === 'fast' ? 'quality' : 'fast'
  const fallbackHealthy = await checkServerHealth(fallbackServer)
  
  if (fallbackHealthy) {
    console.warn(`[AI Router] ${preferredServer} unhealthy, falling back to ${fallbackServer}`)
    return {
      server: fallbackServer,
      config: AI_SERVERS[fallbackServer],
      isFallback: true,
    }
  }
  
  console.error(`[AI Router] All servers unhealthy, trying ${preferredServer}`)
  return {
    server: preferredServer,
    config: AI_SERVERS[preferredServer],
    isFallback: false,
  }
}

// Message type
export interface RouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/**
 * Generate completion using routed server
 */
export async function routedGenerate(
  task: TaskType,
  prompt: string,
  options: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<{ response: string; server: ServerType; model: string; latency: number }> {
  const { server, config } = await getBestServer(task)
  const model = options.model || config.defaultModel
  const start = Date.now()
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)
  
  try {
    const response = await fetch(`${config.url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        system: options.system,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? config.maxTokens,
        },
      }),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Server ${server} returned ${response.status}`)
    }
    
    const data = await response.json()
    const latency = Date.now() - start
    
    serverHealth[server].latency = latency
    serverHealth[server].errorCount = 0
    
    return {
      response: data.response,
      server,
      model,
      latency,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    serverHealth[server].errorCount++
    throw error
  }
}

/**
 * Chat completion using routed server
 */
export async function routedChat(
  task: TaskType,
  messages: RouterMessage[],
  options: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
  } = {}
): Promise<{ response: string; server: ServerType; model: string; latency: number }> {
  const { server, config } = await getBestServer(task)
  const model = options.model || config.defaultModel
  const start = Date.now()
  
  const allMessages = options.system
    ? [{ role: 'system' as const, content: options.system }, ...messages]
    : messages
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)
  
  try {
    const response = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: allMessages,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? config.maxTokens,
        },
      }),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`Server ${server} returned ${response.status}`)
    }
    
    const data = await response.json()
    const latency = Date.now() - start
    
    serverHealth[server].latency = latency
    serverHealth[server].errorCount = 0
    
    return {
      response: data.message?.content || '',
      server,
      model,
      latency,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    serverHealth[server].errorCount++
    throw error
  }
}

/**
 * Streaming chat using routed server
 */
export async function* routedChatStream(
  task: TaskType,
  messages: RouterMessage[],
  options: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
  } = {}
): AsyncGenerator<string, void, unknown> {
  const { server, config } = await getBestServer(task)
  const model = options.model || config.defaultModel
  
  const allMessages = options.system
    ? [{ role: 'system' as const, content: options.system }, ...messages]
    : messages
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)
  
  try {
    const response = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages: allMessages,
        stream: true,
        options: {
          temperature: options.temperature ?? 0.7,
          num_predict: options.maxTokens ?? config.maxTokens,
        },
      }),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok || !response.body) {
      throw new Error(`Server ${server} returned ${response.status}`)
    }
    
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.message?.content) {
            yield data.message.content
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
    
    serverHealth[server].errorCount = 0
  } catch (error) {
    clearTimeout(timeoutId)
    serverHealth[server].errorCount++
    throw error
  }
}

// ===== Legacy exports for backward compatibility =====

export interface ChatContext {
  clientId?: string
  companyName?: string
  companyDescription?: string
  knowledgeBase?: string
  useRAG?: boolean
  previousMessages?: RouterMessage[]
  language?: 'ru' | 'en'
}

export interface GenerateOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

/**
 * Legacy generateResponse - now routes to appropriate server
 */
export async function generateResponse(
  message: string,
  context: ChatContext = {},
  options: GenerateOptions = {}
): Promise<{ text: string; model: string; server: ServerType; latency: number; ragUsed?: boolean }> {
  const messages: RouterMessage[] = [
    ...(context.previousMessages || []),
    { role: 'user', content: message }
  ]
  
  // Determine task type
  const task: TaskType = context.useRAG ? 'rag' : 'chat'
  
  // Build system prompt
  const systemPrompt = buildSystemPrompt(context)
  
  const result = await routedChat(task, messages, {
    model: options.model,
    system: systemPrompt,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  })
  
  return {
    text: result.response,
    model: result.model,
    server: result.server,
    latency: result.latency,
    ragUsed: context.useRAG,
  }
}

/**
 * Build system prompt
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
5. Используй markdown для форматирования
6. Отвечай на языке пользователя${knowledgeSection}`
}

/**
 * Legacy streaming - now routes to appropriate server
 */
export async function* streamResponse(
  message: string,
  context: ChatContext = {},
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const messages: RouterMessage[] = [
    ...(context.previousMessages || []),
    { role: 'user', content: message }
  ]
  
  const task: TaskType = context.useRAG ? 'rag' : 'chat'
  const systemPrompt = buildSystemPrompt(context)
  
  yield* routedChatStream(task, messages, {
    model: options.model,
    system: systemPrompt,
    maxTokens: options.maxTokens,
    temperature: options.temperature,
  })
}

/**
 * Check health of all servers
 */
export async function checkHealth(): Promise<{
  healthy: boolean
  servers: Record<ServerType, { healthy: boolean; latency: number; models: string[] }>
}> {
  const health = await getAllServersHealth()
  
  return {
    healthy: health.fast.isHealthy || health.quality.isHealthy,
    servers: {
      fast: {
        healthy: health.fast.isHealthy,
        latency: health.fast.latency,
        models: AI_SERVERS.fast.models as unknown as string[],
      },
      quality: {
        healthy: health.quality.isHealthy,
        latency: health.quality.latency,
        models: AI_SERVERS.quality.models as unknown as string[],
      },
    },
  }
}

/**
 * Get AI configuration info
 */
export function getAIInfo() {
  const config = getConfig()
  return {
    servers: AI_SERVERS,
    defaultConfig: config,
    health: serverHealth,
  }
}
