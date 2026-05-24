import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'

// GET - получить исключения
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const searchParams = request.nextUrl.searchParams
  const integrationId = searchParams.get('integration_id')
  
  const exceptions = await query<{
    id: string
    integration_id: string
    exception_type: string
    value: string
    mode: string
    description: string
    is_active: boolean
    created_at: Date
  }>(
    integrationId
      ? `SELECT * FROM nexik_telegram_exceptions 
         WHERE org_id = $1 AND integration_id = $2 
         ORDER BY created_at DESC`
      : `SELECT * FROM nexik_telegram_exceptions 
         WHERE org_id = $1 
         ORDER BY created_at DESC`,
    integrationId ? [orgId, integrationId] : [orgId]
  )
  
  return NextResponse.json({ exceptions })
}

// POST - добавить исключение
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const body = await request.json()
  const { integration_id, exception_type, value, mode = 'ignore', description } = body
  
  if (!exception_type || !value) {
    return NextResponse.json({ error: 'exception_type and value required' }, { status: 400 })
  }
  
  const validTypes = ['user', 'chat', 'keyword', 'phrase', 'regex']
  if (!validTypes.includes(exception_type)) {
    return NextResponse.json({ error: 'Invalid exception_type' }, { status: 400 })
  }
  
  // Validate regex if needed
  if (exception_type === 'regex') {
    try {
      new RegExp(value)
    } catch {
      return NextResponse.json({ error: 'Invalid regex pattern' }, { status: 400 })
    }
  }
  
  const result = await query<{ id: string }>(
    `INSERT INTO nexik_telegram_exceptions (
      org_id, integration_id, exception_type, value, value_normalized, mode, description
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (org_id, integration_id, exception_type, value) 
    DO UPDATE SET mode = EXCLUDED.mode, description = EXCLUDED.description, is_active = true
    RETURNING id`,
    [
      orgId,
      integration_id || null,
      exception_type,
      value,
      value.toLowerCase(),
      mode,
      description || null
    ]
  )
  
  return NextResponse.json({ success: true, id: result[0].id })
}

// DELETE - удалить исключение
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const searchParams = request.nextUrl.searchParams
  const exceptionId = searchParams.get('id')
  
  if (!exceptionId) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  
  await execute(
    `DELETE FROM nexik_telegram_exceptions WHERE id = $1 AND org_id = $2`,
    [exceptionId, orgId]
  )
  
  return NextResponse.json({ success: true })
}

// PATCH - обновить статус исключения
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member.org_id
  const body = await request.json()
  const { id, is_active } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }
  
  await execute(
    `UPDATE nexik_telegram_exceptions SET is_active = $1 WHERE id = $2 AND org_id = $3`,
    [is_active, id, orgId]
  )
  
  return NextResponse.json({ success: true })
}
