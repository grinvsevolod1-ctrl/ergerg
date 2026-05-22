/**
 * Nexik Widget Config API v1
 * Returns widget configuration for initialization
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAPIKey } from '@/lib/nexik/db/organizations'
import { getWidget } from '@/lib/nexik/db/widgets'
import { headers } from 'next/headers'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Widget-ID',
  'Access-Control-Max-Age': '86400'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const apiKey = headersList.get('x-api-key')
    const widgetId = headersList.get('x-widget-id') || request.nextUrl.searchParams.get('widget_id')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    if (!widgetId) {
      return NextResponse.json(
        { error: 'Missing widget ID' },
        { status: 400, headers: corsHeaders }
      )
    }

    const validation = await validateAPIKey(apiKey)
    if (!validation.valid || !validation.org) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    const widget = await getWidget(widgetId)
    if (!widget || widget.org_id !== validation.org.id) {
      return NextResponse.json(
        { error: 'Widget not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    if (!widget.is_active) {
      return NextResponse.json(
        { error: 'Widget is disabled' },
        { status: 403, headers: corsHeaders }
      )
    }

    // Return public widget config (no sensitive data)
    return NextResponse.json({
      id: widget.id,
      name: widget.name,
      theme: widget.theme,
      greeting_message: widget.greeting_message,
      placeholder_text: widget.placeholder_text,
      offline_message: widget.offline_message,
      require_email: widget.require_email,
      require_name: widget.require_name,
      pre_chat_form: widget.pre_chat_form,
      quick_replies: widget.quick_replies,
      ai_enabled: widget.ai_enabled,
      organization: {
        name: validation.org.name,
        logo_url: validation.org.logo_url
      }
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Nexik API] Widget config error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
