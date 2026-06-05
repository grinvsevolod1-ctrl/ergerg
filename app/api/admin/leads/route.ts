import { NextRequest, NextResponse } from 'next/server'
import { getAllLeads, getLeadStats, LeadFilters } from '@/lib/db/leads'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'

// GET /api/admin/leads - Get all leads
export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const stats = searchParams.get('stats') === 'true'

    // If stats requested, return only stats
    if (stats) {
      const leadStats = await getLeadStats()
      return NextResponse.json(leadStats)
    }

    // Build filters
    const filters: LeadFilters = {}
    
    const status = searchParams.get('status')
    if (status === 'new' || status === 'contacted' || status === 'qualified' || status === 'sold' || status === 'lost') {
      filters.status = status
    }

    const source = searchParams.get('source')
    if (source) filters.source = source

    const search = searchParams.get('search')
    if (search) filters.search = search

    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) filters.dateFrom = new Date(dateFrom)

    const dateTo = searchParams.get('dateTo')
    if (dateTo) filters.dateTo = new Date(dateTo)

    const { leads, total } = await getAllLeads(page, limit, filters)

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
