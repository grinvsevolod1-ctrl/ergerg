import { NextRequest, NextResponse } from 'next/server'
import { trackEvent, saveVariantFeedback } from '@/lib/db/analytics'
import { sanitizeInput } from '@/lib/security'
import type { AnalyticsEvent } from '@/lib/site-analyzer/types'

interface TrackEventBody {
  sessionId: string
  eventType: AnalyticsEvent['eventType']
  eventData?: Record<string, unknown>
  leadId?: string
}

interface FeedbackBody {
  niche: string
  variantUrl: string
  feedback: 'like' | 'dislike'
  sessionId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Handle feedback
    if (body.feedback) {
      const feedbackBody = body as FeedbackBody
      
      if (!feedbackBody.niche || !feedbackBody.variantUrl || !feedbackBody.feedback) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields' },
          { status: 400 }
        )
      }
      
      await saveVariantFeedback(
        sanitizeInput(feedbackBody.niche),
        feedbackBody.variantUrl,
        feedbackBody.feedback
      )
      
      // Also track as event
      if (feedbackBody.sessionId) {
        const eventType = feedbackBody.feedback === 'like' ? 'variant_liked' : 'variant_disliked'
        await trackEvent(feedbackBody.sessionId, eventType, {
          niche: feedbackBody.niche,
          variantUrl: feedbackBody.variantUrl,
        })
      }
      
      return NextResponse.json({ success: true })
    }
    
    // Handle generic event tracking
    const eventBody = body as TrackEventBody
    
    if (!eventBody.sessionId || !eventBody.eventType) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId or eventType' },
        { status: 400 }
      )
    }
    
    await trackEvent(
      eventBody.sessionId,
      eventBody.eventType,
      eventBody.eventData,
      eventBody.leadId
    )
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[API] analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
