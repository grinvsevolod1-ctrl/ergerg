/**
 * Nexik Proactive Messaging Service
 * Behavior-triggered messages to engage visitors
 */

// ==========================================
// TYPES
// ==========================================

export type TriggerType = 
  | 'time_on_page'      // Visitor spent X seconds on page
  | 'scroll_depth'      // Visitor scrolled X% of page
  | 'exit_intent'       // Visitor moving mouse toward close/back
  | 'page_view'         // Visitor viewed specific page
  | 'return_visit'      // Returning visitor
  | 'idle'              // Visitor idle for X seconds
  | 'cart_abandonment'  // E-commerce: items in cart, leaving
  | 'form_abandonment'  // Started but not completed form
  | 'multiple_pages'    // Viewed X or more pages

export interface TriggerConditions {
  // Time-based
  timeSeconds?: number          // For time_on_page, idle
  
  // Scroll-based
  scrollPercent?: number        // For scroll_depth (0-100)
  
  // Page-based
  urlPattern?: string           // Regex pattern for URLs
  urlExact?: string            // Exact URL match
  pageTitle?: string           // Page title contains
  
  // Visitor-based
  isReturning?: boolean        // For return_visit
  visitCount?: number          // Minimum visit count
  
  // E-commerce
  cartValue?: number           // Minimum cart value
  cartItemCount?: number       // Minimum items in cart
  
  // Multi-page
  pageCount?: number           // For multiple_pages trigger
  
  // Referrer
  referrerPattern?: string     // Traffic source pattern
  utmSource?: string           // Specific UTM source
  utmCampaign?: string         // Specific UTM campaign
  
  // Device
  deviceType?: 'mobile' | 'desktop' | 'tablet'
  
  // Time of day (in org timezone)
  timeOfDay?: {
    start: string              // "09:00"
    end: string                // "18:00"
  }
  
  // Days of week
  daysOfWeek?: string[]        // ["mon", "tue", "wed"]
}

export interface QuickReply {
  id: string
  label: string
  message: string
}

export interface ProactiveTrigger {
  id: string
  org_id: string
  widget_id?: string
  name: string
  trigger_type: TriggerType
  conditions: TriggerConditions
  message: string
  quick_replies: QuickReply[]
  delay_seconds: number
  max_shows_per_visitor: number
  cooldown_hours: number
  is_active: boolean
  priority: number
  stats: {
    shown: number
    clicked: number
    converted: number
  }
  created_at: string
}

export interface VisitorContext {
  visitor_id: string
  page_url: string
  page_title?: string
  referrer?: string
  time_on_page_seconds: number
  scroll_depth_percent: number
  is_returning: boolean
  visit_count: number
  pages_viewed: number
  device_type: 'mobile' | 'desktop' | 'tablet'
  utm_source?: string
  utm_campaign?: string
  cart_value?: number
  cart_item_count?: number
  is_exit_intent?: boolean
  is_idle?: boolean
  idle_seconds?: number
}

export interface ProactiveCheckResult {
  shouldShow: boolean
  trigger?: ProactiveTrigger
  message?: string
  quickReplies?: QuickReply[]
  cooldownUntil?: Date
}

// ==========================================
// TRIGGER EVALUATION
// ==========================================

/**
 * Check if URL matches pattern
 */
function matchUrl(url: string, pattern?: string, exact?: string): boolean {
  if (exact) {
    return url === exact || new URL(url).pathname === exact
  }
  
  if (pattern) {
    try {
      // Support glob-like patterns
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
      const regex = new RegExp(regexPattern, 'i')
      return regex.test(url)
    } catch {
      return url.includes(pattern)
    }
  }
  
  return true
}

/**
 * Check if time of day condition is met
 */
function isWithinTimeRange(
  timeOfDay?: { start: string; end: string },
  timezone: string = 'Europe/Moscow'
): boolean {
  if (!timeOfDay) return true
  
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(now)
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0')
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0')
  const currentMinutes = hour * 60 + minute
  
  const [startH, startM] = timeOfDay.start.split(':').map(Number)
  const [endH, endM] = timeOfDay.end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * Check if day of week condition is met
 */
function isDayOfWeek(daysOfWeek?: string[], timezone: string = 'Europe/Moscow'): boolean {
  if (!daysOfWeek || daysOfWeek.length === 0) return true
  
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short'
  })
  
  const day = formatter.format(now).toLowerCase()
  const dayMap: Record<string, string> = {
    'mon': 'mon', 'tue': 'tue', 'wed': 'wed', 'thu': 'thu',
    'fri': 'fri', 'sat': 'sat', 'sun': 'sun'
  }
  
  return daysOfWeek.includes(dayMap[day] || day)
}

/**
 * Evaluate a single trigger against visitor context
 */
function evaluateTrigger(trigger: ProactiveTrigger, context: VisitorContext): boolean {
  const c = trigger.conditions
  
  // Check trigger type specific conditions
  switch (trigger.trigger_type) {
    case 'time_on_page':
      if (!c.timeSeconds || context.time_on_page_seconds < c.timeSeconds) {
        return false
      }
      break
      
    case 'scroll_depth':
      if (!c.scrollPercent || context.scroll_depth_percent < c.scrollPercent) {
        return false
      }
      break
      
    case 'exit_intent':
      if (!context.is_exit_intent) {
        return false
      }
      break
      
    case 'idle':
      if (!context.is_idle || !c.timeSeconds || (context.idle_seconds || 0) < c.timeSeconds) {
        return false
      }
      break
      
    case 'return_visit':
      if (!context.is_returning) {
        return false
      }
      if (c.visitCount && context.visit_count < c.visitCount) {
        return false
      }
      break
      
    case 'multiple_pages':
      if (!c.pageCount || context.pages_viewed < c.pageCount) {
        return false
      }
      break
      
    case 'cart_abandonment':
      if (!context.cart_item_count || context.cart_item_count === 0) {
        return false
      }
      if (!context.is_exit_intent && !context.is_idle) {
        return false
      }
      if (c.cartValue && (context.cart_value || 0) < c.cartValue) {
        return false
      }
      if (c.cartItemCount && context.cart_item_count < c.cartItemCount) {
        return false
      }
      break
  }
  
  // Check URL conditions (for all trigger types)
  if (c.urlPattern || c.urlExact) {
    if (!matchUrl(context.page_url, c.urlPattern, c.urlExact)) {
      return false
    }
  }
  
  // Check page title
  if (c.pageTitle && context.page_title) {
    if (!context.page_title.toLowerCase().includes(c.pageTitle.toLowerCase())) {
      return false
    }
  }
  
  // Check device type
  if (c.deviceType && context.device_type !== c.deviceType) {
    return false
  }
  
  // Check referrer
  if (c.referrerPattern && context.referrer) {
    try {
      const regex = new RegExp(c.referrerPattern, 'i')
      if (!regex.test(context.referrer)) {
        return false
      }
    } catch {
      if (!context.referrer.includes(c.referrerPattern)) {
        return false
      }
    }
  }
  
  // Check UTM
  if (c.utmSource && context.utm_source !== c.utmSource) {
    return false
  }
  if (c.utmCampaign && context.utm_campaign !== c.utmCampaign) {
    return false
  }
  
  // Check time of day
  if (!isWithinTimeRange(c.timeOfDay)) {
    return false
  }
  
  // Check day of week
  if (!isDayOfWeek(c.daysOfWeek)) {
    return false
  }
  
  return true
}

// ==========================================
// MAIN FUNCTIONS
// ==========================================

/**
 * Check which proactive message should be shown to visitor
 */
export async function checkProactiveTriggers(
  orgId: string,
  widgetId: string | undefined,
  context: VisitorContext
): Promise<ProactiveCheckResult> {
  const { query } = await import('@/lib/db')
  
  // Get active triggers for org/widget, ordered by priority
  const triggers = await query<ProactiveTrigger>(
    `SELECT * FROM nexik_proactive_triggers 
     WHERE org_id = $1 
       AND (widget_id IS NULL OR widget_id = $2)
       AND is_active = true
     ORDER BY priority DESC, created_at ASC`,
    [orgId, widgetId]
  )
  
  // Check visitor's trigger history
  const history = await query<{ trigger_id: string; shown_at: Date }>(
    `SELECT trigger_id, shown_at FROM nexik_proactive_logs 
     WHERE visitor_id = $1 
     ORDER BY shown_at DESC`,
    [context.visitor_id]
  )
  
  const shownTriggers = new Map(history.map(h => [h.trigger_id, h.shown_at]))
  
  // Find first matching trigger
  for (const trigger of triggers) {
    // Check if already shown max times
    const showCount = history.filter(h => h.trigger_id === trigger.id).length
    if (showCount >= trigger.max_shows_per_visitor) {
      continue
    }
    
    // Check cooldown
    const lastShown = shownTriggers.get(trigger.id)
    if (lastShown) {
      const cooldownEnd = new Date(lastShown.getTime() + trigger.cooldown_hours * 60 * 60 * 1000)
      if (new Date() < cooldownEnd) {
        continue
      }
    }
    
    // Check if trigger conditions are met
    if (evaluateTrigger(trigger, context)) {
      // Check delay
      if (trigger.delay_seconds > 0 && context.time_on_page_seconds < trigger.delay_seconds) {
        continue
      }
      
      return {
        shouldShow: true,
        trigger,
        message: trigger.message,
        quickReplies: trigger.quick_replies
      }
    }
  }
  
  return { shouldShow: false }
}

/**
 * Log that a proactive message was shown
 */
export async function logProactiveShow(
  triggerId: string,
  visitorId: string
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  // Log the show
  await execute(
    `INSERT INTO nexik_proactive_logs (trigger_id, visitor_id, shown_at)
     VALUES ($1, $2, NOW())`,
    [triggerId, visitorId]
  )
  
  // Update stats
  await execute(
    `UPDATE nexik_proactive_triggers 
     SET stats = jsonb_set(stats, '{shown}', to_jsonb(COALESCE((stats->>'shown')::int, 0) + 1))
     WHERE id = $1`,
    [triggerId]
  )
}

/**
 * Log that visitor clicked on proactive message
 */
export async function logProactiveClick(
  triggerId: string,
  visitorId: string
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  // Update log
  await execute(
    `UPDATE nexik_proactive_logs 
     SET clicked_at = NOW()
     WHERE trigger_id = $1 AND visitor_id = $2 AND clicked_at IS NULL
     ORDER BY shown_at DESC
     LIMIT 1`,
    [triggerId, visitorId]
  )
  
  // Update stats
  await execute(
    `UPDATE nexik_proactive_triggers 
     SET stats = jsonb_set(stats, '{clicked}', to_jsonb(COALESCE((stats->>'clicked')::int, 0) + 1))
     WHERE id = $1`,
    [triggerId]
  )
}

/**
 * Log that proactive message led to conversion (conversation started)
 */
export async function logProactiveConversion(
  triggerId: string,
  visitorId: string
): Promise<void> {
  const { execute } = await import('@/lib/db')
  
  // Update log
  await execute(
    `UPDATE nexik_proactive_logs 
     SET converted_at = NOW()
     WHERE trigger_id = $1 AND visitor_id = $2 AND converted_at IS NULL
     ORDER BY shown_at DESC
     LIMIT 1`,
    [triggerId, visitorId]
  )
  
  // Update stats
  await execute(
    `UPDATE nexik_proactive_triggers 
     SET stats = jsonb_set(stats, '{converted}', to_jsonb(COALESCE((stats->>'converted')::int, 0) + 1))
     WHERE id = $1`,
    [triggerId]
  )
}

// ==========================================
// CRUD FOR TRIGGERS
// ==========================================

/**
 * Create a new proactive trigger
 */
export async function createTrigger(
  trigger: Omit<ProactiveTrigger, 'id' | 'stats' | 'created_at'>
): Promise<ProactiveTrigger> {
  const { query } = await import('@/lib/db')
  
  const result = await query<ProactiveTrigger>(
    `INSERT INTO nexik_proactive_triggers 
     (org_id, widget_id, name, trigger_type, conditions, message, quick_replies, 
      delay_seconds, max_shows_per_visitor, cooldown_hours, is_active, priority, stats)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, '{"shown": 0, "clicked": 0, "converted": 0}')
     RETURNING *`,
    [
      trigger.org_id,
      trigger.widget_id,
      trigger.name,
      trigger.trigger_type,
      JSON.stringify(trigger.conditions),
      trigger.message,
      JSON.stringify(trigger.quick_replies),
      trigger.delay_seconds,
      trigger.max_shows_per_visitor,
      trigger.cooldown_hours,
      trigger.is_active,
      trigger.priority
    ]
  )
  
  return result[0]
}

/**
 * Update existing trigger
 */
export async function updateTrigger(
  triggerId: string,
  orgId: string,
  updates: Partial<Omit<ProactiveTrigger, 'id' | 'org_id' | 'stats' | 'created_at'>>
): Promise<ProactiveTrigger | null> {
  const { query } = await import('@/lib/db')
  
  // Build dynamic update
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1
  
  if (updates.name !== undefined) {
    fields.push(`name = $${paramIndex++}`)
    values.push(updates.name)
  }
  if (updates.trigger_type !== undefined) {
    fields.push(`trigger_type = $${paramIndex++}`)
    values.push(updates.trigger_type)
  }
  if (updates.conditions !== undefined) {
    fields.push(`conditions = $${paramIndex++}`)
    values.push(JSON.stringify(updates.conditions))
  }
  if (updates.message !== undefined) {
    fields.push(`message = $${paramIndex++}`)
    values.push(updates.message)
  }
  if (updates.quick_replies !== undefined) {
    fields.push(`quick_replies = $${paramIndex++}`)
    values.push(JSON.stringify(updates.quick_replies))
  }
  if (updates.delay_seconds !== undefined) {
    fields.push(`delay_seconds = $${paramIndex++}`)
    values.push(updates.delay_seconds)
  }
  if (updates.max_shows_per_visitor !== undefined) {
    fields.push(`max_shows_per_visitor = $${paramIndex++}`)
    values.push(updates.max_shows_per_visitor)
  }
  if (updates.cooldown_hours !== undefined) {
    fields.push(`cooldown_hours = $${paramIndex++}`)
    values.push(updates.cooldown_hours)
  }
  if (updates.is_active !== undefined) {
    fields.push(`is_active = $${paramIndex++}`)
    values.push(updates.is_active)
  }
  if (updates.priority !== undefined) {
    fields.push(`priority = $${paramIndex++}`)
    values.push(updates.priority)
  }
  
  if (fields.length === 0) {
    return null
  }
  
  values.push(triggerId, orgId)
  
  const result = await query<ProactiveTrigger>(
    `UPDATE nexik_proactive_triggers 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex++} AND org_id = $${paramIndex}
     RETURNING *`,
    values
  )
  
  return result[0] || null
}

/**
 * Delete trigger
 */
export async function deleteTrigger(triggerId: string, orgId: string): Promise<boolean> {
  const { execute } = await import('@/lib/db')
  
  const rowCount = await execute(
    'DELETE FROM nexik_proactive_triggers WHERE id = $1 AND org_id = $2',
    [triggerId, orgId]
  )
  
  return rowCount > 0
}

/**
 * Get all triggers for organization
 */
export async function getTriggers(orgId: string, widgetId?: string): Promise<ProactiveTrigger[]> {
  const { query } = await import('@/lib/db')
  
  if (widgetId) {
    return query<ProactiveTrigger>(
      `SELECT * FROM nexik_proactive_triggers 
       WHERE org_id = $1 AND (widget_id IS NULL OR widget_id = $2)
       ORDER BY priority DESC, created_at ASC`,
      [orgId, widgetId]
    )
  }
  
  return query<ProactiveTrigger>(
    `SELECT * FROM nexik_proactive_triggers 
     WHERE org_id = $1
     ORDER BY priority DESC, created_at ASC`,
    [orgId]
  )
}

/**
 * Get trigger analytics
 */
export async function getTriggerAnalytics(
  triggerId: string,
  orgId: string,
  days: number = 30
): Promise<{
  total_shown: number
  total_clicked: number
  total_converted: number
  click_rate: number
  conversion_rate: number
  daily_stats: Array<{ date: string; shown: number; clicked: number; converted: number }>
}> {
  const { query, queryOne } = await import('@/lib/db')
  
  // Get trigger stats
  const trigger = await queryOne<ProactiveTrigger>(
    'SELECT * FROM nexik_proactive_triggers WHERE id = $1 AND org_id = $2',
    [triggerId, orgId]
  )
  
  if (!trigger) {
    return {
      total_shown: 0,
      total_clicked: 0,
      total_converted: 0,
      click_rate: 0,
      conversion_rate: 0,
      daily_stats: []
    }
  }
  
  // Get daily breakdown
  const dailyStats = await query<{ date: string; shown: number; clicked: number; converted: number }>(
    `SELECT 
       DATE(shown_at) as date,
       COUNT(*) as shown,
       COUNT(clicked_at) as clicked,
       COUNT(converted_at) as converted
     FROM nexik_proactive_logs
     WHERE trigger_id = $1 AND shown_at >= NOW() - INTERVAL '${days} days'
     GROUP BY DATE(shown_at)
     ORDER BY date DESC`,
    [triggerId]
  )
  
  const stats = trigger.stats
  const clickRate = stats.shown > 0 ? stats.clicked / stats.shown : 0
  const conversionRate = stats.shown > 0 ? stats.converted / stats.shown : 0
  
  return {
    total_shown: stats.shown,
    total_clicked: stats.clicked,
    total_converted: stats.converted,
    click_rate: Math.round(clickRate * 10000) / 100, // Percentage with 2 decimals
    conversion_rate: Math.round(conversionRate * 10000) / 100,
    daily_stats: dailyStats
  }
}

// ==========================================
// DEFAULT TRIGGERS
// ==========================================

/**
 * Create default triggers for new organization
 */
export async function createDefaultTriggers(orgId: string, widgetId?: string): Promise<void> {
  const defaults: Array<Omit<ProactiveTrigger, 'id' | 'org_id' | 'widget_id' | 'stats' | 'created_at'>> = [
    {
      name: 'Welcome after 30 seconds',
      trigger_type: 'time_on_page',
      conditions: { timeSeconds: 30 },
      message: 'Привет! Нужна помощь с выбором? Я могу ответить на ваши вопросы.',
      quick_replies: [
        { id: 'qr-1', label: 'Да, есть вопрос', message: 'У меня есть вопрос' },
        { id: 'qr-2', label: 'Просто смотрю', message: 'Спасибо, пока просто смотрю' }
      ],
      delay_seconds: 0,
      max_shows_per_visitor: 1,
      cooldown_hours: 24,
      is_active: true,
      priority: 10
    },
    {
      name: 'Exit intent',
      trigger_type: 'exit_intent',
      conditions: {},
      message: 'Подождите! Может быть у вас остались вопросы? Я с удовольствием помогу.',
      quick_replies: [
        { id: 'qr-1', label: 'Да, помогите', message: 'Да, у меня есть вопрос' },
        { id: 'qr-2', label: 'Нет, спасибо', message: 'Нет, спасибо' }
      ],
      delay_seconds: 0,
      max_shows_per_visitor: 1,
      cooldown_hours: 72,
      is_active: false, // Disabled by default
      priority: 5
    },
    {
      name: 'Returning visitor',
      trigger_type: 'return_visit',
      conditions: { visitCount: 2 },
      message: 'С возвращением! Рады видеть вас снова. Чем могу помочь сегодня?',
      quick_replies: [
        { id: 'qr-1', label: 'Есть вопрос', message: 'У меня есть вопрос' }
      ],
      delay_seconds: 5,
      max_shows_per_visitor: 1,
      cooldown_hours: 168, // 1 week
      is_active: true,
      priority: 15
    }
  ]
  
  for (const trigger of defaults) {
    await createTrigger({
      ...trigger,
      org_id: orgId,
      widget_id: widgetId
    })
  }
}
