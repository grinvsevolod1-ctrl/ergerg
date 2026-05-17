import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

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
    const repositories = await sql`
      SELECT 
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
      ORDER BY 
        CASE WHEN ${safeSort} = 'name' AND ${order} = 'ASC' THEN r.name END ASC,
        CASE WHEN ${safeSort} = 'name' AND ${order} = 'DESC' THEN r.name END DESC,
        CASE WHEN ${safeSort} = 'total_commits' AND ${order} = 'DESC' THEN COALESCE(SUM(dm.commits), 0) END DESC,
        CASE WHEN ${safeSort} = 'total_commits' AND ${order} = 'ASC' THEN COALESCE(SUM(dm.commits), 0) END ASC,
        CASE WHEN ${safeSort} = 'total_prs' AND ${order} = 'DESC' THEN COALESCE(SUM(dm.pull_requests_opened), 0) END DESC,
        CASE WHEN ${safeSort} = 'total_prs' AND ${order} = 'ASC' THEN COALESCE(SUM(dm.pull_requests_opened), 0) END ASC,
        CASE WHEN ${safeSort} = 'total_issues' AND ${order} = 'DESC' THEN COALESCE(SUM(dm.issues_opened), 0) END DESC,
        CASE WHEN ${safeSort} = 'total_issues' AND ${order} = 'ASC' THEN COALESCE(SUM(dm.issues_opened), 0) END ASC,
        CASE WHEN ${safeSort} = 'contributors_count' AND ${order} = 'DESC' THEN COUNT(DISTINCT dm.contributor_id) END DESC,
        CASE WHEN ${safeSort} = 'contributors_count' AND ${order} = 'ASC' THEN COUNT(DISTINCT dm.contributor_id) END ASC,
        CASE WHEN ${safeSort} = 'last_activity' AND ${order} = 'DESC' THEN MAX(dm.date) END DESC NULLS LAST,
        CASE WHEN ${safeSort} = 'last_activity' AND ${order} = 'ASC' THEN MAX(dm.date) END ASC NULLS LAST
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM repositories WHERE is_active = true
    `
    
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
    console.error('[v0] Error fetching repositories:', error)
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
    
    const result = await sql`
      INSERT INTO repositories (name, description, url, default_branch)
      VALUES (${name}, ${description || null}, ${url}, ${default_branch})
      ON CONFLICT (name) DO UPDATE SET
        description = EXCLUDED.description,
        url = EXCLUDED.url,
        default_branch = EXCLUDED.default_branch,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating repository:', error)
    return NextResponse.json(
      { error: 'Failed to create repository' },
      { status: 500 }
    )
  }
}
