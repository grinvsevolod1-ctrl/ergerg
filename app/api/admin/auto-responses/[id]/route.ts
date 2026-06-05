import { NextRequest, NextResponse } from 'next/server'
import {
  getAutoResponseById,
  updateAutoResponse,
  deleteAutoResponse,
  updateQuickReply,
  deleteQuickReply,
} from '@/lib/db/auto-responses'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'

// GET /api/admin/auto-responses/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const rule = await getAutoResponseById(id)
    
    if (!rule) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error fetching auto-response:', error)
    return NextResponse.json(
      { error: 'Failed to fetch auto-response' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/auto-responses/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { type } = body

    if (type === 'quick-reply') {
      const result = await updateQuickReply(id, body)
      if (!result) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    const result = await updateAutoResponse(id, body)
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating auto-response:', error)
    return NextResponse.json(
      { error: 'Failed to update auto-response' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/auto-responses/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'quick-reply') {
      await deleteQuickReply(id)
    } else {
      await deleteAutoResponse(id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting auto-response:', error)
    return NextResponse.json(
      { error: 'Failed to delete auto-response' },
      { status: 500 }
    )
  }
}
