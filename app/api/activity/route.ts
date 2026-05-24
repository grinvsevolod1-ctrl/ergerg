import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface Activity {
  id: number
  type: string
  title: string
  description: string | null
  url: string | null
  metadata: Record<string, unknown> | null
  created_at: Date
  contributor_username: string
  contributor_avatar: string | null
  repository_name: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const contributorId = searchParams.get('contributor_id')
    const repositoryId = searchParams.get('repository_id')
    
    let activities: Activity[]
    
    if (contributorId && repositoryId) {
      activities = await query<Activity>(
        `SELECT 
          a.id,
          a.type,
          a.title,
          a.description,
          a.url,
          a.metadata,
          a.created_at,
          c.username as contributor_username,
          c.avatar_url as contributor_avatar,
          r.name as repository_name
        FROM activity_log a
        JOIN contributors c ON a.contributor_id = c.id
        JOIN repositories r ON a.repository_id = r.id
        WHERE a.contributor_id = $1
          AND a.repository_id = $2
        ORDER BY a.created_at DESC
        LIMIT $3
        OFFSET $4`,
        [parseInt(contributorId), parseInt(repositoryId), limit, offset]
      )
    } else if (contributorId) {
      activities = await query<Activity>(
        `SELECT 
          a.id,
          a.type,
          a.title,
          a.description,
          a.url,
          a.metadata,
          a.created_at,
          c.username as contributor_username,
          c.avatar_url as contributor_avatar,
          r.name as repository_name
        FROM activity_log a
        JOIN contributors c ON a.contributor_id = c.id
        JOIN repositories r ON a.repository_id = r.id
        WHERE a.contributor_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2
        OFFSET $3`,
        [parseInt(contributorId), limit, offset]
      )
    } else if (repositoryId) {
      activities = await query<Activity>(
        `SELECT 
          a.id,
          a.type,
          a.title,
          a.description,
          a.url,
          a.metadata,
          a.created_at,
          c.username as contributor_username,
          c.avatar_url as contributor_avatar,
          r.name as repository_name
        FROM activity_log a
        JOIN contributors c ON a.contributor_id = c.id
        JOIN repositories r ON a.repository_id = r.id
        WHERE a.repository_id = $1
        ORDER BY a.created_at DESC
        LIMIT $2
        OFFSET $3`,
        [parseInt(repositoryId), limit, offset]
      )
    } else {
      activities = await query<Activity>(
        `SELECT 
          a.id,
          a.type,
          a.title,
          a.description,
          a.url,
          a.metadata,
          a.created_at,
          c.username as contributor_username,
          c.avatar_url as contributor_avatar,
          r.name as repository_name
        FROM activity_log a
        JOIN contributors c ON a.contributor_id = c.id
        JOIN repositories r ON a.repository_id = r.id
        ORDER BY a.created_at DESC
        LIMIT $1
        OFFSET $2`,
        [limit, offset]
      )
    }
    
    // Get total count
    const countResult = await query<{ total: number }>(
      'SELECT COUNT(*)::int as total FROM activity_log',
      []
    )
    
    return NextResponse.json({
      activities,
      pagination: {
        total: countResult[0]?.total || 0,
        limit,
        offset,
        hasMore: offset + activities.length < (countResult[0]?.total || 0)
      }
    })
  } catch (error) {
    console.error('[Activity API] Error fetching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contributor_id, repository_id, type, title, description, url, metadata } = body
    
    if (!contributor_id || !repository_id || !type || !title) {
      return NextResponse.json(
        { error: 'contributor_id, repository_id, type, and title are required' },
        { status: 400 }
      )
    }
    
    // Validate activity type
    const validTypes = ['commit', 'pull_request', 'issue', 'review', 'merge']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    const result = await query<Activity>(
      `INSERT INTO activity_log (contributor_id, repository_id, type, title, description, url, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        contributor_id, 
        repository_id, 
        type, 
        title, 
        description || null, 
        url || null, 
        metadata ? JSON.stringify(metadata) : null
      ]
    )
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[Activity API] Error creating:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
