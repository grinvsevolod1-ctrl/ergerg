/**
 * Mailing Campaigns API
 * Admin-only endpoints for managing email campaigns
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaignStatus,
  deleteCampaign,
  addRecipients,
  getRecipients,
} from '@/lib/mailings/database'
import { queueCampaignProcessing, getQueueStats } from '@/lib/mailings/queue'
import { verifyConnection } from '@/lib/mailings/sender'
import { validateMailingConfig } from '@/lib/mailings/config'

// Simple admin auth check (you should use proper auth in production)
function isAdmin(req: NextRequest): boolean {
  const adminToken = process.env.ADMIN_API_TOKEN
  if (!adminToken) return false
  
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  
  return authHeader.slice(7) === adminToken
}

// GET - List campaigns
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    const campaigns = await getCampaigns(status, limit)
    const queueStats = await getQueueStats().catch(() => null)

    return NextResponse.json({
      campaigns,
      queueStats,
    })
  } catch (error) {
    console.error('Failed to get campaigns:', error)
    return NextResponse.json({ error: 'Failed to get campaigns' }, { status: 500 })
  }
}

// POST - Create campaign or perform action
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    // Verify config first
    const configCheck = validateMailingConfig()
    if (!configCheck.valid) {
      return NextResponse.json({
        error: 'Mailing system not configured',
        details: configCheck.errors,
      }, { status: 400 })
    }

    switch (action) {
      case 'create': {
        const { name, subject, htmlContent, textContent } = body
        
        if (!name || !subject || !htmlContent) {
          return NextResponse.json({
            error: 'Missing required fields: name, subject, htmlContent',
          }, { status: 400 })
        }

        const campaign = await createCampaign(name, subject, htmlContent, textContent)
        return NextResponse.json({ campaign })
      }

      case 'add_recipients': {
        const { campaignId, recipients } = body
        
        if (!campaignId || !recipients?.length) {
          return NextResponse.json({
            error: 'Missing campaignId or recipients',
          }, { status: 400 })
        }

        const count = await addRecipients(campaignId, recipients)
        return NextResponse.json({ added: count })
      }

      case 'start': {
        const { campaignId } = body
        
        if (!campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }

        // Verify SMTP connection
        const connected = await verifyConnection()
        if (!connected) {
          return NextResponse.json({
            error: 'SMTP connection failed. Check your email configuration.',
          }, { status: 500 })
        }

        // Start campaign
        await updateCampaignStatus(campaignId, 'sending', { started_at: new Date() })
        await queueCampaignProcessing(campaignId)

        return NextResponse.json({ started: true })
      }

      case 'pause': {
        const { campaignId } = body
        await updateCampaignStatus(campaignId, 'paused')
        return NextResponse.json({ paused: true })
      }

      case 'resume': {
        const { campaignId } = body
        await updateCampaignStatus(campaignId, 'sending')
        await queueCampaignProcessing(campaignId)
        return NextResponse.json({ resumed: true })
      }

      case 'delete': {
        const { campaignId } = body
        await deleteCampaign(campaignId)
        return NextResponse.json({ deleted: true })
      }

      case 'get_details': {
        const { campaignId } = body
        if (!campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }
        const campaign = await getCampaign(campaignId)
        if (!campaign) {
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        const recipients = await getRecipients(campaignId, undefined, 100)
        return NextResponse.json({ campaign, recipients })
      }

      case 'update': {
        const { campaignId, name, subject, htmlContent, textContent } = body
        if (!campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }
        
        // Update campaign in database
        const { query } = await import('@/lib/db')
        const updates: string[] = []
        const values: unknown[] = []
        let paramIndex = 1
        
        if (name) {
          updates.push(`name = $${paramIndex++}`)
          values.push(name)
        }
        if (subject) {
          updates.push(`subject = $${paramIndex++}`)
          values.push(subject)
        }
        if (htmlContent) {
          updates.push(`html_content = $${paramIndex++}`)
          values.push(htmlContent)
        }
        if (textContent !== undefined) {
          updates.push(`text_content = $${paramIndex++}`)
          values.push(textContent)
        }
        
        if (updates.length > 0) {
          updates.push(`updated_at = NOW()`)
          values.push(campaignId)
          await query(
            `UPDATE mailing_campaigns SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
            values
          )
        }
        
        return NextResponse.json({ updated: true })
      }

      case 'duplicate': {
        const { campaignId } = body
        if (!campaignId) {
          return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 })
        }
        
        // Get original campaign
        const original = await getCampaign(campaignId)
        if (!original) {
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
        
        // Create duplicate with modified name
        const newCampaign = await createCampaign(
          `${original.name} (копия)`,
          original.subject,
          original.html_content,
          original.text_content
        )
        
        return NextResponse.json({ campaign: newCampaign })
      }

      case 'test_connection': {
        const connected = await verifyConnection()
        return NextResponse.json({ connected })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Mailing API error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal error',
    }, { status: 500 })
  }
}
