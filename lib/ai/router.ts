import { getConfig } from './config'

export const AI_SERVERS = {
  fast: {
    name: 'FAST',
    url: process.env.OLLAMA_FAST_URL || 'http://2.26.75.147:11434',
    models: ['qwen2.5:3b'],
    defaultModel: 'qwen2.5:3b',
    maxTokens: 1024,
    timeout: 20000,
    weight: 1,
  },
} as const

export type ServerType = keyof typeof AI_SERVERS
export type TaskType = string

interface ServerHealth {
  isHealthy: boolean
  lastCheck: number
  latency: number
  errorCount: number
  activeRequests: number
  lastError?: string
}

const serverHealth: Record<ServerType, ServerHealth> = {
  fast: { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0, activeRequests: 0 },
}

let roundRobinIndex = 0
const HEALTH_CHECK_INTERVAL = 30000
const MAX_ERRORS_BEFORE_UNHEALTHY = 3

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
        ...serverHealth[server],
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

export async function getAllServersHealth() {
  const results = []
  for (const server of Object.keys(AI_SERVERS) as ServerType[]) {
    const healthy = await checkServerHealth(server)
    results.push({
      server,
      name: AI_SERVERS[server].name,
      url: AI_SERVERS[server].url,
      healthy,
      latency: serverHealth[server].latency,
      availableModels: AI_SERVERS[server].models,
      runningModels: AI_SERVERS[server].models,
      expectedModels: AI_SERVERS[server].models,
    })
  }
  return results
}

export async function getAIInfo() {
  const config = AI_SERVERS.fast
  const available = await checkServerHealth('fast')
  return {
    model: config.defaultModel,
    provider: 'ollama',
    endpoint: config.url,
    available,
  }
}

export async function checkHealth(): Promise<boolean> {
  return checkServerHealth('fast')
}

export async function routedChat(
  taskType: TaskType,
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
  }
) {
  const server = 'fast'
  const config = AI_SERVERS[server]
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)

  try {
    const start = Date.now()
    
    const chatMessages = []
    if (options?.system) {
      chatMessages.push({ role: 'system', content: options.system })
    }
    chatMessages.push(...messages)

    const response = await fetch(`${config.url}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options?.model || config.defaultModel,
        messages: chatMessages,
        stream: false,
        options: {
          temperature: options?.temperature ?? 0.7,
          num_predict: options?.maxTokens || config.maxTokens,
        },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    const latency = Date.now() - start

    return {
      response: data.message?.content || '',
      serverUsed: server,
      latency,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`[AI Router] Error:`, error)
    throw error
  }
}
