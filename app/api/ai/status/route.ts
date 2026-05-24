/**
 * Nexik AI Status API
 * Проверка статуса AI серверов
 */

import { NextResponse } from 'next/server'
import { checkHealth, getAIInfo, getAllServersHealth, AI_SERVERS } from '@/lib/ai/router'
import { OLLAMA_MODELS } from '@/lib/ai/config'

export async function GET() {
  const info = await getAIInfo()
  const healthy = await checkHealth()
  const serversHealth = await getAllServersHealth()

  return NextResponse.json({
    status: healthy ? 'ok' : 'error',
    engine: 'ollama',
    config: {
      endpoint: info.endpoint,
      model: info.model,
      server: info.server,
      available: info.available,
    },
    servers: serversHealth,
    serverConfigs: Object.entries(AI_SERVERS).map(([key, config]) => ({
      key,
      name: config.name,
      url: config.url,
      model: config.defaultModel,
      timeout: config.timeout,
      weight: config.weight,
    })),
    supportedModels: Object.entries(OLLAMA_MODELS).map(([id, modelInfo]) => ({
      id,
      ...modelInfo,
    })),
    timestamp: new Date().toISOString(),
  })
}
