import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// Verify admin token
function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminToken = process.env.ADMIN_API_TOKEN
  return token === adminToken && !!adminToken
}

// GET /api/admin/notifications - Get new notifications count
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    // return
  }

  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60000) // Last minute by default

    // Get new chat messages
    const newMessages = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM chat_messages 
       WHERE created_at > $1 AND sender_type = 'user' AND delivered = false`,
      [sinceDate]
    )

    // Get new leads
    const newLeads = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM leads 
       WHERE created_at > $1 AND status = 'new'`,
      [sinceDate]
    )

    // Get active operator sessions
    const activeSessions = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM chat_sessions 
       WHERE operator_connected = true`
    )

    // Get recent activity
    const recentActivity = await query<{
      type: string
      id: string
      message: string
      created_at: Date
    }>(`
      SELECT 
        'message' as type,
        id,
        SUBSTRING(message, 1, 50) as message,
        created_at
      FROM chat_messages
      WHERE created_at > $1 AND sender_type = 'user'
      UNION ALL
      SELECT 
        'lead' as type,
        id,
        company_name as message,
        created_at
      FROM leads
      WHERE created_at > $1
      ORDER BY created_at DESC
      LIMIT 10
    `, [sinceDate])

    return NextResponse.json({
      counts: {
        newMessages: parseInt(newMessages[0]?.count || '0', 10),
        newLeads: parseInt(newLeads[0]?.count || '0', 10),
        activeSessions: parseInt(activeSessions[0]?.count || '0', 10),
      },
      recentActivity,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}
