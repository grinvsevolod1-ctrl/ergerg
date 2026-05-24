import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface Contributor {
  id: number
  username: string
  email: string | null
  avatar_url: string | null
  first_contribution: Date
  is_active: boolean
  total_commits: number
  total_prs: number
  total_prs_merged: number
  total_issues: number
  total_reviews: number
  lines_added: number
  lines_removed: number
  repositories_count: number
  last_activity: Date | null
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const repositoryId = searchParams.get('repository_id')
    
    let contributors: Contributor[]
    
    if (repositoryId) {
      contributors = await query<Contributor>(
        `SELECT 
          c.id,
          c.username,
          c.email,
          c.avatar_url,
          c.first_contribution,
          c.is_active,
          COALESCE(SUM(dm.commits), 0)::int as total_commits,
          COALESCE(SUM(dm.pull_requests_opened), 0)::int as total_prs,
          COALESCE(SUM(dm.pull_requests_merged), 0)::int as total_prs_merged,
          COALESCE(SUM(dm.issues_opened), 0)::int as total_issues,
          COALESCE(SUM(dm.code_reviews), 0)::int as total_reviews,
          COALESCE(SUM(dm.lines_added), 0)::int as lines_added,
          COALESCE(SUM(dm.lines_removed), 0)::int as lines_removed,
          COUNT(DISTINCT dm.repository_id)::int as repositories_count,
          MAX(dm.date) as last_activity
        FROM contributors c
        LEFT JOIN daily_metrics dm ON c.id = dm.contributor_id
          AND dm.repository_id = $1
        WHERE c.is_active = true
        GROUP BY c.id
        HAVING COALESCE(SUM(dm.commits), 0) > 0 OR COALESCE(SUM(dm.pull_requests_opened), 0) > 0
        ORDER BY total_commits DESC
        LIMIT $2
        OFFSET $3`,
        [parseInt(repositoryId), limit, offset]
      )
    } else {
      contributors = await query<Contributor>(
        `SELECT 
          c.id,
          c.username,
          c.email,
          c.avatar_url,
          c.first_contribution,
          c.is_active,
          COALESCE(SUM(dm.commits), 0)::int as total_commits,
          COALESCE(SUM(dm.pull_requests_opened), 0)::int as total_prs,
          COALESCE(SUM(dm.pull_requests_merged), 0)::int as total_prs_merged,
          COALESCE(SUM(dm.issues_opened), 0)::int as total_issues,
          COALESCE(SUM(dm.code_reviews), 0)::int as total_reviews,
          COALESCE(SUM(dm.lines_added), 0)::int as lines_added,
          COALESCE(SUM(dm.lines_removed), 0)::int as lines_removed,
          COUNT(DISTINCT dm.repository_id)::int as repositories_count,
          MAX(dm.date) as last_activity
        FROM contributors c
        LEFT JOIN daily_metrics dm ON c.id = dm.contributor_id
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY total_commits DESC
        LIMIT $1
        OFFSET $2`,
        [limit, offset]
      )
    }
    
    // Get total count
    const countResult = await query<{ total: number }>(
      'SELECT COUNT(*)::int as total FROM contributors WHERE is_active = true',
      []
    )
    
    return NextResponse.json({
      contributors,
      pagination: {
        total: countResult[0]?.total || 0,
        limit,
        offset,
        hasMore: offset + contributors.length < (countResult[0]?.total || 0)
      }
    })
  } catch (error) {
    console.error('[Contributors API] Error fetching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contributors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, avatar_url } = body
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      )
    }
    
    const result = await query<Contributor>(
      `INSERT INTO contributors (username, email, avatar_url, first_contribution)
       VALUES ($1, $2, $3, CURRENT_DATE)
       ON CONFLICT (username) DO UPDATE SET
         email = COALESCE(EXCLUDED.email, contributors.email),
         avatar_url = COALESCE(EXCLUDED.avatar_url, contributors.avatar_url),
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [username, email || null, avatar_url || null]
    )
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[Contributors API] Error creating:', error)
    return NextResponse.json(
      { error: 'Failed to create contributor' },
      { status: 500 }
    )
  }
}
