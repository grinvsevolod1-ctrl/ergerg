import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'
import crypto from 'crypto'

// Generate a secure API key
function generateApiKey(): string {
  const prefix = 'nxk_live_'
  const randomBytes = crypto.randomBytes(24).toString('base64url')
  return prefix + randomBytes
}

// Hash API key for storage (we only store hash, not the key itself)
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const keys = await query<{
      id: string
      name: string
      key_preview: string
      permissions: string[]
      created_at: string
      last_used_at: string | null
    }>(`
      SELECT id, name, key_preview, permissions, created_at, last_used_at
      FROM nexik_api_keys
      WHERE org_id = $1 AND revoked_at IS NULL
      ORDER BY created_at DESC
    `, [session.org.id])

    return NextResponse.json({
      success: true,
      keys: keys.map(k => ({
        id: k.id,
        name: k.name,
        keyPreview: k.key_preview,
        permissions: k.permissions || ['read', 'write'],
        createdAt: k.created_at,
        lastUsedAt: k.last_used_at
      }))
    })
  } catch (error) {
    console.error('[API Keys] GET error:', error)
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await req.json()
    
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Название ключа должно быть минимум 2 символа' }, { status: 400 })
    }

    // Check limit (max 10 keys per org)
    const [countResult] = await query<{ count: string }>(`
      SELECT COUNT(*) as count FROM nexik_api_keys
      WHERE org_id = $1 AND revoked_at IS NULL
    `, [session.org.id])
    
    if (parseInt(countResult?.count || '0') >= 10) {
      return NextResponse.json({ error: 'Достигнут лимит ключей (максимум 10)' }, { status: 400 })
    }

    // Generate new key
    const apiKey = generateApiKey()
    const keyHash = hashApiKey(apiKey)
    const keyPreview = apiKey.slice(0, 12) + '...' + apiKey.slice(-4)

    // Save to database
    const [created] = await query<{ id: string }>(`
      INSERT INTO nexik_api_keys (org_id, name, key_hash, key_preview, permissions, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [session.org.id, name.trim(), keyHash, keyPreview, ['read', 'write'], session.member.id])

    return NextResponse.json({
      success: true,
      id: created.id,
      key: apiKey,  // Return full key only once
      keyPreview
    })
  } catch (error) {
    console.error('[API Keys] POST error:', error)
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')
    
    if (!keyId) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    // Soft delete - set revoked_at
    await query(`
      UPDATE nexik_api_keys 
      SET revoked_at = NOW(), revoked_by = $1
      WHERE id = $2 AND org_id = $3 AND revoked_at IS NULL
    `, [session.member.id, keyId, session.org.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Keys] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}
