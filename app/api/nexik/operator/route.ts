/**
 * Nexik Operator Request API
 * Notifies when a user requests to speak with an operator
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

interface OperatorRequestBody {
  clientId: string
  sessionId: string
  messages?: Array<{ role: string; content: string }>
  userInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: OperatorRequestBody = await request.json()
    const { clientId, sessionId, messages, userInfo } = body

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // Log operator request (in production, save to database)
    const requestData = {
      clientId,
      sessionId,
      userInfo,
      lastMessages: messages?.slice(-3),
      timestamp: new Date().toISOString()
    }
    
    // Log for monitoring
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Nexik Operator] Request:`, JSON.stringify(requestData, null, 2))
    }

    // Simulate webhook notification
    // In production, this would send to client's configured webhook URL
    // await sendWebhook(clientWebhookUrl, { type: 'operator_request', sessionId, messages })

    return NextResponse.json({
      success: true,
      message: 'Operator notified',
      estimatedWaitTime: '1-2 minutes',
      queuePosition: 1, // Placeholder
    })

  } catch (error) {
    console.error('[Nexik Operator API error]', error)
    return NextResponse.json(
      { error: 'Failed to notify operator' },
      { status: 500 }
    )
  }
}
