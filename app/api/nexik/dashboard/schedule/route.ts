import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [schedule] = await query<{
      id: string
      mode: string
      work_hours: { start: string; end: string }
      work_days: string[]
      timezone: string
      custom_schedule: Record<string, unknown> | null
    }>(`
      SELECT id, mode, work_hours, work_days, timezone, custom_schedule
      FROM nexik_schedules
      WHERE org_id = $1 AND widget_id IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `, [session.org.id])

    if (!schedule) {
      return NextResponse.json({
        success: true,
        schedule: {
          mode: 'ai_only',
          workHours: { start: '09:00', end: '18:00' },
          workDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
          timezone: 'Europe/Moscow'
        }
      })
    }

    return NextResponse.json({
      success: true,
      schedule: {
        id: schedule.id,
        mode: schedule.mode,
        workHours: schedule.work_hours,
        workDays: schedule.work_days,
        timezone: schedule.timezone,
        customSchedule: schedule.custom_schedule
      }
    })
  } catch (error) {
    console.error('[Schedule API] GET error:', error)
    return NextResponse.json({ error: 'Failed to load schedule' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode, workHours, workDays, timezone, customSchedule } = await req.json()

    // Validate mode
    if (!['ai_only', 'operator_only', 'hybrid'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    // Check if schedule exists
    const [existing] = await query<{ id: string }>(`
      SELECT id FROM nexik_schedules
      WHERE org_id = $1 AND widget_id IS NULL
      LIMIT 1
    `, [session.org.id])

    if (existing) {
      // Update existing
      await query(`
        UPDATE nexik_schedules
        SET mode = $1, work_hours = $2, work_days = $3, timezone = $4, custom_schedule = $5, updated_at = NOW()
        WHERE id = $6
      `, [
        mode,
        JSON.stringify(workHours),
        workDays,
        timezone,
        customSchedule ? JSON.stringify(customSchedule) : null,
        existing.id
      ])
    } else {
      // Create new
      await query(`
        INSERT INTO nexik_schedules (org_id, mode, work_hours, work_days, timezone, custom_schedule)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        session.org.id,
        mode,
        JSON.stringify(workHours),
        workDays,
        timezone,
        customSchedule ? JSON.stringify(customSchedule) : null
      ])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Schedule API] POST error:', error)
    return NextResponse.json({ error: 'Failed to save schedule' }, { status: 500 })
  }
}
