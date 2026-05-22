/**
 * Nexik Feedback & Learning System
 * Collects feedback, builds training data, triggers model improvement
 */

import { query, queryOne, execute } from '@/lib/db'

// ============================================================
// TYPES
// ============================================================

export interface MessageFeedback {
  id: string
  org_id: string
  conversation_id: string
  message_id: string
  
  // Ratings
  rating: 1 | 2 | 3 | 4 | 5 | null // User star rating
  helpful: boolean | null // Was this helpful?
  accurate: boolean | null // Was information accurate?
  
  // Operator feedback
  operator_corrected: boolean
  operator_id: string | null
  correction_text: string | null
  correction_reason: 'wrong_info' | 'wrong_tone' | 'incomplete' | 'off_topic' | 'other' | null
  
  // Context
  original_response: string
  user_message: string
  
  // Learning signals
  selected_for_training: boolean
  training_weight: number // 0-1, importance for training
  
  created_at: Date
}

export interface TrainingExample {
  id: string
  org_id: string
  
  // Input-output pair
  system_prompt: string
  user_input: string
  assistant_output: string
  
  // Quality metrics
  quality_score: number // 0-1
  source: 'operator_correction' | 'high_rated' | 'manual' | 'generated'
  
  // Categories
  intent_category: string | null
  topic_tags: string[]
  
  // Status
  status: 'pending' | 'approved' | 'rejected' | 'used'
  reviewed_by: string | null
  reviewed_at: Date | null
  
  // Usage tracking
  times_used_in_training: number
  last_used_at: Date | null
  
  created_at: Date
}

export interface LearningStats {
  org_id: string
  
  // Feedback counts
  total_feedback: number
  positive_feedback: number
  negative_feedback: number
  neutral_feedback: number
  
  // Correction stats
  total_corrections: number
  corrections_by_reason: Record<string, number>
  
  // Training data
  approved_examples: number
  pending_examples: number
  
  // Model performance over time
  avg_rating_last_7_days: number
  avg_rating_last_30_days: number
  improvement_trend: 'improving' | 'stable' | 'declining'
}

// ============================================================
// FEEDBACK COLLECTION
// ============================================================

/**
 * Record user feedback on a message
 */
export async function recordMessageFeedback(
  orgId: string,
  conversationId: string,
  messageId: string,
  feedback: {
    rating?: 1 | 2 | 3 | 4 | 5
    helpful?: boolean
    accurate?: boolean
    originalResponse: string
    userMessage: string
  }
): Promise<MessageFeedback> {
  // Check if feedback already exists
  const existing = await queryOne<MessageFeedback>(
    `SELECT * FROM nexik_message_feedback WHERE message_id = $1`,
    [messageId]
  )
  
  if (existing) {
    // Update existing feedback
    const result = await queryOne<MessageFeedback>(
      `UPDATE nexik_message_feedback 
       SET rating = COALESCE($1, rating),
           helpful = COALESCE($2, helpful),
           accurate = COALESCE($3, accurate)
       WHERE message_id = $4
       RETURNING *`,
      [feedback.rating || null, feedback.helpful ?? null, feedback.accurate ?? null, messageId]
    )
    
    // Check if should be selected for training
    await evaluateForTraining(result!)
    
    return result!
  }
  
  // Create new feedback
  const result = await queryOne<MessageFeedback>(
    `INSERT INTO nexik_message_feedback (
      org_id, conversation_id, message_id,
      rating, helpful, accurate,
      original_response, user_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      orgId, conversationId, messageId,
      feedback.rating || null,
      feedback.helpful ?? null,
      feedback.accurate ?? null,
      feedback.originalResponse,
      feedback.userMessage
    ]
  )
  
  // Check if should be selected for training
  await evaluateForTraining(result!)
  
  return result!
}

/**
 * Record operator correction
 */
export async function recordOperatorCorrection(
  orgId: string,
  conversationId: string,
  messageId: string,
  correction: {
    operatorId: string
    correctionText: string
    reason: 'wrong_info' | 'wrong_tone' | 'incomplete' | 'off_topic' | 'other'
    originalResponse: string
    userMessage: string
  }
): Promise<MessageFeedback> {
  // Upsert feedback with correction
  const result = await queryOne<MessageFeedback>(
    `INSERT INTO nexik_message_feedback (
      org_id, conversation_id, message_id,
      operator_corrected, operator_id, correction_text, correction_reason,
      original_response, user_message,
      selected_for_training, training_weight
    ) VALUES ($1, $2, $3, true, $4, $5, $6, $7, $8, true, 0.9)
    ON CONFLICT (message_id) 
    DO UPDATE SET
      operator_corrected = true,
      operator_id = $4,
      correction_text = $5,
      correction_reason = $6,
      selected_for_training = true,
      training_weight = 0.9
    RETURNING *`,
    [
      orgId, conversationId, messageId,
      correction.operatorId,
      correction.correctionText,
      correction.reason,
      correction.originalResponse,
      correction.userMessage
    ]
  )
  
  // Create training example from correction
  await createTrainingExampleFromCorrection(result!)
  
  return result!
}

/**
 * Quick feedback buttons (thumbs up/down)
 */
export async function recordQuickFeedback(
  messageId: string,
  helpful: boolean,
  originalResponse: string,
  userMessage: string
): Promise<void> {
  await execute(
    `INSERT INTO nexik_message_feedback (
      message_id, helpful, original_response, user_message,
      training_weight
    ) VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (message_id) 
    DO UPDATE SET helpful = $2, training_weight = $5`,
    [messageId, helpful, originalResponse, userMessage, helpful ? 0.7 : 0.3]
  )
}

// ============================================================
// TRAINING DATA MANAGEMENT
// ============================================================

/**
 * Evaluate if feedback should become training data
 */
async function evaluateForTraining(feedback: MessageFeedback): Promise<void> {
  let shouldTrain = false
  let weight = 0.5
  
  // High rating = good training example
  if (feedback.rating && feedback.rating >= 4) {
    shouldTrain = true
    weight = 0.8
  }
  
  // Operator corrected = very valuable
  if (feedback.operator_corrected) {
    shouldTrain = true
    weight = 0.9
  }
  
  // Marked as helpful
  if (feedback.helpful === true) {
    shouldTrain = true
    weight = Math.max(weight, 0.7)
  }
  
  // Low rating or not helpful = negative example
  if (feedback.rating && feedback.rating <= 2) {
    shouldTrain = true
    weight = 0.3 // Lower weight, but still useful to learn what NOT to do
  }
  
  if (shouldTrain) {
    await execute(
      `UPDATE nexik_message_feedback 
       SET selected_for_training = true, training_weight = $1
       WHERE id = $2`,
      [weight, feedback.id]
    )
    
    // Create training example if positive
    if (weight >= 0.7) {
      await createTrainingExample({
        org_id: feedback.org_id,
        user_input: feedback.user_message,
        assistant_output: feedback.operator_corrected && feedback.correction_text 
          ? feedback.correction_text 
          : feedback.original_response,
        quality_score: weight,
        source: feedback.operator_corrected ? 'operator_correction' : 'high_rated'
      })
    }
  }
}

/**
 * Create training example from operator correction
 */
async function createTrainingExampleFromCorrection(
  feedback: MessageFeedback
): Promise<void> {
  if (!feedback.correction_text) return
  
  await createTrainingExample({
    org_id: feedback.org_id,
    user_input: feedback.user_message,
    assistant_output: feedback.correction_text,
    quality_score: 0.9,
    source: 'operator_correction'
  })
}

/**
 * Create a training example
 */
export async function createTrainingExample(data: {
  org_id: string
  system_prompt?: string
  user_input: string
  assistant_output: string
  quality_score: number
  source: TrainingExample['source']
  intent_category?: string
  topic_tags?: string[]
}): Promise<TrainingExample> {
  // Check for duplicates (similar input)
  const similar = await query<{ id: string }>(
    `SELECT id FROM nexik_training_examples 
     WHERE org_id = $1 
     AND similarity(user_input, $2) > 0.8
     LIMIT 1`,
    [data.org_id, data.user_input]
  )
  
  // If very similar example exists, skip
  if (similar.length > 0) {
    const existing = await queryOne<TrainingExample>(
      `SELECT * FROM nexik_training_examples WHERE id = $1`,
      [similar[0].id]
    )
    return existing!
  }
  
  const result = await queryOne<TrainingExample>(
    `INSERT INTO nexik_training_examples (
      org_id, system_prompt, user_input, assistant_output,
      quality_score, source, intent_category, topic_tags,
      status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
    RETURNING *`,
    [
      data.org_id,
      data.system_prompt || '',
      data.user_input,
      data.assistant_output,
      data.quality_score,
      data.source,
      data.intent_category || null,
      data.topic_tags || []
    ]
  )
  
  return result!
}

/**
 * Get pending training examples for review
 */
export async function getPendingTrainingExamples(
  orgId: string,
  limit: number = 50
): Promise<TrainingExample[]> {
  return query<TrainingExample>(
    `SELECT * FROM nexik_training_examples 
     WHERE org_id = $1 AND status = 'pending'
     ORDER BY quality_score DESC, created_at DESC
     LIMIT $2`,
    [orgId, limit]
  )
}

/**
 * Approve training example
 */
export async function approveTrainingExample(
  exampleId: string,
  reviewerId: string
): Promise<void> {
  await execute(
    `UPDATE nexik_training_examples 
     SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2`,
    [reviewerId, exampleId]
  )
}

/**
 * Reject training example
 */
export async function rejectTrainingExample(
  exampleId: string,
  reviewerId: string
): Promise<void> {
  await execute(
    `UPDATE nexik_training_examples 
     SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW()
     WHERE id = $2`,
    [reviewerId, exampleId]
  )
}

/**
 * Get approved examples for training
 */
export async function getApprovedTrainingExamples(
  orgId: string,
  limit: number = 1000
): Promise<TrainingExample[]> {
  return query<TrainingExample>(
    `SELECT * FROM nexik_training_examples 
     WHERE org_id = $1 AND status = 'approved'
     ORDER BY quality_score DESC, created_at DESC
     LIMIT $2`,
    [orgId, limit]
  )
}

/**
 * Export training data in JSONL format (for LoRA training)
 */
export async function exportTrainingDataJSONL(
  orgId: string,
  systemPrompt: string
): Promise<string> {
  const examples = await getApprovedTrainingExamples(orgId)
  
  const lines = examples.map(ex => JSON.stringify({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: ex.user_input },
      { role: 'assistant', content: ex.assistant_output }
    ]
  }))
  
  return lines.join('\n')
}

// ============================================================
// LEARNING STATISTICS
// ============================================================

/**
 * Get learning stats for organization
 */
export async function getLearningStats(orgId: string): Promise<LearningStats> {
  // Get feedback counts
  const feedbackStats = await queryOne<{
    total: number
    positive: number
    negative: number
    neutral: number
  }>(
    `SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE rating >= 4 OR helpful = true) as positive,
      COUNT(*) FILTER (WHERE rating <= 2 OR helpful = false) as negative,
      COUNT(*) FILTER (WHERE rating = 3 OR (rating IS NULL AND helpful IS NULL)) as neutral
     FROM nexik_message_feedback
     WHERE org_id = $1`,
    [orgId]
  )
  
  // Get correction counts by reason
  const correctionStats = await query<{ reason: string; count: number }>(
    `SELECT correction_reason as reason, COUNT(*) as count
     FROM nexik_message_feedback
     WHERE org_id = $1 AND operator_corrected = true
     GROUP BY correction_reason`,
    [orgId]
  )
  
  // Get training example counts
  const trainingStats = await queryOne<{ approved: number; pending: number }>(
    `SELECT 
      COUNT(*) FILTER (WHERE status = 'approved') as approved,
      COUNT(*) FILTER (WHERE status = 'pending') as pending
     FROM nexik_training_examples
     WHERE org_id = $1`,
    [orgId]
  )
  
  // Get average ratings
  const ratingStats = await queryOne<{ avg_7d: number; avg_30d: number }>(
    `SELECT 
      AVG(rating) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as avg_7d,
      AVG(rating) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as avg_30d
     FROM nexik_message_feedback
     WHERE org_id = $1 AND rating IS NOT NULL`,
    [orgId]
  )
  
  // Calculate trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (ratingStats?.avg_7d && ratingStats?.avg_30d) {
    const diff = ratingStats.avg_7d - ratingStats.avg_30d
    if (diff > 0.2) trend = 'improving'
    else if (diff < -0.2) trend = 'declining'
  }
  
  return {
    org_id: orgId,
    total_feedback: feedbackStats?.total || 0,
    positive_feedback: feedbackStats?.positive || 0,
    negative_feedback: feedbackStats?.negative || 0,
    neutral_feedback: feedbackStats?.neutral || 0,
    total_corrections: correctionStats.reduce((sum, s) => sum + Number(s.count), 0),
    corrections_by_reason: Object.fromEntries(
      correctionStats.map(s => [s.reason || 'unknown', Number(s.count)])
    ),
    approved_examples: trainingStats?.approved || 0,
    pending_examples: trainingStats?.pending || 0,
    avg_rating_last_7_days: ratingStats?.avg_7d || 0,
    avg_rating_last_30_days: ratingStats?.avg_30d || 0,
    improvement_trend: trend
  }
}

// ============================================================
// AUTO-LEARNING TRIGGERS
// ============================================================

/**
 * Check if organization has enough data for training
 */
export async function checkTrainingReadiness(orgId: string): Promise<{
  ready: boolean
  approvedExamples: number
  minimumRequired: number
  recommendation: string
}> {
  const stats = await getLearningStats(orgId)
  const minimumRequired = 50 // Minimum examples for effective LoRA
  
  const ready = stats.approved_examples >= minimumRequired
  
  let recommendation = ''
  if (ready) {
    recommendation = 'Ready to train! You have enough approved examples.'
  } else if (stats.pending_examples > 0) {
    recommendation = `Review ${stats.pending_examples} pending examples to reach the minimum.`
  } else {
    recommendation = 'Collect more feedback from conversations to build training data.'
  }
  
  return {
    ready,
    approvedExamples: stats.approved_examples,
    minimumRequired,
    recommendation
  }
}

/**
 * Schedule nightly training if ready
 */
export async function scheduleTrainingIfReady(orgId: string): Promise<boolean> {
  const readiness = await checkTrainingReadiness(orgId)
  
  if (!readiness.ready) {
    return false
  }
  
  // Check if training was done recently (within 24 hours)
  const recentTraining = await queryOne<{ id: string }>(
    `SELECT id FROM nexik_training_jobs 
     WHERE org_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
     LIMIT 1`,
    [orgId]
  )
  
  if (recentTraining) {
    return false // Already trained recently
  }
  
  // Create training job (will be picked up by background worker)
  await execute(
    `INSERT INTO nexik_training_jobs (org_id, status, scheduled_at)
     VALUES ($1, 'scheduled', NOW() + INTERVAL '1 hour')`,
    [orgId]
  )
  
  return true
}
