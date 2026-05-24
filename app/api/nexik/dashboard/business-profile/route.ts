import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query, execute } from '@/lib/db'

// GET - получить бизнес-профиль
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member?.org_id || session.org?.id
  
  const profiles = await query<{
    id: string
    business_name: string
    business_type: string
    industry: string
    short_description: string
    full_description: string
    services: string[]
    products: string[]
    target_audience: string
    pain_points: string[]
    goals: string[]
    brand_voice: string
    contact_email: string
    contact_phone: string
    website_url: string
    working_hours: Record<string, unknown>
    faq: Array<{ question: string; answer: string }>
    ai_learned_facts: Array<{ fact: string; source: string; timestamp: string }>
    ai_conversation_summary: string
    onboarding_completed: boolean
    onboarding_step: number
  }>(
    `SELECT * FROM nexik_business_profiles WHERE org_id = $1`,
    [orgId]
  )
  
  if (!profiles[0]) {
    // Create empty profile
    await execute(
      `INSERT INTO nexik_business_profiles (org_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [orgId]
    )
    return NextResponse.json({ profile: null, needsSetup: true })
  }
  
  return NextResponse.json({ 
    profile: profiles[0],
    needsSetup: !profiles[0].onboarding_completed
  })
}

// PUT - обновить бизнес-профиль
export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const orgId = session.member?.org_id || session.org?.id
  const body = await request.json()
  
  const {
    business_name,
    business_type,
    industry,
    short_description,
    full_description,
    services,
    products,
    target_audience,
    pain_points,
    goals,
    brand_voice,
    contact_email,
    contact_phone,
    website_url,
    working_hours,
    faq,
    onboarding_completed,
    onboarding_step
  } = body
  
  await execute(
    `INSERT INTO nexik_business_profiles (
      org_id, business_name, business_type, industry, short_description, full_description,
      services, products, target_audience, pain_points, goals, brand_voice,
      contact_email, contact_phone, website_url, working_hours, faq,
      onboarding_completed, onboarding_step, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
    ON CONFLICT (org_id) DO UPDATE SET
      business_name = COALESCE(EXCLUDED.business_name, nexik_business_profiles.business_name),
      business_type = COALESCE(EXCLUDED.business_type, nexik_business_profiles.business_type),
      industry = COALESCE(EXCLUDED.industry, nexik_business_profiles.industry),
      short_description = COALESCE(EXCLUDED.short_description, nexik_business_profiles.short_description),
      full_description = COALESCE(EXCLUDED.full_description, nexik_business_profiles.full_description),
      services = COALESCE(EXCLUDED.services, nexik_business_profiles.services),
      products = COALESCE(EXCLUDED.products, nexik_business_profiles.products),
      target_audience = COALESCE(EXCLUDED.target_audience, nexik_business_profiles.target_audience),
      pain_points = COALESCE(EXCLUDED.pain_points, nexik_business_profiles.pain_points),
      goals = COALESCE(EXCLUDED.goals, nexik_business_profiles.goals),
      brand_voice = COALESCE(EXCLUDED.brand_voice, nexik_business_profiles.brand_voice),
      contact_email = COALESCE(EXCLUDED.contact_email, nexik_business_profiles.contact_email),
      contact_phone = COALESCE(EXCLUDED.contact_phone, nexik_business_profiles.contact_phone),
      website_url = COALESCE(EXCLUDED.website_url, nexik_business_profiles.website_url),
      working_hours = COALESCE(EXCLUDED.working_hours, nexik_business_profiles.working_hours),
      faq = COALESCE(EXCLUDED.faq, nexik_business_profiles.faq),
      onboarding_completed = COALESCE(EXCLUDED.onboarding_completed, nexik_business_profiles.onboarding_completed),
      onboarding_step = COALESCE(EXCLUDED.onboarding_step, nexik_business_profiles.onboarding_step),
      updated_at = NOW()`,
    [
      orgId,
      business_name || null,
      business_type || null,
      industry || null,
      short_description || null,
      full_description || null,
      services || null,
      products || null,
      target_audience || null,
      pain_points || null,
      goals || null,
      brand_voice || null,
      contact_email || null,
      contact_phone || null,
      website_url || null,
      working_hours ? JSON.stringify(working_hours) : null,
      faq ? JSON.stringify(faq) : null,
      onboarding_completed ?? null,
      onboarding_step ?? null
    ]
  )
  
  return NextResponse.json({ success: true })
}
