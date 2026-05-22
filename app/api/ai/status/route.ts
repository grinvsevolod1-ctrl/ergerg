/**
 * Nexik AI Status API
 * Проверка статуса Ollama сервера
 */

import { NextResponse } from 'next/server'
import { checkHealth, getAIInfo } from '@/lib/ai/router'
import { OLLAMA_MODELS } from '@/lib/ai/config'

export async function GET() {
  const info = getAIInfo()
  const health = await checkHealth()

  return NextResponse.json({
    status: health.healthy ? 'ok' : 'error',
    engine: 'ollama',
    config: {
      baseUrl: info.baseUrl,
      model: info.model,
      fallbackModel: info.fallbackModel,
      maxTokens: info.maxTokens,
      temperature: info.temperature,
    },
    health: {
      serverOnline: health.healthy,
      modelAvailable: health.modelAvailable,
      availableModels: health.availableModels,
    },
    supportedModels: Object.entries(OLLAMA_MODELS).map(([id, info]) => ({
      id,
      ...info,
    })),
    timestamp: new Date().toISOString(),
  })
}
