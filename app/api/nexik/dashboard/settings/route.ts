import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { org_id } = session.member

    const result = await query<{ ai_config: any }>(
      'SELECT ai_config FROM nexik_organizations WHERE id = $1',
      [org_id]
    )

    const aiConfig = result[0]?.ai_config || {}

    return NextResponse.json({
      botName: aiConfig.bot_name || 'Nexik',
      greeting: aiConfig.greeting || 'Привет! Чем могу помочь?',
      tone: aiConfig.tone || 'friendly',
      companyName: aiConfig.company_name || '',
      industry: aiConfig.industry || '',
      businessDescription: aiConfig.business_description || ''
    })
  } catch (error) {
    console.error('[Settings GET] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { org_id } = session.member
    const body = await request.json()

    // Получаем текущий ai_config
    const current = await query<{ ai_config: any }>(
      'SELECT ai_config FROM nexik_organizations WHERE id = $1',
      [org_id]
    )
    const currentConfig = current[0]?.ai_config || {}

    // Обновляем
    const newConfig = {
      ...currentConfig,
      bot_name: body.botName || currentConfig.bot_name || 'Nexik',
      greeting: body.greeting || currentConfig.greeting || 'Привет! Чем могу помочь?',
      tone: body.tone || currentConfig.tone || 'friendly',
      company_name: body.companyName || currentConfig.company_name || '',
      industry: body.industry || currentConfig.industry || '',
      business_description: body.businessDescription || currentConfig.business_description || ''
    }

    await query(
      `UPDATE nexik_organizations SET ai_config = $1, updated_at = NOW() WHERE id = $2`,
      [newConfig, org_id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Settings POST] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
