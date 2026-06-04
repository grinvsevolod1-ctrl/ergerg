import { NextRequest, NextResponse } from 'next/server'
import { getAllSessions, getChatStats, SessionFilters } from '@/lib/db/chat'

// Verify admin token
function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminToken = process.env.ADMIN_API_TOKEN
  return token === adminToken && !!adminToken
}

// GET /api/admin/chats - Get all chat sessions
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    // return
  }

  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const stats = searchParams.get('stats') === 'true'

    // If stats requested, return only stats
    if (stats) {
      const chatStats = await getChatStats()
      return NextResponse.json(chatStats)
    }

    // Build filters
    const filters: SessionFilters = {}
    
    const userType = searchParams.get('userType')
    if (userType === 'website' || userType === 'telegram') {
      filters.userType = userType
    }

    const operatorConnected = searchParams.get('operatorConnected')
    if (operatorConnected === 'true') filters.operatorConnected = true
    if (operatorConnected === 'false') filters.operatorConnected = false

    const search = searchParams.get('search')
    if (search) filters.search = search

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) filters.dateFrom = new Date(dateFrom)

    const dateTo = searchParams.get('dateTo')
    if (dateTo) filters.dateTo = new Date(dateTo)

    const { sessions, total } = await getAllSessions(page, limit, filters)

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    )
  }
}
