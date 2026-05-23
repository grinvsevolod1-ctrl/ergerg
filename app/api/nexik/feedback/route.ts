import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/db'

/**
 * NEXIK Learning API
 * Сохранение фидбека для улучшения ответов
 */

// POST - сохранить фидбек (лайк/дизлайк)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, visitorId, reaction, comment } = body
    
    if (!messageId || !reaction || !['like', 'dislike'].includes(reaction)) {
      return NextResponse.json(
        { error: 'messageId and reaction (like/dislike) required' },
        { status: 400 }
      )
    }
    
    // Сохраняем фидбек
    await execute(
      `INSERT INTO nexik_feedback (message_id, visitor_id, reaction, comment, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [messageId, visitorId || 'anonymous', reaction, comment || null]
    )
    
    // Если это лайк - добавляем в обучающие примеры
    if (reaction === 'like') {
      // Получаем контекст сообщения
      const result = await query<{
        content: string
        intent: string
        visitor_id: string
      }>(
        `SELECT m.content, m.intent, m.visitor_id,
                (SELECT content FROM nexik_messages 
                 WHERE visitor_id = m.visitor_id 
                 AND created_at < m.created_at 
                 AND role = 'user'
                 ORDER BY created_at DESC 
                 LIMIT 1) as user_message
         FROM nexik_messages m
         WHERE m.id = $1 AND m.role = 'assistant'`,
        [messageId]
      )
      
      if (result.rows.length > 0) {
        const row = result.rows[0] as { content: string; intent: string; user_message: string }
        
        if (row.user_message) {
          // Добавляем как хороший пример для обучения
          await execute(
            `INSERT INTO nexik_training_examples 
             (user_message, ideal_response, intent, quality_score, created_at)
             VALUES ($1, $2, $3, 5, NOW())
             ON CONFLICT DO NOTHING`,
            [row.user_message, row.content, row.intent || 'general']
          )
        }
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: reaction === 'like' ? 'Спасибо за фидбек! Буду отвечать так чаще.' : 'Понял, учту на будущее.'
    })
    
  } catch (error) {
    console.error('[Nexik Learning] Error:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }
}

// GET - получить статистику обучения
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    
    let interval = '7 days'
    if (period === '30d') interval = '30 days'
    if (period === '1d') interval = '1 day'
    
    // Общая статистика
    const stats = await query<{
      total_messages: number
      total_visitors: number
      total_likes: number
      total_dislikes: number
      training_examples: number
    }>(
      `SELECT 
        (SELECT COUNT(*) FROM nexik_messages WHERE created_at > NOW() - INTERVAL '${interval}') as total_messages,
        (SELECT COUNT(DISTINCT visitor_id) FROM nexik_messages WHERE created_at > NOW() - INTERVAL '${interval}') as total_visitors,
        (SELECT COUNT(*) FROM nexik_feedback WHERE reaction = 'like' AND created_at > NOW() - INTERVAL '${interval}') as total_likes,
        (SELECT COUNT(*) FROM nexik_feedback WHERE reaction = 'dislike' AND created_at > NOW() - INTERVAL '${interval}') as total_dislikes,
        (SELECT COUNT(*) FROM nexik_training_examples) as training_examples`
    )
    
    // Топ intent-ов с дизлайками (что нужно улучшить)
    const needsImprovement = await query<{ intent: string; dislikes: number }>(
      `SELECT m.intent, COUNT(f.id) as dislikes
       FROM nexik_feedback f
       JOIN nexik_messages m ON m.id = f.message_id
       WHERE f.reaction = 'dislike' AND f.created_at > NOW() - INTERVAL '${interval}'
       GROUP BY m.intent
       ORDER BY dislikes DESC
       LIMIT 5`
    )
    
    // Последние дизлайки для анализа
    const recentDislikes = await query<{
      user_message: string
      ai_response: string
      intent: string
      created_at: Date
    }>(
      `SELECT 
        (SELECT content FROM nexik_messages 
         WHERE visitor_id = m.visitor_id 
         AND created_at < m.created_at 
         AND role = 'user'
         ORDER BY created_at DESC 
         LIMIT 1) as user_message,
        m.content as ai_response,
        m.intent,
        f.created_at
       FROM nexik_feedback f
       JOIN nexik_messages m ON m.id = f.message_id
       WHERE f.reaction = 'dislike'
       ORDER BY f.created_at DESC
       LIMIT 10`
    )
    
    return NextResponse.json({
      period,
      stats: stats.rows[0],
      needsImprovement: needsImprovement.rows,
      recentDislikes: recentDislikes.rows,
      learningRate: stats.rows[0] 
        ? Math.round((stats.rows[0].total_likes / Math.max(1, stats.rows[0].total_likes + stats.rows[0].total_dislikes)) * 100) 
        : 0
    })
    
  } catch (error) {
    console.error('[Nexik Learning] Error getting stats:', error)
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 })
  }
}
