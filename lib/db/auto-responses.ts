/**
 * Auto-responses and quick reply templates management
 */

import { query, queryOne, execute } from './index'

// Types
export interface AutoResponseRule {
  id: string
  name: string
  trigger_type: 'keywords' | 'pattern' | 'greeting' | 'fallback'
  trigger_keywords?: string[]
  trigger_pattern?: string
  response_text: string
  response_buttons: { label: string; action: string }[]
  priority: number
  enabled: boolean
  use_count: number
  created_at: Date
  updated_at: Date
}

export interface QuickReplyTemplate {
  id: string
  category: string
  title: string
  content: string
  shortcut?: string
  use_count: number
  created_at: Date
  updated_at: Date
}

// Auto-response rules

export async function getAllAutoResponses(): Promise<AutoResponseRule[]> {
  return query<AutoResponseRule>(
    'SELECT * FROM auto_response_rules ORDER BY priority DESC, created_at DESC'
  )
}

export async function getEnabledAutoResponses(): Promise<AutoResponseRule[]> {
  return query<AutoResponseRule>(
    'SELECT * FROM auto_response_rules WHERE enabled = true ORDER BY priority DESC'
  )
}

export async function getAutoResponseById(id: string): Promise<AutoResponseRule | null> {
  return queryOne<AutoResponseRule>(
    'SELECT * FROM auto_response_rules WHERE id = $1',
    [id]
  )
}

export async function createAutoResponse(data: {
  name: string
  trigger_type: AutoResponseRule['trigger_type']
  trigger_keywords?: string[]
  trigger_pattern?: string
  response_text: string
  response_buttons?: { label: string; action: string }[]
  priority?: number
  enabled?: boolean
}): Promise<AutoResponseRule> {
  const result = await query<AutoResponseRule>(
    `INSERT INTO auto_response_rules 
     (name, trigger_type, trigger_keywords, trigger_pattern, response_text, response_buttons, priority, enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      data.name,
      data.trigger_type,
      data.trigger_keywords || null,
      data.trigger_pattern || null,
      data.response_text,
      JSON.stringify(data.response_buttons || []),
      data.priority || 0,
      data.enabled !== false,
    ]
  )
  return result[0]
}

export async function updateAutoResponse(
  id: string,
  data: Partial<{
    name: string
    trigger_type: AutoResponseRule['trigger_type']
    trigger_keywords: string[]
    trigger_pattern: string
    response_text: string
    response_buttons: { label: string; action: string }[]
    priority: number
    enabled: boolean
  }>
): Promise<AutoResponseRule | null> {
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.name !== undefined) {
    updates.push(`name = $${paramIndex++}`)
    values.push(data.name)
  }
  if (data.trigger_type !== undefined) {
    updates.push(`trigger_type = $${paramIndex++}`)
    values.push(data.trigger_type)
  }
  if (data.trigger_keywords !== undefined) {
    updates.push(`trigger_keywords = $${paramIndex++}`)
    values.push(data.trigger_keywords)
  }
  if (data.trigger_pattern !== undefined) {
    updates.push(`trigger_pattern = $${paramIndex++}`)
    values.push(data.trigger_pattern)
  }
  if (data.response_text !== undefined) {
    updates.push(`response_text = $${paramIndex++}`)
    values.push(data.response_text)
  }
  if (data.response_buttons !== undefined) {
    updates.push(`response_buttons = $${paramIndex++}`)
    values.push(JSON.stringify(data.response_buttons))
  }
  if (data.priority !== undefined) {
    updates.push(`priority = $${paramIndex++}`)
    values.push(data.priority)
  }
  if (data.enabled !== undefined) {
    updates.push(`enabled = $${paramIndex++}`)
    values.push(data.enabled)
  }

  if (updates.length === 0) return null

  updates.push('updated_at = NOW()')
  values.push(id)

  const result = await query<AutoResponseRule>(
    `UPDATE auto_response_rules SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result[0] || null
}

export async function deleteAutoResponse(id: string): Promise<boolean> {
  const rowCount = await execute(
    'DELETE FROM auto_response_rules WHERE id = $1',
    [id]
  )
  return rowCount > 0
}

export async function incrementAutoResponseUse(id: string): Promise<void> {
  await execute(
    'UPDATE auto_response_rules SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1',
    [id]
  )
}

// Find matching auto-response for a message
export async function findMatchingAutoResponse(
  message: string
): Promise<AutoResponseRule | null> {
  const rules = await getEnabledAutoResponses()
  const lowerMessage = message.toLowerCase().trim()

  for (const rule of rules) {
    switch (rule.trigger_type) {
      case 'greeting':
        // Match common greetings
        const greetings = ['привет', 'здравствуй', 'добрый день', 'добрый вечер', 'доброе утро', 'хай', 'hello', 'hi']
        if (greetings.some(g => lowerMessage.includes(g))) {
          return rule
        }
        break

      case 'keywords':
        // Match any of the keywords
        if (rule.trigger_keywords && rule.trigger_keywords.length > 0) {
          const matched = rule.trigger_keywords.some(kw => 
            lowerMessage.includes(kw.toLowerCase())
          )
          if (matched) return rule
        }
        break

      case 'pattern':
        // Match regex pattern
        if (rule.trigger_pattern) {
          try {
            const regex = new RegExp(rule.trigger_pattern, 'i')
            if (regex.test(message)) return rule
          } catch {
            // Invalid regex, skip
          }
        }
        break

      case 'fallback':
        // Only use fallback if no other rules matched (lowest priority)
        // Will be returned at the end if nothing else matches
        break
    }
  }

  // Return fallback rule if exists
  const fallback = rules.find(r => r.trigger_type === 'fallback')
  return fallback || null
}

// Quick reply templates

export async function getAllQuickReplies(): Promise<QuickReplyTemplate[]> {
  return query<QuickReplyTemplate>(
    'SELECT * FROM quick_reply_templates ORDER BY category, use_count DESC'
  )
}

export async function getQuickRepliesByCategory(category: string): Promise<QuickReplyTemplate[]> {
  return query<QuickReplyTemplate>(
    'SELECT * FROM quick_reply_templates WHERE category = $1 ORDER BY use_count DESC',
    [category]
  )
}

export async function getQuickReplyCategories(): Promise<string[]> {
  const result = await query<{ category: string }>(
    'SELECT DISTINCT category FROM quick_reply_templates ORDER BY category'
  )
  return result.map(r => r.category)
}

export async function createQuickReply(data: {
  category: string
  title: string
  content: string
  shortcut?: string
}): Promise<QuickReplyTemplate> {
  const result = await query<QuickReplyTemplate>(
    `INSERT INTO quick_reply_templates (category, title, content, shortcut)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [data.category, data.title, data.content, data.shortcut || null]
  )
  return result[0]
}

export async function updateQuickReply(
  id: string,
  data: Partial<{
    category: string
    title: string
    content: string
    shortcut: string
  }>
): Promise<QuickReplyTemplate | null> {
  const updates: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (data.category !== undefined) {
    updates.push(`category = $${paramIndex++}`)
    values.push(data.category)
  }
  if (data.title !== undefined) {
    updates.push(`title = $${paramIndex++}`)
    values.push(data.title)
  }
  if (data.content !== undefined) {
    updates.push(`content = $${paramIndex++}`)
    values.push(data.content)
  }
  if (data.shortcut !== undefined) {
    updates.push(`shortcut = $${paramIndex++}`)
    values.push(data.shortcut)
  }

  if (updates.length === 0) return null

  updates.push('updated_at = NOW()')
  values.push(id)

  const result = await query<QuickReplyTemplate>(
    `UPDATE quick_reply_templates SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  )
  return result[0] || null
}

export async function deleteQuickReply(id: string): Promise<boolean> {
  const rowCount = await execute(
    'DELETE FROM quick_reply_templates WHERE id = $1',
    [id]
  )
  return rowCount > 0
}

export async function incrementQuickReplyUse(id: string): Promise<void> {
  await execute(
    'UPDATE quick_reply_templates SET use_count = use_count + 1, updated_at = NOW() WHERE id = $1',
    [id]
  )
}

// Seed default auto-responses
export async function seedDefaultAutoResponses(): Promise<void> {
  const existing = await getAllAutoResponses()
  if (existing.length > 0) return

  const defaults: Parameters<typeof createAutoResponse>[0][] = [
    {
      name: 'Приветствие',
      trigger_type: 'greeting',
      response_text: 'Привет! Я виртуальный ассистент NetNext. Чем могу помочь?\n\nВыберите интересующую тему или напишите свой вопрос.',
      response_buttons: [
        { label: 'Узнать цены', action: 'estimate' },
        { label: 'Наши услуги', action: 'services' },
        { label: 'Связаться с менеджером', action: 'call_operator' },
      ],
      priority: 100,
      enabled: true,
    },
    {
      name: 'Цены',
      trigger_type: 'keywords',
      trigger_keywords: ['цена', 'стоимость', 'сколько стоит', 'прайс', 'бюджет', 'расценки'],
      response_text: 'Наши цены зависят от сложности проекта:\n\n- Лендинг — от 2 500 Br\n- Корпоративный сайт — от 5 000 Br\n- Интернет-магазин — от 10 000 Br\n- Мобильное приложение — от 15 000 Br\n\nДля точного расчёта расскажите о вашем проекте!',
      response_buttons: [
        { label: 'Рассчитать проект', action: 'start_project' },
        { label: 'Позвать менеджера', action: 'call_operator' },
      ],
      priority: 80,
      enabled: true,
    },
    {
      name: 'Услуги',
      trigger_type: 'keywords',
      trigger_keywords: ['услуги', 'что делаете', 'чем занимаетесь', 'можете', 'умеете'],
      response_text: 'Мы занимаемся:\n\n- Разработкой сайтов и веб-приложений\n- Созданием мобильных приложений\n- UI/UX дизайном\n- Контекстной и таргетированной рекламой\n- SEO продвижением\n\nЧто вас интересует больше всего?',
      response_buttons: [
        { label: 'Разработка сайтов', action: 'service_web' },
        { label: 'Реклама', action: 'service_ads' },
        { label: 'Все услуги', action: 'services' },
      ],
      priority: 70,
      enabled: true,
    },
    {
      name: 'Контакты',
      trigger_type: 'keywords',
      trigger_keywords: ['контакт', 'телефон', 'позвонить', 'связаться', 'написать', 'адрес'],
      response_text: 'Наши контакты:\n\n📞 +375 (29) 14-14-555\n📧 hello@netnext.site\n🌐 netnext.site\n\nРаботаем пн-пт с 9:00 до 18:00',
      response_buttons: [
        { label: 'Позвонить', action: 'call' },
        { label: 'Написать на почту', action: 'email' },
      ],
      priority: 60,
      enabled: true,
    },
    {
      name: 'Оператор',
      trigger_type: 'keywords',
      trigger_keywords: ['оператор', 'менеджер', 'человек', 'живой', 'позвать'],
      response_text: 'Сейчас подключу вас к менеджеру. Пожалуйста, подождите немного.',
      response_buttons: [],
      priority: 90,
      enabled: true,
    },
    {
      name: 'Fallback',
      trigger_type: 'fallback',
      response_text: 'Спасибо за ваш вопрос! Чтобы дать точный ответ, я передам его нашему менеджеру.\n\nВы также можете выбрать одну из тем ниже:',
      response_buttons: [
        { label: 'Узнать цены', action: 'estimate' },
        { label: 'Наши услуги', action: 'services' },
        { label: 'Связаться с менеджером', action: 'call_operator' },
      ],
      priority: 0,
      enabled: true,
    },
  ]

  for (const rule of defaults) {
    await createAutoResponse(rule)
  }
}
