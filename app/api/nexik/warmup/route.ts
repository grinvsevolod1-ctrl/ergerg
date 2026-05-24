import { NextRequest, NextResponse } from 'next/server'
import { AI_SERVERS, getAllServersHealth } from '@/lib/ai/router'

export async function GET() {
  try {
    const health = await getAllServersHealth()
    
    const serverStatus = await Promise.all(
      Object.entries(AI_SERVERS).map(async ([key, config]) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          const tagsRes = await fetch(`${config.url}/api/tags`, { signal: controller.signal })
          clearTimeout(timeoutId)
          const tagsData = tagsRes.ok ? await tagsRes.json() : { models: [] }
          return {
            server: key,
            name: config.name,
            url: config.url,
            healthy: true,
            latency: 0,
            availableModels: tagsData.models?.map((m: { name: string }) => m.name) || [],
            runningModels: tagsData.models?.map((m: { name: string }) => m.name) || [],
            expectedModels: config.models,
          }
        } catch {
          return {
            server: key,
            name: config.name,
            url: config.url,
            healthy: false,
            latency: 0,
            availableModels: [],
            runningModels: [],
            expectedModels: config.models,
          }
        }
      })
    )

    return NextResponse.json({
      servers: serverStatus,
      allHealthy: serverStatus.every(s => s.healthy),
      architecture: {
        fast: {
          purpose: 'Simple tasks: classification, sentiment, tagging',
          models: AI_SERVERS.fast.models,
          timeout: AI_SERVERS.fast.timeout
        }
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 503 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: true, results: [] })
}
