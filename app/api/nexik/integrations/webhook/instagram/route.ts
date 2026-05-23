import { NextRequest, NextResponse } from 'next/server'

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'nexik_instagram_verify_2024'

/**
 * GET - Webhook verification (Meta sends this to verify the endpoint)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  
  console.log('[Instagram Webhook] Verification request:', { mode, token, challenge })
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Instagram Webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }
  
  console.log('[Instagram Webhook] Verification failed')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

/**
 * POST - Receive webhook events (messages, comments, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[Instagram Webhook] Received event:', JSON.stringify(body, null, 2))
    
    // Handle different event types
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        // Handle messaging events
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await handleMessagingEvent(event)
          }
        }
        
        // Handle comment events
        if (entry.changes) {
          for (const change of entry.changes) {
            await handleChangeEvent(change)
          }
        }
      }
    }
    
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: 'ok' })
    
  } catch (error) {
    console.error('[Instagram Webhook] Error:', error)
    // Still return 200 to prevent retries
    return NextResponse.json({ status: 'ok' })
  }
}

async function handleMessagingEvent(event: any) {
  const senderId = event.sender?.id
  const recipientId = event.recipient?.id
  const message = event.message
  
  if (message?.text) {
    console.log('[Instagram Webhook] New message:', {
      from: senderId,
      to: recipientId,
      text: message.text
    })
    
    // TODO: 
    // 1. Find client by Instagram account ID
    // 2. Process message with Nexik AI
    // 3. Send response back via Instagram API
  }
}

async function handleChangeEvent(change: any) {
  const field = change.field
  const value = change.value
  
  console.log('[Instagram Webhook] Change event:', { field, value })
  
  if (field === 'comments') {
    // Handle new comment
    console.log('[Instagram Webhook] New comment:', value)
  }
  
  if (field === 'mentions') {
    // Handle mention
    console.log('[Instagram Webhook] New mention:', value)
  }
}
