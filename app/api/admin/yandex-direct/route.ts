import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'
import {
  getConfigStatus,
  getCampaigns,
  createCampaign,
  YandexDirectError,
} from '@/lib/yandex-direct'
import { logYandexAction, getRecentYandexLogs } from '@/lib/db/yandex-direct'

// GET /api/admin/yandex-direct - config status + campaigns + recent audit logs
export async function GET(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  const config = getConfigStatus()
  const logs = await getRecentYandexLogs(20)

  if (!config.configured) {
    return NextResponse.json({
      config,
      campaigns: [],
      logs,
      error: 'Yandex Direct не настроен. Задайте переменную YANDEX_DIRECT_TOKEN.',
    })
  }

  try {
    const campaigns = await getCampaigns()
    return NextResponse.json({ config, campaigns, logs, error: null })
  } catch (error) {
    const message =
      error instanceof YandexDirectError
        ? error.message
        : 'Не удалось получить кампании Yandex Direct'
    console.error('[YandexDirect] getCampaigns failed:', error)
    return NextResponse.json({ config, campaigns: [], logs, error: message })
  }
}

// POST /api/admin/yandex-direct - create a campaign
export async function POST(request: NextRequest) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  let body: { name?: string; startDate?: string; dailyBudgetAmount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  const name = body.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Укажите название кампании' }, { status: 400 })
  }

  // Validate / default the start date (Direct requires YYYY-MM-DD, today or later).
  const today = new Date().toISOString().slice(0, 10)
  const startDate =
    body.startDate && /^\d{4}-\d{2}-\d{2}$/.test(body.startDate) ? body.startDate : today

  const dailyBudgetAmount =
    typeof body.dailyBudgetAmount === 'number' && body.dailyBudgetAmount > 0
      ? body.dailyBudgetAmount
      : undefined

  try {
    const id = await createCampaign({ name, startDate, dailyBudgetAmount })
    await logYandexAction({
      action: 'create',
      campaignId: id,
      campaignName: name,
      success: true,
      details: { startDate, dailyBudgetAmount },
    })
    return NextResponse.json({ success: true, id })
  } catch (error) {
    const message =
      error instanceof YandexDirectError ? error.message : 'Не удалось создать кампанию'
    await logYandexAction({
      action: 'create',
      campaignName: name,
      success: false,
      errorMessage: message,
    })
    const status = error instanceof YandexDirectError && error.code === 0 ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
