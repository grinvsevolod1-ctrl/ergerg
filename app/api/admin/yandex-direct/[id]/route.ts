import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'
import {
  campaignAction,
  updateCampaign,
  YandexDirectError,
  type CampaignAction,
} from '@/lib/yandex-direct'
import { logYandexAction } from '@/lib/db/yandex-direct'

const VALID_ACTIONS: CampaignAction[] = ['suspend', 'resume', 'archive', 'unarchive', 'delete']

function parseId(raw: string): number | null {
  const id = Number(raw)
  return Number.isInteger(id) && id > 0 ? id : null
}

// PATCH /api/admin/yandex-direct/[id] - lifecycle action OR field update
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Некорректный ID кампании' }, { status: 400 })
  }

  let body: {
    action?: string
    name?: string
    dailyBudgetAmount?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 })
  }

  // Field update branch (no action provided)
  if (!body.action && (body.name !== undefined || body.dailyBudgetAmount !== undefined)) {
    try {
      await updateCampaign({ id, name: body.name?.trim(), dailyBudgetAmount: body.dailyBudgetAmount })
      await logYandexAction({
        action: 'update',
        campaignId: id,
        campaignName: body.name?.trim() ?? null,
        success: true,
        details: { dailyBudgetAmount: body.dailyBudgetAmount },
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      const message =
        error instanceof YandexDirectError ? error.message : 'Не удалось обновить кампанию'
      await logYandexAction({
        action: 'update',
        campaignId: id,
        success: false,
        errorMessage: message,
      })
      const status = error instanceof YandexDirectError && error.code === 0 ? 503 : 502
      return NextResponse.json({ error: message }, { status })
    }
  }

  const action = body.action as CampaignAction | undefined
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 })
  }

  try {
    await campaignAction(action, id)
    await logYandexAction({ action, campaignId: id, success: true })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof YandexDirectError ? error.message : 'Действие не выполнено'
    await logYandexAction({ action, campaignId: id, success: false, errorMessage: message })
    const status = error instanceof YandexDirectError && error.code === 0 ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}

// DELETE /api/admin/yandex-direct/[id] - delete a campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) {
    return NextResponse.json({ error: 'Некорректный ID кампании' }, { status: 400 })
  }

  try {
    await campaignAction('delete', id)
    await logYandexAction({ action: 'delete', campaignId: id, success: true })
    return NextResponse.json({ success: true })
  } catch (error) {
    const message =
      error instanceof YandexDirectError ? error.message : 'Не удалось удалить кампанию'
    await logYandexAction({ action: 'delete', campaignId: id, success: false, errorMessage: message })
    const status = error instanceof YandexDirectError && error.code === 0 ? 503 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
