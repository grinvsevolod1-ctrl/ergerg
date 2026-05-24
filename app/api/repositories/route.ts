import { query } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'total_commits'
    const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC'
    
    // Validate sort column to prevent SQL injection
    const validSortColumns = ['name', 'total_commits', 'total_prs', 'total_issues', 'contributors_count', 'last_activity']
    const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'total_commits'
    
    // Get repositories with aggregated metrics
    const repositories = await query<{
      id: number
      name: string
      description: string | null
      url: string
      default_branch: string
      is_active: boolean
      created_at: Date
      updated_at: Date
      total_commits: number
      total_prs: number
      total_prs_merged: number
      total_issues: number
      total_issues_closed: number
      total_lines_added: number
      total_lines_removed: number
      contributors_count: number
      last_activity: Date | null
    }>(
      `SELECT 
        r.id,
        r.name,
        r.description,
        r.url,
        r.default_branch,
        r.is_active,
        r.created_at,
        r.updated_at,
        COALESCE(SUM(dm.commits), 0)::int as total_commits,
        COALESCE(SUM(dm.pull_requests_opened), 0)::int as total_prs,
        COALESCE(SUM(dm.pull_requests_merged), 0)::int as total_prs_merged,
        COALESCE(SUM(dm.issues_opened), 0)::int as total_issues,
        COALESCE(SUM(dm.issues_closed), 0)::int as total_issues_closed,
        COALESCE(SUM(dm.lines_added), 0)::int as total_lines_added,
        COALESCE(SUM(dm.lines_removed), 0)::int as total_lines_removed,
        COUNT(DISTINCT dm.contributor_id)::int as contributors_count,
        MAX(dm.date) as last_activity
      FROM repositories r
      LEFT JOIN daily_metrics dm ON r.id = dm.repository_id
      WHERE r.is_active = true
      GROUP BY r.id
      ORDER BY ${safeSort} ${order}
      LIMIT $1
      OFFSET $2`,
      [limit, offset]
    )
    
    // Get total count
    const countResult = await query<{ total: number }>(
      'SELECT COUNT(*)::int as total FROM repositories WHERE is_active = true',
      []
    )
    
    return NextResponse.json({
      repositories,
      pagination: {
        total: countResult[0]?.total || 0,
        limit,
        offset,
        hasMore: offset + repositories.length < (countResult[0]?.total || 0)
      }
    })
  } catch (error) {
    console.error('[Repositories API] Error fetching:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, url, default_branch = 'main' } = body
    
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      )
    }
    
    const result = await query<{ id: number; name: string; url: string }>(
      `INSERT INTO repositories (name, description, url, default_branch)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (name) DO UPDATE SET
         description = EXCLUDED.description,
         url = EXCLUDED.url,
         default_branch = EXCLUDED.default_branch,
         updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [name, description || null, url, default_branch]
    )
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[Repositories API] Error creating:', error)
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    )
  }
}
