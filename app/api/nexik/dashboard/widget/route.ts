/**
 * Nexik Dashboard Widget API
 * Get and update widget settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { getOrgWidgets, updateWidget, getWidget } from '@/lib/nexik/db/widgets'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const widgets = await getOrgWidgets(session.org.id)
    
    // Get default widget (first one) or null
    const defaultWidget = widgets[0] || null

    // Get API key for embed code
    let apiKey = null
    if (defaultWidget) {
      const keys = await query<{ key_prefix: string; key_hash: string }>(
        `SELECT key_prefix FROM nexik_api_keys 
         WHERE org_id = $1 AND is_active = true 
         ORDER BY created_at LIMIT 1`,
        [session.org.id]
      )
      apiKey = keys[0]?.key_prefix ? `${keys[0].key_prefix}...` : null
    }

    return NextResponse.json({
      success: true,
      widget: defaultWidget ? {
        id: defaultWidget.id,
        name: defaultWidget.name,
        allowedDomains: defaultWidget.allowed_domains,
        theme: defaultWidget.theme,
        greetingMessage: defaultWidget.greeting_message,
        placeholderText: defaultWidget.placeholder_text,
        offlineMessage: defaultWidget.offline_message,
        requireEmail: defaultWidget.require_email,
        requireName: defaultWidget.require_name,
        aiEnabled: defaultWidget.ai_enabled,
        aiModel: defaultWidget.ai_model,
        systemPrompt: defaultWidget.system_prompt,
        quickReplies: defaultWidget.quick_replies,
        autoAssignOperator: defaultWidget.auto_assign_operator,
        operatorTimeoutSeconds: defaultWidget.operator_timeout_seconds,
        isActive: defaultWidget.is_active,
      } : null,
      apiKeyPreview: apiKey,
      orgSlug: session.org.slug
    })

  } catch (error) {
    console.error('[Widget API] GET Error:', error)
    return NextResponse.json({ error: 'Ошибка загрузки' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await req.json()
    const { widgetId, ...updates } = body

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID required' }, { status: 400 })
    }

    // Verify widget belongs to org
    const widget = await getWidget(widgetId)
    if (!widget || widget.org_id !== session.org.id) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 })
    }

    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {}
    
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.allowedDomains !== undefined) dbUpdates.allowed_domains = updates.allowedDomains
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme
    if (updates.greetingMessage !== undefined) dbUpdates.greeting_message = updates.greetingMessage
    if (updates.placeholderText !== undefined) dbUpdates.placeholder_text = updates.placeholderText
    if (updates.offlineMessage !== undefined) dbUpdates.offline_message = updates.offlineMessage
    if (updates.requireEmail !== undefined) dbUpdates.require_email = updates.requireEmail
    if (updates.requireName !== undefined) dbUpdates.require_name = updates.requireName
    if (updates.aiEnabled !== undefined) dbUpdates.ai_enabled = updates.aiEnabled
    if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt
    if (updates.quickReplies !== undefined) dbUpdates.quick_replies = updates.quickReplies
    if (updates.autoAssignOperator !== undefined) dbUpdates.auto_assign_operator = updates.autoAssignOperator
    if (updates.operatorTimeoutSeconds !== undefined) dbUpdates.operator_timeout_seconds = updates.operatorTimeoutSeconds
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive

    const updated = await updateWidget(widgetId, dbUpdates)

    return NextResponse.json({ success: true, widget: updated })

  } catch (error) {
    console.error('[Widget API] PATCH Error:', error)
    return NextResponse.json({ error: 'Ошибка сохранения' }, { status: 500 })
  }
}
