/**
 * Model Warmup API - Dual Server Support
 * Keeps models loaded on both FAST and QUALITY servers
 */

import { NextRequest, NextResponse } from 'next/server'
import { AI_SERVERS, getAllServersHealth, type ServerType } from '@/lib/ai/router'

interface WarmupResult {
  server: string
  model: string
  status: 'success' | 'error' | 'not_found'
  loadTimeMs?: number
  error?: string
}

async function warmupModel(serverUrl: string, serverName: string, model: string): Promise<WarmupResult> {
  const startTime = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    
    const response = await fetch(`${serverUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt: 'Hi',
        stream: false,
        options: { num_predict: 1 }
      })
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const text = await response.text()
      if (text.includes('not found') || text.includes('does not exist')) {
        return { server: serverName, model, status: 'not_found', error: 'Model not installed' }
      }
      return { server: serverName, model, status: 'error', error: text }
    }
    
    return {
      server: serverName,
      model,
      status: 'success',
      loadTimeMs: Date.now() - startTime
    }
  } catch (error) {
    return {
      server: serverName,
      model,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { server: targetServer } = await request.json().catch(() => ({}))
    
    const results: WarmupResult[] = []
    
    // Determine which servers to warm
    const serversToWarm: ServerType[] = targetServer 
      ? [targetServer as ServerType]
      : ['fast', 'quality']
    
    for (const serverKey of serversToWarm) {
      const serverConfig = AI_SERVERS[serverKey]
      
      for (const model of serverConfig.models) {
        const result = await warmupModel(serverConfig.url, serverConfig.name, model)
        results.push(result)
        
        if (result.status === 'success') {
          await new Promise(r => setTimeout(r, 100))
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        warmed: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        notFound: results.filter(r => r.status === 'not_found').length
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Warmup failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const health = await getAllServersHealth()
    
    // Get running models from each server
    const serverStatus = await Promise.all(
      Object.entries(AI_SERVERS).map(async ([key, config]) => {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)
          
          const [tagsRes, psRes] = await Promise.all([
            fetch(`${config.url}/api/tags`, { signal: controller.signal }),
            fetch(`${config.url}/api/ps`, { signal: controller.signal }).catch(() => null)
          ])
          
          clearTimeout(timeoutId)
          
          const tagsData = tagsRes.ok ? await tagsRes.json() : { models: [] }
          const psData = psRes?.ok ? await psRes.json() : { models: [] }
          
          return {
            server: key,
            name: config.name,
            url: config.url,
            healthy: health[key as ServerType].isHealthy,
            latency: health[key as ServerType].latency,
            availableModels: tagsData.models?.map((m: { name: string }) => m.name) || [],
            runningModels: psData.models?.map((m: { name: string }) => m.name) || [],
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
            error: 'Server unreachable'
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
        },
        quality: {
          purpose: 'Complex tasks: chat, RAG, creative generation',
          models: AI_SERVERS.quality.models,
          timeout: AI_SERVERS.quality.timeout
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
