import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query, execute } from '@/lib/db'
import { getOrgMembers, createOrgMember } from '@/lib/nexik/db/organizations'
import bcrypt from 'bcryptjs'

// Helper to get session from cookie
async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('nexik_session')?.value
  
  if (!sessionToken) return null
  
  try {
    const payload = JSON.parse(atob(sessionToken.split('.')[1]))
    return {
      memberId: payload.memberId,
      orgId: payload.orgId,
      email: payload.email,
      role: payload.role
    }
  } catch {
    return null
  }
}

// GET - list team members
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const members = await getOrgMembers(session.orgId)
    
    // Remove sensitive data
    const safeMembers = members.map(m => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      avatar_url: m.avatar_url,
      email_verified: m.email_verified,
      last_login_at: m.last_login_at,
      created_at: m.created_at
    }))

    return NextResponse.json({ 
      success: true, 
      members: safeMembers,
      currentUserId: session.memberId
    })
  } catch (error) {
    console.error('[Team API] GET error:', error)
    return NextResponse.json({ error: 'Failed to load team' }, { status: 500 })
  }
}

// POST - invite new member
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner/admin can invite
    if (!['owner', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { email, name, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role required' }, { status: 400 })
    }

    // Validate role
    if (!['admin', 'operator', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if member already exists
    const existing = await query(
      'SELECT id FROM nexik_org_members WHERE org_id = $1 AND email = $2',
      [session.orgId, email.toLowerCase()]
    )

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Member already exists' }, { status: 409 })
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-10)
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Create member
    const member = await createOrgMember({
      org_id: session.orgId,
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name: name || null,
      role: role as 'admin' | 'operator' | 'member'
    })

    // TODO: Send invitation email with temp password

    return NextResponse.json({ 
      success: true, 
      member: {
        id: member.id,
        email: member.email,
        name: member.name,
        role: member.role,
        created_at: member.created_at
      },
      tempPassword // Only shown once, should be sent via email
    })
  } catch (error) {
    console.error('[Team API] POST error:', error)
    return NextResponse.json({ error: 'Failed to invite member' }, { status: 500 })
  }
}

// PATCH - update member role
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner can change roles
    if (session.role !== 'owner') {
      return NextResponse.json({ error: 'Only owner can change roles' }, { status: 403 })
    }

    const { memberId, role } = await req.json()

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Member ID and role required' }, { status: 400 })
    }

    // Cannot change owner role
    const targetMember = await query<{ role: string }>(
      'SELECT role FROM nexik_org_members WHERE id = $1 AND org_id = $2',
      [memberId, session.orgId]
    )

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot change owner role' }, { status: 400 })
    }

    // Validate new role
    if (!['admin', 'operator', 'member'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    await execute(
      'UPDATE nexik_org_members SET role = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3',
      [role, memberId, session.orgId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team API] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

// DELETE - remove member
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owner/admin can remove
    if (!['owner', 'admin'].includes(session.role)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 })
    }

    // Cannot remove yourself
    if (memberId === session.memberId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 })
    }

    // Cannot remove owner
    const targetMember = await query<{ role: string }>(
      'SELECT role FROM nexik_org_members WHERE id = $1 AND org_id = $2',
      [memberId, session.orgId]
    )

    if (!targetMember.length) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    if (targetMember[0].role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove owner' }, { status: 400 })
    }

    // Admin cannot remove another admin
    if (session.role === 'admin' && targetMember[0].role === 'admin') {
      return NextResponse.json({ error: 'Admin cannot remove another admin' }, { status: 403 })
    }

    await execute(
      'DELETE FROM nexik_org_members WHERE id = $1 AND org_id = $2',
      [memberId, session.orgId]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Team API] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
  }
}
