import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'csv'
    const conversationId = searchParams.get('id')
    const startDate = searchParams.get('start')
    const endDate = searchParams.get('end')

    // Build query
    let whereClause = 'c.org_id = $1'
    const params: (string | Date)[] = [session.org.id]
    let paramIndex = 2

    if (conversationId) {
      whereClause += ` AND c.id = $${paramIndex}`
      params.push(conversationId)
      paramIndex++
    }

    if (startDate) {
      whereClause += ` AND c.created_at >= $${paramIndex}`
      params.push(new Date(startDate))
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND c.created_at <= $${paramIndex}`
      params.push(new Date(endDate))
      paramIndex++
    }

    // Get conversations with messages
    const conversations = await query<{
      id: string
      visitor_id: string
      visitor_name: string | null
      visitor_email: string | null
      status: string
      created_at: string
      messages: Array<{
        role: string
        content: string
        created_at: string
      }>
    }>(`
      SELECT 
        c.id,
        c.visitor_id,
        c.visitor_name,
        c.visitor_email,
        c.status,
        c.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'role', m.role,
              'content', m.content,
              'created_at', m.created_at
            ) ORDER BY m.created_at ASC
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'
        ) as messages
      FROM nexik_conversations c
      LEFT JOIN nexik_messages m ON m.conversation_id = c.id
      WHERE ${whereClause}
      GROUP BY c.id
      ORDER BY c.created_at DESC
      LIMIT 1000
    `, params)

    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: conversations,
        exportedAt: new Date().toISOString(),
        count: conversations.length
      })
    }

    // CSV format
    const csvRows: string[] = []
    
    // Header
    csvRows.push([
      'Conversation ID',
      'Visitor ID',
      'Visitor Name',
      'Visitor Email',
      'Status',
      'Created At',
      'Message Role',
      'Message Content',
      'Message Time'
    ].map(escapeCSV).join(','))

    // Data rows
    for (const conv of conversations) {
      const messages = conv.messages || []
      
      if (messages.length === 0) {
        // Conversation without messages
        csvRows.push([
          conv.id,
          conv.visitor_id,
          conv.visitor_name || '',
          conv.visitor_email || '',
          conv.status,
          formatDate(conv.created_at),
          '',
          '',
          ''
        ].map(escapeCSV).join(','))
      } else {
        // One row per message
        for (const msg of messages) {
          csvRows.push([
            conv.id,
            conv.visitor_id,
            conv.visitor_name || '',
            conv.visitor_email || '',
            conv.status,
            formatDate(conv.created_at),
            msg.role,
            msg.content,
            formatDate(msg.created_at)
          ].map(escapeCSV).join(','))
        }
      }
    }

    const csvContent = csvRows.join('\n')
    const filename = `nexik-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    )
  }
}

function escapeCSV(value: string): string {
  if (!value) return '""'
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString()
  } catch {
    return dateStr
  }
}
