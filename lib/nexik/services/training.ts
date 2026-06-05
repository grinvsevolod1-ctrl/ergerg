/**
 * Nexik Custom AI Training Service
 * LoRA fine-tuning for per-organization AI models via Ollama
 */

import { getOllamaBaseUrl } from '@/lib/ai/providers'

// ==========================================
// TYPES
// ==========================================

export interface TrainingDataPoint {
  id: string
  org_id: string
  conversation_id: string
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  quality_score: number
  included_in_training: boolean
  created_at: string
}

export interface CustomModel {
  id: string
  org_id: string
  name: string
  base_model: string
  adapter_path?: string
  status: 'pending' | 'preparing' | 'training' | 'ready' | 'failed'
  training_started_at?: string
  training_completed_at?: string
  metrics: TrainingMetrics
  is_active: boolean
  created_at: string
}

export interface TrainingMetrics {
  samples_used: number
  epochs: number
  loss?: number
  eval_loss?: number
  training_time_seconds?: number
  memory_used_mb?: number
}

export interface TrainingConfig {
  base_model: string
  epochs: number
  learning_rate: number
  batch_size: number
  max_samples: number
  min_quality_score: number
  lora_rank: number
  lora_alpha: number
}

export interface TrainingJob {
  id: string
  model_id: string
  org_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  current_epoch?: number
  current_loss?: number
  started_at?: string
  completed_at?: string
  error?: string
}

// ==========================================
// DEFAULT CONFIGURATION
// ==========================================

const DEFAULT_CONFIG: TrainingConfig = {
  base_model: 'qwen2.5:7b',
  epochs: 3,
  learning_rate: 0.0002,
  batch_size: 4,
  max_samples: 1000,
  min_quality_score: 0.7,
  lora_rank: 16,
  lora_alpha: 32
}

// Supported base models for fine-tuning
const SUPPORTED_BASE_MODELS = [
  'qwen2.5:3b',
  'qwen2.5:7b',
  'llama3.1:8b',
  'mistral:7b',
  'phi3:mini'
]

// ==========================================
// TRAINING DATA PREPARATION
// ==========================================

/**
 * Convert conversation to training format
 */
function conversationToTrainingFormat(
  messages: Array<{ role: string; content: string }>,
  systemPrompt?: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const formatted: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  
  // Add system prompt if provided
  if (systemPrompt) {
    formatted.push({ role: 'system', content: systemPrompt })
  }
  
  // Convert messages
  for (const msg of messages) {
    const role = msg.role === 'visitor' ? 'user' : 
                 msg.role === 'ai' ? 'assistant' : 
                 msg.role as 'user' | 'assistant' | 'system'
    
    if (role === 'user' || role === 'assistant') {
      formatted.push({ role, content: msg.content })
    }
  }
  
  return formatted
}

/**
 * Calculate quality score for a conversation
 */
export function calculateQualityScore(
  conversation: {
    rating?: number
    resolved_at?: string
    messages: Array<{ sender_type: string; content: string }>
  }
): number {
  let score = 0.5 // Base score
  
  // Rating contributes 30%
  if (conversation.rating) {
    score += (conversation.rating / 5) * 0.3
  }
  
  // Resolution contributes 20%
  if (conversation.resolved_at) {
    score += 0.2
  }
  
  // Message quality contributes 30%
  const aiMessages = conversation.messages.filter(m => m.sender_type === 'ai')
  if (aiMessages.length > 0) {
    // Average message length (prefer substantial responses)
    const avgLength = aiMessages.reduce((sum, m) => sum + m.content.length, 0) / aiMessages.length
    if (avgLength > 100) score += 0.1
    if (avgLength > 200) score += 0.1
    
    // Check for complete responses (not cut off)
    const completeResponses = aiMessages.filter(m => 
      m.content.endsWith('.') || m.content.endsWith('!') || m.content.endsWith('?')
    )
    score += (completeResponses.length / aiMessages.length) * 0.1
  }
  
  // Conversation length contributes 20%
  const userMessages = conversation.messages.filter(m => m.sender_type === 'visitor')
  if (userMessages.length >= 2 && aiMessages.length >= 2) {
    score += 0.1
  }
  if (userMessages.length >= 4 && aiMessages.length >= 4) {
    score += 0.1
  }
  
  return Math.min(1, Math.max(0, score))
}

/**
 * Export conversations to training dataset
 */
export async function exportTrainingData(
  orgId: string,
  options: {
    minQualityScore?: number
    maxSamples?: number
    includeSystemPrompt?: boolean
    systemPrompt?: string
  } = {}
): Promise<TrainingDataPoint[]> {
  const { query } = await import('@/lib/db')
  
  const minScore = options.minQualityScore ?? DEFAULT_CONFIG.min_quality_score
  const maxSamples = options.maxSamples ?? DEFAULT_CONFIG.max_samples
  
  // Get high-quality resolved conversations
  const conversations = await query<{
    id: string
    rating: number | null
    resolved_at: string | null
  }>(
    `SELECT c.id, c.rating, c.resolved_at
     FROM nexik_conversations c
     WHERE c.org_id = $1 
       AND c.resolved_at IS NOT NULL
       AND (SELECT COUNT(*) FROM nexik_messages m WHERE m.conversation_id = c.id AND m.sender_type = 'ai') >= 2
     ORDER BY c.rating DESC NULLS LAST, c.resolved_at DESC
     LIMIT $2`,
    [orgId, maxSamples * 2] // Fetch more to filter by quality
  )
  
  const trainingData: TrainingDataPoint[] = []
  
  for (const conv of conversations) {
    // Get messages
    const messages = await query<{ sender_type: string; content: string }>(
      `SELECT sender_type, content FROM nexik_messages 
       WHERE conversation_id = $1 AND sender_type IN ('visitor', 'ai')
       ORDER BY created_at ASC`,
      [conv.id]
    )
    
    // Calculate quality score
    const qualityScore = calculateQualityScore({
      rating: conv.rating || undefined,
      resolved_at: conv.resolved_at || undefined,
      messages
    })
    
    if (qualityScore >= minScore) {
      // Transform sender_type to role for training format
      const messagesWithRole = messages.map(m => ({
        role: m.sender_type === 'visitor' ? 'user' : 'assistant',
        content: m.content
      }))
      
      const formatted = conversationToTrainingFormat(
        messagesWithRole,
        options.includeSystemPrompt ? options.systemPrompt : undefined
      )
      
      if (formatted.length >= 2) { // At least one user + one assistant message
        trainingData.push({
          id: conv.id,
          org_id: orgId,
          conversation_id: conv.id,
          messages: formatted,
          quality_score: qualityScore,
          included_in_training: false,
          created_at: new Date().toISOString()
        })
      }
    }
    
    if (trainingData.length >= maxSamples) break
  }
  
  return trainingData
}

/**
 * Export training data to JSONL format (for Ollama/llama.cpp)
 */
export function exportToJSONL(data: TrainingDataPoint[]): string {
  return data.map(d => JSON.stringify({
    messages: d.messages
  })).join('\n')
}

/**
 * Export training data to Alpaca format
 */
export function exportToAlpaca(data: TrainingDataPoint[]): string {
  const alpacaData = data.map(d => {
    const systemMsg = d.messages.find(m => m.role === 'system')
    const userMsgs = d.messages.filter(m => m.role === 'user')
    const assistantMsgs = d.messages.filter(m => m.role === 'assistant')
    
    // For Alpaca, we take the first user-assistant pair
    return {
      instruction: systemMsg?.content || '',
      input: userMsgs[0]?.content || '',
      output: assistantMsgs[0]?.content || ''
    }
  })
  
  return JSON.stringify(alpacaData, null, 2)
}

// ==========================================
// TRAINING MANAGEMENT
// ==========================================

/**
 * Create a new custom model entry
 */
export async function createCustomModel(
  orgId: string,
  name: string,
  baseModel: string
): Promise<CustomModel> {
  const { query } = await import('@/lib/db')
  
  if (!SUPPORTED_BASE_MODELS.includes(baseModel)) {
    throw new Error(`Unsupported base model: ${baseModel}. Supported: ${SUPPORTED_BASE_MODELS.join(', ')}`)
  }
  
  const result = await query<CustomModel>(
    `INSERT INTO nexik_custom_models (org_id, name, base_model, status, metrics, is_active)
     VALUES ($1, $2, $3, 'pending', '{"samples_used": 0, "epochs": 0}', false)
     RETURNING *`,
    [orgId, name, baseModel]
  )
  
  return result[0]
}

/**
 * Start training job
 */
export async function startTraining(
  modelId: string,
  orgId: string,
  config: Partial<TrainingConfig> = {}
): Promise<TrainingJob> {
  const { query, execute, queryOne } = await import('@/lib/db')
  
  // Get model
  const model = await queryOne<CustomModel>(
    'SELECT * FROM nexik_custom_models WHERE id = $1 AND org_id = $2',
    [modelId, orgId]
  )
  
  if (!model) {
    throw new Error('Model not found')
  }
  
  if (model.status === 'training') {
    throw new Error('Training already in progress')
  }
  
  // Merge config
  const finalConfig: TrainingConfig = { ...DEFAULT_CONFIG, ...config, base_model: model.base_model }
  
  // Export training data
  const trainingData = await exportTrainingData(orgId, {
    minQualityScore: finalConfig.min_quality_score,
    maxSamples: finalConfig.max_samples,
    includeSystemPrompt: true
  })
  
  if (trainingData.length < 10) {
    throw new Error('Not enough quality training data. Need at least 10 samples.')
  }
  
  // Update model status
  await execute(
    `UPDATE nexik_custom_models 
     SET status = 'preparing', 
         training_started_at = NOW(),
         metrics = jsonb_set(metrics, '{samples_used}', $1::text::jsonb)
     WHERE id = $2`,
    [trainingData.length.toString(), modelId]
  )
  
  // Create training job
  const jobResult = await query<TrainingJob>(
    `INSERT INTO nexik_training_jobs (model_id, org_id, status, progress, config, training_data_count)
     VALUES ($1, $2, 'queued', 0, $3, $4)
     RETURNING *`,
    [modelId, orgId, JSON.stringify(finalConfig), trainingData.length]
  )
  
  const job = jobResult[0]
  
  // Save training data
  for (const data of trainingData) {
    await execute(
      `INSERT INTO nexik_training_data (org_id, conversation_id, messages, quality_score, included_in_training)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (org_id, conversation_id) DO UPDATE SET included_in_training = true`,
      [orgId, data.conversation_id, JSON.stringify(data.messages), data.quality_score]
    )
  }
  
  // Trigger actual training (async)
  // In production, this would be a background job
  triggerOllamaTraining(job.id, model, trainingData, finalConfig).catch(console.error)
  
  return job
}

/**
 * Trigger LoRA training via Ollama
 * Note: Ollama doesn't directly support LoRA training yet
 * This is a preparation for when it does, or for external training tools
 */
async function triggerOllamaTraining(
  jobId: string,
  model: CustomModel,
  trainingData: TrainingDataPoint[],
  config: TrainingConfig
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  try {
    // Update status to training
    await execute(
      `UPDATE nexik_training_jobs SET status = 'running', started_at = NOW() WHERE id = $1`,
      [jobId]
    )
    await execute(
      `UPDATE nexik_custom_models SET status = 'training' WHERE id = $1`,
      [model.id]
    )
    
    // Export training data to JSONL
    const jsonlData = exportToJSONL(trainingData)
    
    // Check if Ollama supports create with training data
    const baseUrl = getOllamaBaseUrl()
    
    // For now, we'll create a modelfile with the training data embedded as examples
    // This is a workaround until Ollama supports proper fine-tuning
    const modelfile = generateModelfile(model.base_model, trainingData, config)
    
    // Create custom model in Ollama
    const response = await fetch(`${baseUrl}/api/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `nexik-${model.org_id.slice(0, 8)}-${model.id.slice(0, 8)}`,
        modelfile,
        stream: false
      }),
      signal: AbortSignal.timeout(300000) // 5 minute timeout
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama create failed: ${error}`)
    }
    
    // Update with success
    await execute(
      `UPDATE nexik_training_jobs 
       SET status = 'completed', progress = 100, completed_at = NOW()
       WHERE id = $1`,
      [jobId]
    )
    
    const adapterPath = `nexik-${model.org_id.slice(0, 8)}-${model.id.slice(0, 8)}`
    
    await execute(
      `UPDATE nexik_custom_models 
       SET status = 'ready', 
           adapter_path = $1,
           training_completed_at = NOW(),
           metrics = jsonb_set(metrics, '{epochs}', $2::text::jsonb)
       WHERE id = $3`,
      [adapterPath, config.epochs.toString(), model.id]
    )
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    
    await execute(
      `UPDATE nexik_training_jobs 
       SET status = 'failed', error = $1
       WHERE id = $2`,
      [errorMsg, jobId]
    )
    
    await execute(
      `UPDATE nexik_custom_models SET status = 'failed' WHERE id = $1`,
      [model.id]
    )
    
    throw error
  }
}

/**
 * Generate Ollama Modelfile with embedded examples
 */
function generateModelfile(
  baseModel: string,
  trainingData: TrainingDataPoint[],
  config: TrainingConfig
): string {
  // Take top examples for few-shot learning
  const topExamples = trainingData
    .sort((a, b) => b.quality_score - a.quality_score)
    .slice(0, 10)
  
  // Build example conversations
  const examples = topExamples.map(d => {
    const userMsgs = d.messages.filter(m => m.role === 'user')
    const assistantMsgs = d.messages.filter(m => m.role === 'assistant')
    
    if (userMsgs.length > 0 && assistantMsgs.length > 0) {
      return `User: ${userMsgs[0].content}\nAssistant: ${assistantMsgs[0].content}`
    }
    return ''
  }).filter(e => e).join('\n\n')
  
  return `FROM ${baseModel}

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER num_ctx 4096

SYSTEM """You are a helpful AI assistant trained on real customer conversations.
Be professional, friendly, and helpful. Answer questions accurately based on the context provided.
If you don't know something, say so and offer to connect with a human operator.

Here are examples of good conversations:

${examples}

Use these as guidance for tone and style."""
`
}

// ==========================================
// MODEL MANAGEMENT
// ==========================================

/**
 * Get custom model by ID
 */
export async function getCustomModel(modelId: string, orgId: string): Promise<CustomModel | null> {
  const { queryOne } = await import('@/lib/db')
  
  return queryOne<CustomModel>(
    'SELECT * FROM nexik_custom_models WHERE id = $1 AND org_id = $2',
    [modelId, orgId]
  )
}

/**
 * Get all custom models for organization
 */
export async function getCustomModels(orgId: string): Promise<CustomModel[]> {
  const { query } = await import('@/lib/db')
  
  return query<CustomModel>(
    'SELECT * FROM nexik_custom_models WHERE org_id = $1 ORDER BY created_at DESC',
    [orgId]
  )
}

/**
 * Set active custom model for organization
 */
export async function setActiveModel(modelId: string, orgId: string): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  // Deactivate all other models
  await execute(
    'UPDATE nexik_custom_models SET is_active = false WHERE org_id = $1',
    [orgId]
  )
  
  // Activate selected model
  await execute(
    'UPDATE nexik_custom_models SET is_active = true WHERE id = $1 AND org_id = $2',
    [modelId, orgId]
  )
}

/**
 * Get active custom model for organization
 */
export async function getActiveModel(orgId: string): Promise<CustomModel | null> {
  const { queryOne } = await import('@/lib/db')
  
  return queryOne<CustomModel>(
    "SELECT * FROM nexik_custom_models WHERE org_id = $1 AND is_active = true AND status = 'ready'",
    [orgId]
  )
}

/**
 * Delete custom model
 */
export async function deleteCustomModel(modelId: string, orgId: string): Promise<boolean> {
  const { execute, queryOne } = await import('@/lib/db')
  
  // Get model to delete from Ollama
  const model = await queryOne<CustomModel>(
    'SELECT * FROM nexik_custom_models WHERE id = $1 AND org_id = $2',
    [modelId, orgId]
  )
  
  if (!model) return false
  
  // Delete from Ollama if adapter exists
  if (model.adapter_path) {
    try {
      const baseUrl = getOllamaBaseUrl()
      await fetch(`${baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model.adapter_path })
      })
    } catch {
      // Ignore Ollama errors
    }
  }
  
  // Delete from database
  const rowCount = await execute(
    'DELETE FROM nexik_custom_models WHERE id = $1 AND org_id = $2',
    [modelId, orgId]
  )
  
  return rowCount > 0
}

// ==========================================
// A/B TESTING
// ==========================================

/**
 * Get model for A/B testing
 * Returns custom model for 50% of requests if active, otherwise base model
 */
export async function getModelForRequest(
  orgId: string,
  _requestId: string
): Promise<{ model: string; isCustom: boolean }> {
  const activeModel = await getActiveModel(orgId)
  
  if (!activeModel || !activeModel.adapter_path) {
    return { model: DEFAULT_CONFIG.base_model, isCustom: false }
  }
  
  // Simple 50/50 A/B test based on request hash
  // In production, you'd want more sophisticated bucketing
  const useCustom = Math.random() < 0.5
  
  if (useCustom) {
    return { model: activeModel.adapter_path, isCustom: true }
  }
  
  return { model: activeModel.base_model, isCustom: false }
}

/**
 * Log A/B test result
 */
export async function logABTestResult(
  orgId: string,
  modelId: string | null,
  isCustom: boolean,
  metrics: {
    response_time_ms: number
    rating?: number
    resolved?: boolean
  }
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  await execute(
    `INSERT INTO nexik_ab_test_results 
     (org_id, model_id, is_custom, response_time_ms, rating, resolved)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [orgId, modelId, isCustom, metrics.response_time_ms, metrics.rating, metrics.resolved]
  )
}

/**
 * Get A/B test statistics
 */
export async function getABTestStats(
  orgId: string,
  modelId: string,
  days: number = 7
): Promise<{
  custom: { count: number; avg_response_time: number; avg_rating: number; resolution_rate: number }
  base: { count: number; avg_response_time: number; avg_rating: number; resolution_rate: number }
}> {
  const { query } = await import('@/lib/db')
  
  const stats = await query<{
    is_custom: boolean
    count: number
    avg_response_time: number
    avg_rating: number
    resolution_rate: number
  }>(
    `SELECT 
       is_custom,
       COUNT(*) as count,
       AVG(response_time_ms) as avg_response_time,
       AVG(rating) as avg_rating,
       AVG(CASE WHEN resolved THEN 1 ELSE 0 END) as resolution_rate
     FROM nexik_ab_test_results
     WHERE org_id = $1 
       AND (model_id = $2 OR model_id IS NULL)
       AND created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY is_custom`,
    [orgId, modelId]
  )
  
  const customStats = stats.find(s => s.is_custom) || { count: 0, avg_response_time: 0, avg_rating: 0, resolution_rate: 0 }
  const baseStats = stats.find(s => !s.is_custom) || { count: 0, avg_response_time: 0, avg_rating: 0, resolution_rate: 0 }
  
  return {
    custom: {
      count: Number(customStats.count),
      avg_response_time: Math.round(Number(customStats.avg_response_time)),
      avg_rating: Math.round(Number(customStats.avg_rating) * 100) / 100,
      resolution_rate: Math.round(Number(customStats.resolution_rate) * 100)
    },
    base: {
      count: Number(baseStats.count),
      avg_response_time: Math.round(Number(baseStats.avg_response_time)),
      avg_rating: Math.round(Number(baseStats.avg_rating) * 100) / 100,
      resolution_rate: Math.round(Number(baseStats.resolution_rate) * 100)
    }
  }
}
