/**
 * Model Warmup API
 * Keeps models loaded in Ollama memory for faster responses
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOllamaBaseUrl } from '@/lib/ai/providers'

// Models to keep warm (in priority order)
const WARMUP_MODELS = [
  'qwen2.5:1.5b',  // Fast model for simple tasks
  'qwen2.5:7b',    // Main model for complex tasks
]

interface WarmupResult {
  model: string
  status: 'success' | 'error' | 'not_found'
  loadTimeMs?: number
  error?: string
}

async function warmupModel(model: string): Promise<WarmupResult> {
  const baseUrl = getOllamaBaseUrl()
  const startTime = Date.now()
  
  try {
    // Send a minimal request to load the model
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: 'Hi',
        stream: false,
        options: {
          num_predict: 1  // Generate just 1 token - enough to load the model
        }
      })
    })
    
    if (!response.ok) {
      const text = await response.text()
      if (text.includes('not found') || text.includes('does not exist')) {
        return { model, status: 'not_found', error: 'Model not installed' }
      }
      return { model, status: 'error', error: text }
    }
    
    return {
      model,
      status: 'success',
      loadTimeMs: Date.now() - startTime
    }
  } catch (error) {
    return {
      model,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { models } = await request.json().catch(() => ({}))
    const modelsToWarm = models || WARMUP_MODELS
    
    const results: WarmupResult[] = []
    
    for (const model of modelsToWarm) {
      const result = await warmupModel(model)
      results.push(result)
      
      // Small delay between models to not overload
      if (result.status === 'success') {
        await new Promise(r => setTimeout(r, 100))
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
  // Check which models are currently loaded
  const baseUrl = getOllamaBaseUrl()
  
  try {
    const response = await fetch(`${baseUrl}/api/ps`)
    if (!response.ok) {
      return NextResponse.json({ error: 'Cannot check running models' }, { status: 500 })
    }
    
    const data = await response.json()
    
    return NextResponse.json({
      runningModels: data.models || [],
      recommendedWarmup: WARMUP_MODELS
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Ollama not reachable', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 503 }
    )
  }
}
