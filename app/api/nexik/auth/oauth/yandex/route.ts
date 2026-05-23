import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const state = searchParams.get('state') || ''
  
  const clientId = process.env.YANDEX_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Yandex OAuth not configured' }, { status: 500 })
  }
  
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nexik.org'}/api/nexik/auth/callback/yandex`
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  })
  
  return NextResponse.redirect(`https://oauth.yandex.ru/authorize?${params.toString()}`)
}
