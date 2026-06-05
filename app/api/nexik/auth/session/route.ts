import { NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ session: null }, { status: 401 })
    }

    return NextResponse.json({ 
      session: {
        member: {
          id: session.member.id,
          org_id: session.member.org_id,
          email: session.member.email,
          name: session.member.name,
          role: session.member.role,
          avatar_url: session.member.avatar_url,
          created_at: session.member.created_at,
          last_login_at: session.member.last_login_at
        },
        org: {
          id: session.org.id,
          name: session.org.name,
          slug: session.org.slug,
          plan: session.org.plan,
          ai_config: session.org.ai_config,
          created_at: session.org.created_at
        }
      }
    })
  } catch (error) {
    console.error('[Nexik Session API] Error:', error)
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 })
  }
}
