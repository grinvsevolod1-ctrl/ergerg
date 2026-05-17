import { NextRequest, NextResponse } from 'next/server'
import { getCurrentSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'
    
    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const orgId = session.orgId

    // Get overview stats
    const [overview] = await query<{
      total_conversations: string
      total_messages: string
      ai_responses: string
      operator_responses: string
      unique_visitors: string
      avg_response_time: string
    }>(`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'ai') as ai_responses,
        COUNT(m.id) FILTER (WHERE m.sender_type = 'operator') as operator_responses,
        COUNT(DISTINCT c.visitor_id) as unique_visitors,
        AVG(m.ai_response_time_ms) FILTER (WHERE m.ai_response_time_ms IS NOT NULL) as avg_response_time
      FROM nexik_conversations c
      LEFT JOIN nexik_messages m ON m.conversation_id = c.id
      WHERE c.org_id = $1 AND c.created_at >= $2
    `, [orgId, startDate.toISOString()])

    // Get previous period for comparison
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - days)
    
    const [prevOverview] = await query<{
      total_conversations: string
      total_messages: string
    }>(`
      SELECT 
        COUNT(DISTINCT c.id) as total_conversations,
        COUNT(m.id) as total_messages
      FROM nexik_conversations c
      LEFT JOIN nexik_messages m ON m.conversation_id = c.id
      WHERE c.org_id = $1 AND c.created_at >= $2 AND c.created_at < $3
    `, [orgId, prevStartDate.toISOString(), startDate.toISOString()])

    // Calculate trends
    const currentConv = parseInt(overview?.total_conversations || '0')
    const prevConv = parseInt(prevOverview?.total_conversations || '0')
    const currentMsg = parseInt(overview?.total_messages || '0')
    const prevMsg = parseInt(prevOverview?.total_messages || '0')

    const conversationsChange = prevConv > 0 ? ((currentConv - prevConv) / prevConv) * 100 : 0
    const messagesChange = prevMsg > 0 ? ((currentMsg - prevMsg) / prevMsg) * 100 : 0

    // Get daily stats
    const dailyStats = await query<{
      date: string
      conversations: string
      messages: string
    }>(`
      SELECT 
        DATE(c.created_at) as date,
        COUNT(DISTINCT c.id) as conversations,
        COUNT(m.id) as messages
      FROM nexik_conversations c
      LEFT JOIN nexik_messages m ON m.conversation_id = c.id
      WHERE c.org_id = $1 AND c.created_at >= $2
      GROUP BY DATE(c.created_at)
      ORDER BY date ASC
    `, [orgId, startDate.toISOString()])

    // Get popular topics (based on first message keywords)
    // This is a simplified version - in production you'd use NLP
    const topicResults = await query<{
      keyword: string
      count: string
    }>(`
      SELECT 
        CASE 
          WHEN LOWER(m.content) LIKE '%цен%' OR LOWER(m.content) LIKE '%стоим%' OR LOWER(m.content) LIKE '%сколько%' THEN 'Стоимость услуг'
          WHEN LOWER(m.content) LIKE '%срок%' OR LOWER(m.content) LIKE '%когда%' OR LOWER(m.content) LIKE '%долго%' THEN 'Сроки'
          WHEN LOWER(m.content) LIKE '%технолог%' OR LOWER(m.content) LIKE '%react%' OR LOWER(m.content) LIKE '%next%' THEN 'Технологии'
          WHEN LOWER(m.content) LIKE '%порт%' OR LOWER(m.content) LIKE '%работ%' OR LOWER(m.content) LIKE '%пример%' THEN 'Портфолио'
          WHEN LOWER(m.content) LIKE '%контакт%' OR LOWER(m.content) LIKE '%связ%' OR LOWER(m.content) LIKE '%телефон%' THEN 'Контакты'
          WHEN LOWER(m.content) LIKE '%привет%' OR LOWER(m.content) LIKE '%здравств%' THEN 'Приветствие'
          ELSE 'Другое'
        END as keyword,
        COUNT(*) as count
      FROM nexik_messages m
      JOIN nexik_conversations c ON c.id = m.conversation_id
      WHERE c.org_id = $1 AND m.sender_type = 'visitor' AND c.created_at >= $2
      GROUP BY keyword
      ORDER BY count DESC
      LIMIT 5
    `, [orgId, startDate.toISOString()])

    const totalTopicCount = topicResults.reduce((sum, t) => sum + parseInt(t.count), 0)
    const popularTopics = topicResults.map(t => ({
      topic: t.keyword,
      count: parseInt(t.count),
      percent: totalTopicCount > 0 ? Math.round((parseInt(t.count) / totalTopicCount) * 100) : 0
    }))

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalConversations: parseInt(overview?.total_conversations || '0'),
          totalMessages: parseInt(overview?.total_messages || '0'),
          aiResponses: parseInt(overview?.ai_responses || '0'),
          operatorResponses: parseInt(overview?.operator_responses || '0'),
          uniqueVisitors: parseInt(overview?.unique_visitors || '0'),
          avgResponseTime: parseFloat(overview?.avg_response_time || '0')
        },
        trends: {
          conversationsChange,
          messagesChange
        },
        dailyStats: dailyStats.map(d => ({
          date: d.date,
          conversations: parseInt(d.conversations),
          messages: parseInt(d.messages)
        })),
        popularTopics
      }
    })
  } catch (error) {
    console.error('[Analytics API] Error:', error)
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 })
  }
}
