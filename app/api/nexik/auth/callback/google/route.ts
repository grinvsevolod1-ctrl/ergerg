import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'
import { JWT_SECRET, SESSION_CONFIG } from '@/lib/nexik/config/jwt'
import { query } from '@/lib/db'

interface GoogleTokenResponse {
  access_token: string
  id_token: string
  expires_in: number
  token_type: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name: string
  picture: string
}

export async function GET(request: NextRequest) {
  // Dynamic base URL from request
  const host = request.headers.get('host') || 'nexik.org'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`
  
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(`${baseUrl}/nexik/register?error=oauth_denied`)
    }
    
    if (!code) {
      return NextResponse.redirect(`${baseUrl}/nexik/register?error=no_code`)
    }
    
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${baseUrl}/nexik/register?error=not_configured`)
    }
    
    const redirectUri = `${baseUrl}/api/nexik/auth/callback/google`
    
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    
    if (!tokenRes.ok) {
      console.error('[Google OAuth] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${baseUrl}/nexik/register?error=token_failed`)
    }
    
    const tokens: GoogleTokenResponse = await tokenRes.json()
    
    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    
    if (!userRes.ok) {
      return NextResponse.redirect(`${baseUrl}/nexik/register?error=userinfo_failed`)
    }
    
    const googleUser: GoogleUserInfo = await userRes.json()
    
    // Find or create user
    let user = null
    let org = null
    
    // Check if user exists
    const existingMembers = await query<{
      id: string
      org_id: string
      email: string
      name: string
      role: string
    }>(
      `SELECT m.*, o.name as org_name 
       FROM nexik_org_members m
       JOIN nexik_organizations o ON o.id = m.org_id
       WHERE m.email = $1`,
      [googleUser.email.toLowerCase()]
    )
    
    if (existingMembers.length > 0) {
      // Existing user - update google_id if not set
      user = existingMembers[0]
      
      await query(
        `UPDATE nexik_org_members 
         SET google_id = COALESCE(google_id, $1), 
             avatar_url = COALESCE(avatar_url, $2),
             last_login_at = NOW() 
         WHERE id = $3`,
        [googleUser.sub, googleUser.picture, user.id]
      )
      
      const orgs = await query<{ id: string; name: string }>(
        'SELECT id, name FROM nexik_organizations WHERE id = $1',
        [user.org_id]
      )
      org = orgs[0]
    } else {
      // New user - create org and member
      const orgResult = await query<{ id: string; name: string }>(
        `INSERT INTO nexik_organizations (id, name, owner_email, plan, created_at) 
         VALUES (gen_random_uuid(), $1, $2, 'free', NOW()) 
         RETURNING id, name`,
        [googleUser.name || `Организация ${googleUser.email.split('@')[0]}`, googleUser.email.toLowerCase()]
      )
      org = orgResult[0]
      
      const memberResult = await query<{
        id: string
        email: string
        name: string
        role: string
        org_id: string
      }>(
        `INSERT INTO nexik_org_members (id, org_id, email, name, role, google_id, avatar_url, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, 'owner', $4, $5, NOW()) 
         RETURNING id, email, name, role, org_id`,
        [org.id, googleUser.email.toLowerCase(), googleUser.name || googleUser.email.split('@')[0], googleUser.sub, googleUser.picture]
      )
      user = memberResult[0]
    }
    
    // Create JWT
    const token = await new SignJWT({
      memberId: user.id,
      orgId: org.id,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
      .setIssuedAt()
      .setExpirationTime(SESSION_CONFIG.expirationTime)
      .sign(JWT_SECRET)
    
    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_CONFIG.cookieName, token, {
      ...SESSION_CONFIG.cookieOptions,
      maxAge: SESSION_CONFIG.maxAge
    })
    
    // Parse state for redirect
    let redirectUrl = '/nexik/dashboard'
    if (state) {
      try {
        const stateData = JSON.parse(decodeURIComponent(state))
        if (stateData.platform) {
          redirectUrl = `/nexik/connect/${stateData.platform}`
        } else if (stateData.returnUrl) {
          redirectUrl = stateData.returnUrl
        }
      } catch {
        // Invalid state, use default redirect
      }
    }
    
    return NextResponse.redirect(`${baseUrl}${redirectUrl}`)
    
  } catch (error) {
    console.error('[Google OAuth] Error:', error)
    // Fallback to nexik.org if baseUrl not available in catch
    const host = request.headers.get('host') || 'nexik.org'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    return NextResponse.redirect(`${protocol}://${host}/nexik/register?error=server_error`)
  }
}
