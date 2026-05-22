import { neon } from '@neondatabase/serverless'
import { NextRequest, NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const contributorId = searchParams.get('contributor_id')
    const repositoryId = searchParams.get('repository_id')
    const type = searchParams.get('type')
    
    // Validate activity type
    const validTypes = ['commit', 'pull_request', 'issue', 'review', 'merge']
    const safeType = type && validTypes.includes(type) ? type : null
    
    let activities
    
    if (contributorId && repositoryId && safeType) {
      activities = await sql`
        SELECT 
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
        WHERE a.contributor_id = ${parseInt(contributorId)}
          AND a.repository_id = ${parseInt(repositoryId)}
          AND a.type = ${safeType}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (contributorId && repositoryId) {
      activities = await sql`
        SELECT 
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
        WHERE a.contributor_id = ${parseInt(contributorId)}
          AND a.repository_id = ${parseInt(repositoryId)}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (contributorId) {
      activities = await sql`
        SELECT 
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
        WHERE a.contributor_id = ${parseInt(contributorId)}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (repositoryId) {
      activities = await sql`
        SELECT 
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
        WHERE a.repository_id = ${parseInt(repositoryId)}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else if (safeType) {
      activities = await sql`
        SELECT 
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
        WHERE a.type = ${safeType}
        ORDER BY a.created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      activities = await sql`
        SELECT 
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
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }
    
    // Get total count
    const countResult = await sql`
      SELECT COUNT(*)::int as total FROM activity_log
    `
    
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
    console.error('[v0] Error fetching activities:', error)
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
    
    const result = await sql`
      INSERT INTO activity_log (contributor_id, repository_id, type, title, description, url, metadata)
      VALUES (
        ${contributor_id}, 
        ${repository_id}, 
        ${type}, 
        ${title}, 
        ${description || null}, 
        ${url || null}, 
        ${metadata ? JSON.stringify(metadata) : null}
      )
      RETURNING *
    `
    
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    )
  }
}
