import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'
import crypto from 'crypto'

// GET - list webhooks
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhooks = await query<{
      id: string
      url: string
      events: string[]
      is_active: boolean
      secret_preview: string
      last_triggered_at: string | null
      last_status: number | null
      created_at: string
    }>(`
      SELECT 
        id, url, events, is_active, 
        CONCAT(LEFT(secret, 8), '...') as secret_preview,
        last_triggered_at, last_status, created_at
      FROM nexik_webhooks
      WHERE org_id = $1
      ORDER BY created_at DESC
    `, [session.org.id])

    return NextResponse.json({ success: true, webhooks })
  } catch {
    return NextResponse.json({ error: 'Failed to load webhooks' }, { status: 500 })
  }
}

// POST - create webhook
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, events } = await req.json()

    // Validate URL
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Validate events
    const validEvents = ['message.new', 'conversation.created', 'conversation.resolved', 'operator.requested']
    const filteredEvents = events?.filter((e: string) => validEvents.includes(e)) || ['message.new']

    if (filteredEvents.length === 0) {
      return NextResponse.json({ error: 'At least one valid event required' }, { status: 400 })
    }

    // Generate secret
    const secret = `whsec_${crypto.randomBytes(24).toString('base64url')}`

    // Check limit (max 5 webhooks per org)
    const [count] = await query<{ count: string }>(`
      SELECT COUNT(*) as count FROM nexik_webhooks WHERE org_id = $1
    `, [session.org.id])

    if (parseInt(count?.count || '0') >= 5) {
      return NextResponse.json({ error: 'Maximum 5 webhooks allowed' }, { status: 400 })
    }

    // Create webhook
    const [webhook] = await query<{ id: string }>(`
      INSERT INTO nexik_webhooks (org_id, url, events, secret, is_active, created_by)
      VALUES ($1, $2, $3, $4, true, $5)
      RETURNING id
    `, [session.org.id, url, filteredEvents, secret, session.member.id])

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url,
        events: filteredEvents,
        secret // Return full secret only on creation
      }
    })
  } catch {
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 })
  }
}

// DELETE - remove webhook
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const webhookId = searchParams.get('id')

    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
    }

    await query(`
      DELETE FROM nexik_webhooks
      WHERE id = $1 AND org_id = $2
    `, [webhookId, session.org.id])

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 })
  }
}

// PATCH - update webhook
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, url, events, is_active } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })
    }

    const updates: string[] = []
    const params: (string | boolean | string[])[] = []
    let paramIndex = 1

    if (url !== undefined) {
      try {
        new URL(url)
      } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
      updates.push(`url = $${paramIndex}`)
      params.push(url)
      paramIndex++
    }

    if (events !== undefined) {
      updates.push(`events = $${paramIndex}`)
      params.push(events)
      paramIndex++
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`)
      params.push(is_active)
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 })
    }

    updates.push('updated_at = NOW()')
    params.push(id, session.org.id)

    await query(`
      UPDATE nexik_webhooks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND org_id = $${paramIndex + 1}
    `, params)

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 })
  }
}
