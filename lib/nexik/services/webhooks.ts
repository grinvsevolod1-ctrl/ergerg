/**
 * Nexik Webhook Service
 * Sends webhook notifications for events
 */

import { query } from '@/lib/db'
import crypto from 'crypto'

export type WebhookEvent = 
  | 'message.new'
  | 'conversation.created'
  | 'conversation.resolved'
  | 'operator.requested'

interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: Record<string, unknown>
}

interface Webhook {
  id: string
  url: string
  secret: string
  events: string[]
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  orgId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Get active webhooks for this org and event
    const webhooks = await query<Webhook>(`
      SELECT id, url, secret, events
      FROM nexik_webhooks
      WHERE org_id = $1 
        AND is_active = true
        AND $2 = ANY(events)
    `, [orgId, event])

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data
    }

    // Send to all matching webhooks (fire and forget)
    const promises = webhooks.map(webhook => sendWebhook(webhook, payload))
    
    // Don't await - let them run in background
    Promise.allSettled(promises).catch(() => {
      // Silent fail - webhooks are best effort
    })
  } catch {
    // Silent fail - don't break main flow for webhook errors
  }
}

/**
 * Send webhook to a single endpoint
 */
async function sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
  const body = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  
  // Create signature
  const signaturePayload = `${timestamp}.${body}`
  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(signaturePayload)
    .digest('hex')

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Nexik-Signature': `t=${timestamp},v1=${signature}`,
        'X-Nexik-Event': payload.event,
        'User-Agent': 'Nexik-Webhook/1.0'
      },
      body,
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    // Update webhook status
    await query(`
      UPDATE nexik_webhooks
      SET last_triggered_at = NOW(), last_status = $1
      WHERE id = $2
    `, [response.status, webhook.id])

  } catch (error) {
    // Update with error status
    await query(`
      UPDATE nexik_webhooks
      SET last_triggered_at = NOW(), last_status = 0
      WHERE id = $1
    `, [webhook.id]).catch(() => {})
  }
}

/**
 * Helper to verify webhook signature (for clients)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): boolean {
  const parts = signature.split(',')
  const timestampPart = parts.find(p => p.startsWith('t='))
  const signaturePart = parts.find(p => p.startsWith('v1='))

  if (!timestampPart || !signaturePart) return false

  const timestamp = parseInt(timestampPart.slice(2), 10)
  const expectedSignature = signaturePart.slice(3)

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - timestamp) > tolerance) return false

  // Verify signature
  const signaturePayload = `${timestamp}.${payload}`
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(computedSignature)
  )
}
