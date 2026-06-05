import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { v4 as uuid } from 'uuid'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { getJwtSecret, SESSION_CONFIG } from '@/lib/nexik/config/jwt'

const BCRYPT_ROUNDS = 12

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (action === 'create_widget') {
      const { businessDescription, businessName, email, password, websiteUrl } = data

      if (!email) {
        return NextResponse.json({ error: 'Email обязателен' }, { status: 400 })
      }

      const userPassword = password || Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
      const passwordHash = await bcrypt.hash(userPassword, BCRYPT_ROUNDS)

      const orgId = uuid()
      const memberId = uuid()
      const widgetId = uuid() // Используем UUID вместо nxk_
      const apiKey = `nxk_live_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`

      await query(`
        INSERT INTO nexik_organizations (id, name, owner_email, business_description, plan, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [orgId, businessName || 'Мой бизнес', email, businessDescription, 'free'])

      await query(`
        INSERT INTO nexik_api_keys (id, org_id, key_hash, key_prefix, name, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [uuid(), orgId, apiKey, apiKey.slice(0, 12), 'Default Key'])

      await query(`
        INSERT INTO nexik_widgets (id, org_id, name, welcome_message, ai_enabled, theme, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [
        widgetId,
        orgId,
        businessName || 'Мой виджет',
        'Здравствуйте! Чем могу помочь?',
        true,
        JSON.stringify({ position: 'bottom-right', primaryColor: '#00ffff', theme: 'dark' })
      ])

      await query(`
        INSERT INTO nexik_org_members (id, org_id, email, password_hash, name, role, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [memberId, orgId, email.toLowerCase(), passwordHash, businessName || 'Владелец', 'owner'])

      const token = await new SignJWT({
        memberId: memberId,
        orgId: orgId,
        email: email.toLowerCase(),
        role: 'owner'
      })
        .setProtectedHeader({ alg: SESSION_CONFIG.algorithm })
        .setIssuedAt()
        .setExpirationTime(SESSION_CONFIG.expirationTime)
        .sign(getJwtSecret())

      const cookieStore = await cookies()
      cookieStore.set(SESSION_CONFIG.cookieName, token, {
        ...SESSION_CONFIG.cookieOptions,
        maxAge: SESSION_CONFIG.maxAge
      })

      return NextResponse.json({
        success: true,
        widget: {
          id: widgetId,
          embedCode: `<script src="https://nexik.org/nexik/widget.js" data-id="${widgetId}"></script>`
        },
        credentials: {
          email: email.toLowerCase(),
          password: userPassword
        }
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('[Onboarding API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
