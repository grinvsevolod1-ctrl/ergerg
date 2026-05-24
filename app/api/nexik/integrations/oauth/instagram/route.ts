import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/nexik/login', request.url))
  }

  // Facebook App ID (замени на свои)
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
  const REDIRECT_URI = `${process.env.NEXIK_APP_URL}/api/nexik/integrations/oauth/instagram/callback`
  
  // Scopes для Instagram Business API
  const scope = [
    'instagram_basic',
    'instagram_manage_messages',
    'instagram_manage_comments',
    'pages_manage_metadata',
    'pages_read_engagement',
    'pages_manage_engagement',
    'public_profile'
  ].join(',')

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}&state=${session.member.org_id}&response_type=code`

  return NextResponse.redirect(authUrl)
}
