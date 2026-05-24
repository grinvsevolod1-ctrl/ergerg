import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'

// GET - получить настройки Telegram
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const searchParams = request.nextUrl.searchParams
  const integrationId = searchParams.get('integration_id')
  
  // Get integration
  const integrations = await query<{
    id: string
    platform_id: string
    platform_name: string
    is_active: boolean
    is_connected: boolean
    last_connected_at: Date
  }>(
    integrationId 
      ? `SELECT id, platform_id, platform_name, is_active, is_connected, last_connected_at 
         FROM nexik_integrations WHERE org_id = $1 AND platform = 'telegram' AND id = $2`
      : `SELECT id, platform_id, platform_name, is_active, is_connected, last_connected_at 
         FROM nexik_integrations WHERE org_id = $1 AND platform = 'telegram'`,
    integrationId ? [orgId, integrationId] : [orgId]
  )
  
  if (integrations.length === 0) {
    return NextResponse.json({ integration: null, settings: null, exceptions: [] })
  }
  
  const integration = integrations[0]
  
  // Get settings
  const settings = await query<{
    respond_to_all: boolean
    respond_to_questions_only: boolean
    respond_to_mentions: boolean
    process_text: boolean
    process_voice: boolean
    process_photos: boolean
    process_stickers: boolean
    typing_delay_ms: number
    response_delay_ms: number
    auto_reply_enabled: boolean
    notify_on_new_chat: boolean
    notify_on_keywords: string[]
  }>(
    `SELECT * FROM nexik_telegram_settings WHERE integration_id = $1`,
    [integration.id]
  )
  
  // Get exceptions
  const exceptions = await query<{
    id: string
    exception_type: string
    value: string
    mode: string
    description: string
    is_active: boolean
  }>(
    `SELECT id, exception_type, value, mode, description, is_active 
     FROM nexik_telegram_exceptions 
     WHERE org_id = $1 AND (integration_id = $2 OR integration_id IS NULL)
     ORDER BY created_at DESC`,
    [orgId, integration.id]
  )
  
  return NextResponse.json({
    integration,
    settings: settings[0] || {
      respond_to_all: true,
      respond_to_questions_only: false,
      respond_to_mentions: true,
      process_text: true,
      process_voice: true,
      process_photos: false,
      process_stickers: false,
      typing_delay_ms: 1000,
      response_delay_ms: 2000,
      auto_reply_enabled: true,
      notify_on_new_chat: true,
      notify_on_keywords: []
    },
    exceptions
  })
}

// PUT - обновить настройки
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const body = await request.json()
  const { integration_id, settings } = body
  
  if (!integration_id) {
    return NextResponse.json({ error: 'integration_id required' }, { status: 400 })
  }
  
  // Verify integration belongs to org
  const integration = await query<{ id: string }>(
    `SELECT id FROM nexik_integrations WHERE id = $1 AND org_id = $2`,
    [integration_id, orgId]
  )
  
  if (!integration[0]) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }
  
  // Upsert settings
  await execute(
    `INSERT INTO nexik_telegram_settings (
      org_id, integration_id, 
      respond_to_all, respond_to_questions_only, respond_to_mentions,
      process_text, process_voice, process_photos, process_stickers,
      typing_delay_ms, response_delay_ms, auto_reply_enabled,
      notify_on_new_chat, notify_on_keywords
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (org_id, integration_id) DO UPDATE SET
      respond_to_all = EXCLUDED.respond_to_all,
      respond_to_questions_only = EXCLUDED.respond_to_questions_only,
      respond_to_mentions = EXCLUDED.respond_to_mentions,
      process_text = EXCLUDED.process_text,
      process_voice = EXCLUDED.process_voice,
      process_photos = EXCLUDED.process_photos,
      process_stickers = EXCLUDED.process_stickers,
      typing_delay_ms = EXCLUDED.typing_delay_ms,
      response_delay_ms = EXCLUDED.response_delay_ms,
      auto_reply_enabled = EXCLUDED.auto_reply_enabled,
      notify_on_new_chat = EXCLUDED.notify_on_new_chat,
      notify_on_keywords = EXCLUDED.notify_on_keywords,
      updated_at = NOW()`,
    [
      orgId,
      integration_id,
      settings.respond_to_all ?? true,
      settings.respond_to_questions_only ?? false,
      settings.respond_to_mentions ?? true,
      settings.process_text ?? true,
      settings.process_voice ?? true,
      settings.process_photos ?? false,
      settings.process_stickers ?? false,
      settings.typing_delay_ms ?? 1000,
      settings.response_delay_ms ?? 2000,
      settings.auto_reply_enabled ?? true,
      settings.notify_on_new_chat ?? true,
      settings.notify_on_keywords ?? []
    ]
  )
  
  return NextResponse.json({ success: true })
}
