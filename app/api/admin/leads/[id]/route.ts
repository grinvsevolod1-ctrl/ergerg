import { NextRequest, NextResponse } from 'next/server'
import { getLeadWithChatSession, updateLeadStatus, deleteLeadData } from '@/lib/db/leads'
import { verifyAdminSession, unauthorizedResponse } from '@/lib/admin-auth'

// GET /api/admin/leads/[id] - Get lead details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    const lead = await getLeadWithChatSession(id)
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Error fetching lead:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/leads/[id] - Update lead
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
    const { status } = body

    if (status) {
      if (!['new', 'in_progress', 'completed', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      await updateLeadStatus(id, status)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/leads/[id] - Anonymize lead data (GDPR)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession(request))) {
    return unauthorizedResponse()
  }

  try {
    const { id } = await params
    await deleteLeadData(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    )
  }
}
