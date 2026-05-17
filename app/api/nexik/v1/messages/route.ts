/**
 * Nexik Messages API v1
 * Get conversation history for widget
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateAPIKey } from '@/lib/nexik/db/organizations'
import { getConversationByVisitor, getConversationMessages } from '@/lib/nexik/db/conversations'
import { headers } from 'next/headers'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
  'Access-Control-Max-Age': '86400'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers()
    const apiKey = headersList.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    const validation = await validateAPIKey(apiKey)
    if (!validation.valid || !validation.org) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401, headers: corsHeaders }
      )
    }

    const { searchParams } = new URL(request.url)
    const visitorId = searchParams.get('visitor_id')
    const conversationId = searchParams.get('conversation_id')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!visitorId && !conversationId) {
      return NextResponse.json(
        { error: 'visitor_id or conversation_id required' },
        { status: 400, headers: corsHeaders }
      )
    }

    let conversation
    if (conversationId) {
      const { getConversation } = await import('@/lib/nexik/db/conversations')
      conversation = await getConversation(conversationId)
    } else if (visitorId) {
      conversation = await getConversationByVisitor(validation.org.id, visitorId, false)
    }

    if (!conversation) {
      return NextResponse.json(
        { messages: [], conversation_id: null },
        { headers: corsHeaders }
      )
    }

    // Verify conversation belongs to org
    if (conversation.org_id !== validation.org.id) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404, headers: corsHeaders }
      )
    }

    const messages = await getConversationMessages(conversation.id, limit)

    return NextResponse.json({
      conversation_id: conversation.id,
      status: conversation.status,
      messages: messages.map(m => ({
        id: m.id,
        content: m.content,
        sender: m.sender_type,
        sender_name: m.sender_name,
        timestamp: m.created_at,
        quick_replies: m.quick_replies
      }))
    }, { headers: corsHeaders })
  } catch (error) {
    console.error('[Nexik API] Messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    )
  }
}
