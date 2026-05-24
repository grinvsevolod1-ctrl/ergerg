/**
 * AI Router - Multi-server load balancing with health checks
 * 
 * Servers are configured via AI_SERVERS environment variable:
 * Format: name|url|model|timeout_ms|weight (comma-separated for multiple)
 * Example: fast|http://localhost:11434|qwen2.5:3b|20000|1,quality|http://server2:11434|qwen2.5:7b|60000|2
 */

// Server configuration type
interface AIServerConfig {
  name: string
  url: string
  models: string[]
  defaultModel: string
  maxTokens: number
  timeout: number
  weight: number
}

// Parse servers from environment variable
function parseServersFromEnv(): Record<string, AIServerConfig> {
  const envServers = process.env.AI_SERVERS
  
  // Default server if no env var set
  if (!envServers) {
    return {
      fast: {
        name: 'FAST',
        url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        models: [process.env.OLLAMA_MODEL || 'qwen2.5:3b'],
        defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
        maxTokens: 1024,
        timeout: 20000,
        weight: 1,
      },
    }
  }
  
  const servers: Record<string, AIServerConfig> = {}
  const serverEntries = envServers.split(',')
  
  for (const entry of serverEntries) {
    const [name, url, model, timeoutStr, weightStr] = entry.split('|')
    if (!name || !url || !model) continue
    
    const key = name.toLowerCase().replace(/\s+/g, '_')
    servers[key] = {
      name: name.toUpperCase(),
      url: url.trim(),
      models: [model.trim()],
      defaultModel: model.trim(),
      maxTokens: 1024,
      timeout: parseInt(timeoutStr) || 20000,
      weight: parseInt(weightStr) || 1,
    }
  }
  
  // Fallback if parsing failed
  if (Object.keys(servers).length === 0) {
    return {
      fast: {
        name: 'FAST',
        url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        models: ['qwen2.5:3b'],
        defaultModel: 'qwen2.5:3b',
        maxTokens: 1024,
        timeout: 20000,
        weight: 1,
      },
    }
  }
  
  return servers
}

// Export servers (re-parsed on each access for hot reload)
export const AI_SERVERS = parseServersFromEnv()

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

// Initialize health tracking for all servers
function initServerHealth(): Record<string, ServerHealth> {
  const health: Record<string, ServerHealth> = {}
  for (const key of Object.keys(AI_SERVERS)) {
    health[key] = { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0, activeRequests: 0 }
  }
  return health
}

const serverHealth = initServerHealth()

let roundRobinIndex = 0
const HEALTH_CHECK_INTERVAL = 30000
const MAX_ERRORS_BEFORE_UNHEALTHY = 3

export async function checkServerHealth(server: string): Promise<boolean> {
  const config = AI_SERVERS[server]
  if (!config) return false
  
  const now = Date.now()

  // Use cached result if recent
  if (serverHealth[server] && now - serverHealth[server].lastCheck < HEALTH_CHECK_INTERVAL) {
    return serverHealth[server].isHealthy
  }

  // Ensure health entry exists
  if (!serverHealth[server]) {
    serverHealth[server] = { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0, activeRequests: 0 }
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

/**
 * Select best server based on health and weights
 * Uses weighted round-robin for load balancing
 */
export function selectServer(): string {
  const servers = Object.keys(AI_SERVERS)
  
  // Filter to healthy servers only
  const healthyServers = servers.filter(s => 
    !serverHealth[s] || serverHealth[s].isHealthy
  )
  
  // If no healthy servers, try any server
  if (healthyServers.length === 0) {
    return servers[0] || 'fast'
  }
  
  // Single server - no balancing needed
  if (healthyServers.length === 1) {
    return healthyServers[0]
  }
  
  // Weighted round-robin
  const totalWeight = healthyServers.reduce((sum, s) => sum + (AI_SERVERS[s]?.weight || 1), 0)
  let target = roundRobinIndex % totalWeight
  roundRobinIndex++
  
  for (const server of healthyServers) {
    const weight = AI_SERVERS[server]?.weight || 1
    if (target < weight) {
      return server
    }
    target -= weight
  }
  
  return healthyServers[0]
}

export async function getAllServersHealth() {
  const results = []
  for (const server of Object.keys(AI_SERVERS)) {
    const healthy = await checkServerHealth(server)
    const config = AI_SERVERS[server]
    results.push({
      server,
      name: config.name,
      url: config.url,
      healthy,
      latency: serverHealth[server]?.latency || 0,
      availableModels: config.models,
      runningModels: config.models,
      expectedModels: config.models,
      weight: config.weight,
      activeRequests: serverHealth[server]?.activeRequests || 0,
      lastError: serverHealth[server]?.lastError,
    })
  }
  return results
}

export async function getAIInfo() {
  const server = selectServer()
  const config = AI_SERVERS[server]
  const available = await checkServerHealth(server)
  return {
    model: config?.defaultModel || 'qwen2.5:3b',
    provider: 'ollama',
    endpoint: config?.url || 'http://localhost:11434',
    server,
    available,
  }
}

export async function checkHealth(): Promise<boolean> {
  // Check if at least one server is healthy
  for (const server of Object.keys(AI_SERVERS)) {
    if (await checkServerHealth(server)) {
      return true
    }
  }
  return false
}

export async function routedChat(
  taskType: TaskType,
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string
    system?: string
    temperature?: number
    maxTokens?: number
    preferServer?: string
  }
) {
  // Select server (prefer specified if healthy)
  let server = options?.preferServer && AI_SERVERS[options.preferServer] 
    ? options.preferServer 
    : selectServer()
  
  const config = AI_SERVERS[server]
  if (!config) {
    throw new Error(`AI server "${server}" not found`)
  }
  
  // Track active requests
  if (serverHealth[server]) {
    serverHealth[server].activeRequests++
  }
  
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

    // Update health stats on success
    if (serverHealth[server]) {
      serverHealth[server].latency = latency
      serverHealth[server].errorCount = 0
      serverHealth[server].isHealthy = true
    }

    return {
      response: data.message?.content || '',
      serverUsed: server,
      latency,
      model: options?.model || config.defaultModel,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    // Update health stats on error
    if (serverHealth[server]) {
      serverHealth[server].errorCount++
      serverHealth[server].lastError = error instanceof Error ? error.message : 'Unknown error'
      if (serverHealth[server].errorCount >= MAX_ERRORS_BEFORE_UNHEALTHY) {
        serverHealth[server].isHealthy = false
      }
    }
    
    console.error(`[AI Router] Error on server ${server}:`, error)
    throw error
  } finally {
    // Decrement active requests
    if (serverHealth[server] && serverHealth[server].activeRequests > 0) {
      serverHealth[server].activeRequests--
    }
  }
}

/**
 * Add a new server at runtime (for dynamic scaling)
 */
export function addServer(key: string, config: AIServerConfig): void {
  (AI_SERVERS as Record<string, AIServerConfig>)[key] = config
  serverHealth[key] = { isHealthy: true, lastCheck: 0, latency: 0, errorCount: 0, activeRequests: 0 }
}

/**
 * Remove a server at runtime
 */
export function removeServer(key: string): void {
  delete (AI_SERVERS as Record<string, AIServerConfig>)[key]
  delete serverHealth[key]
}
