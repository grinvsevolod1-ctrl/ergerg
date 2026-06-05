import { query } from './index'

export interface YandexDirectLog {
  id: string
  action: string
  campaign_id: string | null
  campaign_name: string | null
  success: boolean
  error_message: string | null
  details: Record<string, unknown>
  created_at: string
}

export interface LogActionInput {
  action: string
  campaignId?: number | null
  campaignName?: string | null
  success: boolean
  errorMessage?: string | null
  details?: Record<string, unknown>
}

/**
 * Best-effort audit logging. Never throws so a logging failure can't break
 * the actual Yandex Direct operation (important for test environments where
 * the DB might not be migrated yet).
 */
export async function logYandexAction(input: LogActionInput): Promise<void> {
  try {
    await query(
      `INSERT INTO yandex_direct_logs
         (action, campaign_id, campaign_name, success, error_message, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        input.action,
        input.campaignId ?? null,
        input.campaignName ?? null,
        input.success,
        input.errorMessage ?? null,
        JSON.stringify(input.details ?? {}),
      ]
    )
  } catch (err) {
    console.error('[YandexDirect] Failed to write audit log:', err)
  }
}

export async function getRecentYandexLogs(limit = 20): Promise<YandexDirectLog[]> {
  try {
    return await query<YandexDirectLog>(
      `SELECT * FROM yandex_direct_logs ORDER BY created_at DESC LIMIT $1`,
      [Math.min(Math.max(limit, 1), 100)]
    )
  } catch (err) {
    console.error('[YandexDirect] Failed to read audit log:', err)
    return []
  }
}
