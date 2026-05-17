import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const repositoryId = searchParams.get('repository_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const sortBy = searchParams.get('sort') || 'total_commits'
    const order = searchParams.get('order') === 'asc' ? 'ASC' : 'DESC'
    
    // Validate sort column
    const validSortColumns = ['username', 'total_commits', 'total_prs', 'total_issues', 'total_reviews', 'lines_added']
    const safeSort = validSortColumns.includes(sortBy) ? sortBy : 'total_commits'
    
    // Build dynamic query based on filters
    let contributors
    
    if (repositoryId && startDate && endDate) {
      contributors = await sql`
        SELECT 
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
          AND dm.repository_id = ${parseInt(repositoryId)}
          AND dm.date >= ${startDate}::date
          AND dm.date <= ${endDate}::date
        WHERE c.is_active = true
        GROUP BY c.id
        HAVING COALESCE(SUM(dm.commits), 0) > 0 OR COALESCE(SUM(dm.pull_requests_opened), 0) > 0
        ORDER BY total_commits DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (repositoryId) {
      contributors = await sql`
        SELECT 
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
          AND dm.repository_id = ${parseInt(repositoryId)}
        WHERE c.is_active = true
        GROUP BY c.id
        HAVING COALESCE(SUM(dm.commits), 0) > 0 OR COALESCE(SUM(dm.pull_requests_opened), 0) > 0
        ORDER BY total_commits DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (startDate && endDate) {
      contributors = await sql`
        SELECT 
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
          AND dm.date >= ${startDate}::date
          AND dm.date <= ${endDate}::date
        WHERE c.is_active = true
        GROUP BY c.id
        ORDER BY total_commits DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      contributors = await sql`
        SELECT 
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
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }
    
    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM contributors WHERE is_active = true
    `
    
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
    console.error('[v0] Error fetching contributors:', error)
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
    
    const result = await sql`
      INSERT INTO contributors (username, email, avatar_url, first_contribution)
      VALUES (${username}, ${email || null}, ${avatar_url || null}, CURRENT_DATE)
      ON CONFLICT (username) DO UPDATE SET
        email = COALESCE(EXCLUDED.email, contributors.email),
        avatar_url = COALESCE(EXCLUDED.avatar_url, contributors.avatar_url),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating contributor:', error)
    return NextResponse.json(
      { error: 'Failed to create contributor' },
      { status: 500 }
    )
  }
}
