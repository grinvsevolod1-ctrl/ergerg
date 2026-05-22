/**
 * Nexik Widget Configuration Management
 */

import { query, queryOne, execute } from '@/lib/db'

export interface WidgetTheme {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  primaryColor: string
  backgroundColor: string
  textColor: string
  borderRadius: number
  showAvatar: boolean
  avatarUrl: string | null
  bubbleSize: number
  zIndex: number
}

export interface QuickReply {
  id: string
  label: string
  message: string
  icon?: string
}

export interface PreChatField {
  id: string
  type: 'text' | 'email' | 'phone' | 'select'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export interface Widget {
  id: string
  org_id: string
  name: string
  allowed_domains: string[]
  theme: WidgetTheme
  greeting_message: string
  placeholder_text: string
  offline_message: string
  require_email: boolean
  require_name: boolean
  pre_chat_form: PreChatField[]
  ai_enabled: boolean
  ai_model: string
  ai_temperature: number
  ai_max_tokens: number
  system_prompt: string | null
  quick_replies: QuickReply[]
  auto_assign_operator: boolean
  operator_timeout_seconds: number
  track_events: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

// Default widget configuration
export const DEFAULT_WIDGET_THEME: WidgetTheme = {
  position: 'bottom-right',
  primaryColor: '#00ffff',
  backgroundColor: '#0a0a0f',
  textColor: '#ffffff',
  borderRadius: 16,
  showAvatar: true,
  avatarUrl: null,
  bubbleSize: 60,
  zIndex: 9999
}

export const DEFAULT_SYSTEM_PROMPT = `Ты — AI-ассистент компании. Твоя задача:
1. Отвечать на вопросы клиентов вежливо и профессионально
2. Если вопрос выходит за рамки твоих знаний, предложи связаться с оператором
3. Не выдумывай информацию — если не знаешь, скажи об этом
4. Отвечай кратко и по делу, но информативно
5. Используй информацию из базы знаний, если она предоставлена

Важно: Ты НЕ должен обсуждать темы, не связанные с бизнесом компании.`

// Widget CRUD
export async function createWidget(data: {
  org_id: string
  name: string
  allowed_domains?: string[]
  theme?: Partial<WidgetTheme>
  greeting_message?: string
  system_prompt?: string
}): Promise<Widget> {
  const theme = { ...DEFAULT_WIDGET_THEME, ...data.theme }
  
  const result = await query<Widget>(
    `INSERT INTO nexik_widgets (
      org_id, name, allowed_domains, theme, greeting_message, system_prompt
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      data.org_id,
      data.name,
      data.allowed_domains || [],
      JSON.stringify(theme),
      data.greeting_message || 'Привет! Чем могу помочь?',
      data.system_prompt || DEFAULT_SYSTEM_PROMPT
    ]
  )
  return result[0]
}

export async function getWidget(id: string): Promise<Widget | null> {
  return queryOne<Widget>(
    'SELECT * FROM nexik_widgets WHERE id = $1',
    [id]
  )
}

export async function getOrgWidgets(orgId: string): Promise<Widget[]> {
  return query<Widget>(
    'SELECT * FROM nexik_widgets WHERE org_id = $1 ORDER BY created_at DESC',
    [orgId]
  )
}

export async function updateWidget(
  id: string,
  data: Partial<Omit<Widget, 'id' | 'org_id' | 'created_at' | 'updated_at'>>
): Promise<Widget | null> {
  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = []
  let idx = 1

  const fields = [
    'name', 'allowed_domains', 'greeting_message', 'placeholder_text',
    'offline_message', 'require_email', 'require_name', 'ai_enabled',
    'ai_model', 'ai_temperature', 'ai_max_tokens', 'system_prompt',
    'auto_assign_operator', 'operator_timeout_seconds', 'track_events', 'is_active'
  ] as const

  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`)
      params.push(data[field])
    }
  }

  // Handle JSON fields
  if (data.theme !== undefined) {
    sets.push(`theme = $${idx++}`)
    params.push(JSON.stringify(data.theme))
  }
  if (data.pre_chat_form !== undefined) {
    sets.push(`pre_chat_form = $${idx++}`)
    params.push(JSON.stringify(data.pre_chat_form))
  }
  if (data.quick_replies !== undefined) {
    sets.push(`quick_replies = $${idx++}`)
    params.push(JSON.stringify(data.quick_replies))
  }

  params.push(id)

  const result = await query<Widget>(
    `UPDATE nexik_widgets SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  )
  return result[0] || null
}

export async function deleteWidget(id: string): Promise<boolean> {
  const count = await execute('DELETE FROM nexik_widgets WHERE id = $1', [id])
  return count > 0
}

// Domain validation
export async function validateWidgetDomain(widgetId: string, domain: string): Promise<boolean> {
  const widget = await getWidget(widgetId)
  if (!widget) return false
  
  // If no domains specified, allow all (for development)
  if (widget.allowed_domains.length === 0) return true
  
  // Check if domain matches any allowed domain
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, '')
  
  return widget.allowed_domains.some(allowed => {
    const normalizedAllowed = allowed.toLowerCase().replace(/^www\./, '')
    // Support wildcards like *.example.com
    if (normalizedAllowed.startsWith('*.')) {
      const baseDomain = normalizedAllowed.substring(2)
      return normalizedDomain === baseDomain || normalizedDomain.endsWith('.' + baseDomain)
    }
    return normalizedDomain === normalizedAllowed
  })
}

// Get widget embed code
export function getWidgetEmbedCode(widgetId: string, apiKey: string, baseUrl: string): string {
  return `<!-- Nexik AI Chat Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['NexikWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','nexik','${baseUrl}/nexik/widget.js'));
  nexik('init', {
    widgetId: '${widgetId}',
    apiKey: '${apiKey}'
  });
</script>
<!-- End Nexik Widget -->`
}
