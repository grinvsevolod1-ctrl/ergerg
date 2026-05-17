import { query, execute } from './index'
import type { AnalyticsEvent, VariantFeedback } from '../site-analyzer/types'

interface GeoInfo {
  country: string | null
  city: string | null
}

// Simplified geo lookup - returns null (geoip-lite removed due to data file issues)
// Can be replaced with an API-based solution if needed
export function getGeoFromIP(_ip: string): GeoInfo {
  return { country: null, city: null }
}

export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase()
  
  if (/mobile|android.*mobile|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile'
  }
  if (/ipad|android(?!.*mobile)|tablet/i.test(ua)) {
    return 'tablet'
  }
  return 'desktop'
}

export async function trackEvent(
  sessionId: string,
  eventType: AnalyticsEvent['eventType'],
  eventData?: Record<string, unknown>,
  leadId?: string
): Promise<void> {
  try {
    await execute(
      `INSERT INTO analytics_events (session_id, event_type, event_data, lead_id)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, eventType, eventData ? JSON.stringify(eventData) : null, leadId || null]
    )
  } catch (err) {
    console.error('[Analytics] Failed to track event:', err)
  }
}

export async function saveVariantFeedback(
  niche: string,
  variantUrl: string,
  feedback: 'like' | 'dislike'
): Promise<void> {
  await execute(
    `INSERT INTO variant_feedback (niche, variant_url, feedback)
     VALUES ($1, $2, $3)`,
    [niche, variantUrl, feedback]
  )
}

export async function getVariantFeedbackStats(niche: string): Promise<{
  url: string
  likes: number
  dislikes: number
}[]> {
  return query(
    `SELECT 
       variant_url as url,
       COUNT(*) FILTER (WHERE feedback = 'like') as likes,
       COUNT(*) FILTER (WHERE feedback = 'dislike') as dislikes
     FROM variant_feedback
     WHERE niche = $1
     GROUP BY variant_url
     ORDER BY likes DESC`,
    [niche]
  )
}

export async function getEventsBySession(sessionId: string): Promise<AnalyticsEvent[]> {
  const rows = await query<{
    id: string
    lead_id: string | null
    session_id: string
    event_type: AnalyticsEvent['eventType']
    event_data: Record<string, unknown> | null
    created_at: Date
  }>(
    'SELECT * FROM analytics_events WHERE session_id = $1 ORDER BY created_at',
    [sessionId]
  )

  return rows.map(row => ({
    id: row.id,
    leadId: row.lead_id || undefined,
    sessionId: row.session_id,
    eventType: row.event_type,
    eventData: row.event_data || undefined,
    createdAt: row.created_at.toISOString(),
  }))
}

export async function getAnalyticsSummary(days: number = 30): Promise<{
  totalGenerations: number
  completedGenerations: number
  failedGenerations: number
  orderClicks: number
  avgVariantsViewed: number
  topNiches: { niche: string; count: number }[]
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const [generations, orders, variants, niches] = await Promise.all([
    query<{ event_type: string; count: string }>(
      `SELECT event_type, COUNT(*) as count
       FROM analytics_events
       WHERE event_type IN ('generation_started', 'generation_completed', 'generation_failed')
         AND created_at > $1
       GROUP BY event_type`,
      [since]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM analytics_events
       WHERE event_type = 'order_clicked' AND created_at > $1`,
      [since]
    ),
    query<{ avg: string }>(
      `SELECT AVG((event_data->>'variantsViewed')::int) as avg
       FROM analytics_events
       WHERE event_type = 'generation_completed' AND created_at > $1`,
      [since]
    ),
    query<{ niche: string; count: string }>(
      `SELECT event_data->>'niche' as niche, COUNT(*) as count
       FROM analytics_events
       WHERE event_type = 'generation_started' AND created_at > $1
       GROUP BY event_data->>'niche'
       ORDER BY count DESC
       LIMIT 10`,
      [since]
    ),
  ])

  const genMap = new Map(generations.map(g => [g.event_type, parseInt(g.count, 10)]))

  return {
    totalGenerations: genMap.get('generation_started') || 0,
    completedGenerations: genMap.get('generation_completed') || 0,
    failedGenerations: genMap.get('generation_failed') || 0,
    orderClicks: parseInt(orders[0]?.count || '0', 10),
    avgVariantsViewed: parseFloat(variants[0]?.avg || '1'),
    topNiches: niches.map(n => ({ niche: n.niche, count: parseInt(n.count, 10) })),
  }
}
