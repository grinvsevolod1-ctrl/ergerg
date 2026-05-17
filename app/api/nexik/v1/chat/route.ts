/**
 * Nexik Chat API v1
 * Production-ready endpoint for widget communication
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAPIKey } from '@/lib/nexik/db/organizations'
import { getWidget, validateWidgetDomain } from '@/lib/nexik/db/widgets'
import { processMessage } from '@/lib/nexik/services/chat'
import { headers } from 'next/headers'

// CORS headers for widget
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Widget-ID',
  'Access-Control-Max-Age': '86400'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get API key from header
    const headersList = await headers()
    const apiKey = headersList.get('x-api-key')
    const widgetId = headersList.get('x-widget-id')
    const origin = headersList.get('origin') || headersList.get('referer')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key', code: 'MISSING_API_KEY' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Validate API key
    const validation = await validateAPIKey(apiKey)
    if (!validation.valid || !validation.org) {
      return NextResponse.json(
        { error: 'Invalid API key', code: 'INVALID_API_KEY' },
        { status: 401, headers: corsHeaders }
      )
    }

    const org = validation.org

    // Get widget config
    let widget = null
    if (widgetId) {
      widget = await getWidget(widgetId)
      if (!widget || widget.org_id !== org.id) {
        return NextResponse.json(
          { error: 'Widget not found', code: 'WIDGET_NOT_FOUND' },
          { status: 404, headers: corsHeaders }
        )
      }

      // Validate domain
      if (origin && widget.allowed_domains.length > 0) {
        const domain = new URL(origin).hostname
        const isValid = await validateWidgetDomain(widgetId, domain)
        if (!isValid) {
          return NextResponse.json(
            { error: 'Domain not allowed', code: 'DOMAIN_NOT_ALLOWED' },
            { status: 403, headers: corsHeaders }
          )
        }
      }
    }

    // Parse request body
    const body = await request.json()
    const { visitor_id, message, visitor_info, page_url, page_title } = body

    if (!visitor_id || !message) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 'INVALID_REQUEST' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Process message
    const result = await processMessage({
      org_id: org.id,
      widget_id: widgetId || undefined,
      visitor_id,
      message,
      visitor_info,
      page_url,
      page_title
    })

    // Build response
    const response = {
      conversation_id: result.conversation_id,
      message: {
        id: result.message.id,
        content: result.message.content,
        sender: 'visitor',
        timestamp: result.message.created_at
      },
      ai_response: result.ai_response ? {
        id: result.ai_response.id,
        content: result.ai_response.content,
        sender: result.ai_response.sender_type,
        timestamp: result.ai_response.created_at,
        quick_replies: result.ai_response.quick_replies
      } : null,
      quota: {
        remaining: result.quota_remaining,
        limited: result.quota_remaining === 0
      },
      latency_ms: Date.now() - startTime
    }

    return NextResponse.json(response, { headers: corsHeaders })
  } catch (error) {
    console.error('[Nexik API] Chat error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500, headers: corsHeaders }
    )
  }
}
