/**
 * Chat intelligence helpers for the public NetNext assistant (/api/chat/ai):
 *  - sanitizeResponse: strips foreign-script garbage (CJK etc.) that small
 *    local models (qwen2.5:3b) sometimes leak, so the user never sees
 *    "чем我可以 помочь".
 *  - getLearningContext: builds few-shot examples from past liked answers so
 *    the assistant reuses what worked (gets "smarter" over time).
 *  - getCachedAnswer: returns a previously liked answer for the same question
 *    instantly, without hitting the LLM (gets "faster" over time).
 */

import { query } from '@/lib/db'

// Unicode ranges for scripts the assistant must never output.
// Covers CJK, Hiragana/Katakana, Hangul, Arabic, Hebrew, Thai, Devanagari.
const FOREIGN_SCRIPT_REGEX =
  /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uAC00-\uD7AF\u0600-\u06FF\u0590-\u05FF\u0E00-\u0E7F\u0900-\u097F\uFF00-\uFFEF]/

/**
 * Returns true if the text contains characters from scripts the assistant
 * should not use (Russian + basic Latin/punctuation/emoji are allowed).
 */
export function hasForeignScript(text: string): boolean {
  return FOREIGN_SCRIPT_REGEX.test(text)
}

/**
 * Removes foreign-script characters and tidies up the leftover spacing.
 * Used as a last-resort cleanup when a retry still leaks garbage.
 */
export function sanitizeResponse(text: string): string {
  const cleaned = text
    .replace(new RegExp(FOREIGN_SCRIPT_REGEX.source, 'g'), '')
    // collapse spaces created by removed characters
    .replace(/ {2,}/g, ' ')
    // fix spaces left before punctuation
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim()
  return cleaned
}

/**
 * Pull a handful of well-received past answers (those that got a 👍) to use as
 * few-shot examples. This makes the model gradually align with what users
 * liked. Kept small (default 3) to avoid bloating the prompt / slowing the 3B
 * model. Falls back to an empty array on any error.
 */
export async function getLearningExamples(
  limit = 3
): Promise<Array<{ user: string; assistant: string }>> {
  try {
    const rows = await query<{ user_message: string; ai_response: string }>(
      `SELECT l.user_message, l.ai_response
       FROM netnext_chat_logs l
       JOIN netnext_chat_feedback f ON f.message_id = l.message_id
       WHERE f.reaction = 'like'
         AND l.source = 'ai'
         AND length(l.ai_response) BETWEEN 10 AND 600
       GROUP BY l.user_message, l.ai_response
       ORDER BY MAX(f.created_at) DESC
       LIMIT $1`,
      [limit]
    )
    return rows.map((r) => ({ user: r.user_message, assistant: r.ai_response }))
  } catch {
    return []
  }
}

/**
 * Fast path: if the exact same question (normalized) previously received a
 * liked answer, reuse it instantly and skip the LLM entirely. This is the
 * "gets faster the more it's used" mechanism for common repeated questions.
 */
export async function getCachedLikedAnswer(message: string): Promise<string | null> {
  const normalized = message.toLowerCase().trim()
  if (normalized.length < 3) return null
  try {
    const rows = await query<{ ai_response: string }>(
      `SELECT l.ai_response
       FROM netnext_chat_logs l
       JOIN netnext_chat_feedback f ON f.message_id = l.message_id
       WHERE f.reaction = 'like'
         AND l.source = 'ai'
         AND lower(trim(l.user_message)) = $1
       ORDER BY f.created_at DESC
       LIMIT 1`,
      [normalized]
    )
    return rows[0]?.ai_response ?? null
  } catch {
    return null
  }
}
