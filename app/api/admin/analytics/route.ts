import { NextRequest, NextResponse } from 'next/server'
import { getAnalyticsSummary } from '@/lib/db/analytics'
import { query } from '@/lib/db'

// Verify admin token
function verifyAdmin(request: NextRequest): boolean {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  const adminToken = process.env.ADMIN_API_TOKEN
  return token === adminToken && !!adminToken
}

// GET /api/admin/analytics
export async function GET(request: NextRequest) {
  if (!verifyAdmin(request)) {
    // return
  }

  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    // Get generator analytics
    const generatorStats = await getAnalyticsSummary(days)

    // Get daily stats for chart
    const dailyStats = await query<{
      date: string
      leads: string
      chats: string
      generations: string
    }>(`
      SELECT 
        DATE(created_at) as date,
        0 as leads,
        0 as chats,
        COUNT(*) as generations
      FROM analytics_events
      WHERE event_type = 'generation_started' 
        AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT ${days}
    `)

    // Get leads by day
    const leadsByDay = await query<{ date: string; count: string }>(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Get chats by day
    const chatsByDay = await query<{ date: string; count: string }>(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM chat_sessions
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `)

    // Merge into timeline
    const timeline = new Map<string, { leads: number; chats: number; generations: number }>()
    
    dailyStats.forEach(d => {
      timeline.set(d.date, { 
        leads: 0, 
        chats: 0, 
        generations: parseInt(d.generations, 10) 
      })
    })
    
    leadsByDay.forEach(d => {
      const existing = timeline.get(d.date) || { leads: 0, chats: 0, generations: 0 }
      existing.leads = parseInt(d.count, 10)
      timeline.set(d.date, existing)
    })
    
    chatsByDay.forEach(d => {
      const existing = timeline.get(d.date) || { leads: 0, chats: 0, generations: 0 }
      existing.chats = parseInt(d.count, 10)
      timeline.set(d.date, existing)
    })

    const chartData = Array.from(timeline.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get conversion rates
    const conversionRate = generatorStats.totalGenerations > 0
      ? (generatorStats.orderClicks / generatorStats.totalGenerations * 100).toFixed(1)
      : '0'

    const completionRate = generatorStats.totalGenerations > 0
      ? (generatorStats.completedGenerations / generatorStats.totalGenerations * 100).toFixed(1)
      : '0'

    // Get device breakdown
    const deviceStats = await query<{ device_type: string; count: string }>(`
      SELECT device_type, COUNT(*) as count
      FROM leads
      WHERE device_type IS NOT NULL AND created_at > NOW() - INTERVAL '${days} days'
      GROUP BY device_type
    `)

    // Get source breakdown
    const sourceStats = await query<{ source: string; count: string }>(`
      SELECT source, COUNT(*) as count
      FROM leads
      WHERE created_at > NOW() - INTERVAL '${days} days'
      GROUP BY source
      ORDER BY count DESC
    `)

    return NextResponse.json({
      generator: generatorStats,
      chartData,
      rates: {
        conversion: conversionRate,
        completion: completionRate,
      },
      devices: deviceStats.map(d => ({ device: d.device_type, count: parseInt(d.count, 10) })),
      sources: sourceStats.map(s => ({ source: s.source, count: parseInt(s.count, 10) })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
