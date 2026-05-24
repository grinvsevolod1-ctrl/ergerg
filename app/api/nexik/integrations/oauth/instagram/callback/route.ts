import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // org_id
  const error = searchParams.get('error')

  if (error) {
    console.error('[Instagram OAuth] Error:', error)
    return NextResponse.redirect(new URL('/nexik/dashboard?error=instagram_auth_failed', request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/nexik/dashboard?error=missing_code', request.url))
  }

  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || ''
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || ''
  const REDIRECT_URI = `${process.env.NEXIK_APP_URL}/api/nexik/integrations/oauth/instagram/callback`

  try {
    // Обмен code на access_token
    const tokenRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`)
    const tokenData = await tokenRes.json()

    if (!tokenData.access_token) {
      throw new Error('No access token')
    }

    // Получаем долгоживущий токен
    const longLivedRes = await fetch(`https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`)
    const longLivedData = await longLivedRes.json()
    const accessToken = longLivedData.access_token || tokenData.access_token

    // Получаем страницы пользователя
    const pagesRes = await fetch(`https://graph.facebook.com/v20.0/me/accounts?access_token=${accessToken}`)
    const pagesData = await pagesRes.json()

    // Ищем Instagram бизнес аккаунт
    let instagramId = null
    let pageId = null
    let pageAccessToken = null

    for (const page of pagesData.data || []) {
      const pageInfoRes = await fetch(`https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account,access_token&access_token=${accessToken}`)
      const pageInfo = await pageInfoRes.json()
      
      if (pageInfo.instagram_business_account?.id) {
        instagramId = pageInfo.instagram_business_account.id
        pageId = page.id
        pageAccessToken = pageInfo.access_token
        break
      }
    }

    if (!instagramId) {
      return NextResponse.redirect(new URL('/nexik/dashboard?error=no_instagram_business_account', request.url))
    }

    // Сохраняем интеграцию в БД
    await query(
      `INSERT INTO nexik_integrations (org_id, platform, platform_id, access_token, refresh_token, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (org_id, platform) DO UPDATE 
       SET platform_id = EXCLUDED.platform_id, access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, is_active = true, updated_at = NOW()`,
      [state, 'instagram', instagramId, pageAccessToken, accessToken]
    )

    // Подписываемся на webhook
    await fetch(`https://graph.facebook.com/v20.0/${instagramId}/subscribed_apps?access_token=${pageAccessToken}&subscribed_fields=messages,messaging_postbacks`, {
      method: 'POST'
    })

    return NextResponse.redirect(new URL('/nexik/dashboard?instagram=connected', request.url))
  } catch (err) {
    console.error('[Instagram OAuth Callback] Error:', err)
    return NextResponse.redirect(new URL('/nexik/dashboard?error=instagram_auth_failed', request.url))
  }
}
