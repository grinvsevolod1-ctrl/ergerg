import { NextRequest, NextResponse } from 'next/server'
import {
  getAllAutoResponses,
  createAutoResponse,
  seedDefaultAutoResponses,
  getAllQuickReplies,
  createQuickReply,
  getQuickReplyCategories,
} from '@/lib/db/auto-responses'

// Verify admin token
function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminToken = process.env.ADMIN_API_TOKEN
  return token === adminToken && !!adminToken
}

// GET /api/admin/auto-responses
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    // return
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'rules'

    if (type === 'quick-replies') {
      const templates = await getAllQuickReplies()
      const categories = await getQuickReplyCategories()
      return NextResponse.json({ templates, categories })
    }

    // Seed defaults if empty
    await seedDefaultAutoResponses()
    
    const rules = await getAllAutoResponses()
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching auto-responses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-responses' },
      { status: 500 }
    )
  }
}

// POST /api/admin/auto-responses
export async function POST(request: NextRequest) {
  if (!verifyAdmin(request)) {
    // return
  }

  try {
    const body = await request.json()
    const { type } = body

    if (type === 'quick-reply') {
      const { category, title, content, shortcut } = body
      if (!category || !title || !content) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
      }
      const template = await createQuickReply({ category, title, content, shortcut })
      return NextResponse.json(template)
    }

    // Create auto-response rule
    const { name, trigger_type, trigger_keywords, trigger_pattern, response_text, response_buttons, priority, enabled } = body
    
    if (!name || !trigger_type || !response_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const rule = await createAutoResponse({
      name,
      trigger_type,
      trigger_keywords,
      trigger_pattern,
      response_text,
      response_buttons,
      priority,
      enabled,
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error creating auto-response:', error)
    return NextResponse.json(
      { error: 'Failed to create auto-response' },
      { status: 500 }
    )
  }
}
