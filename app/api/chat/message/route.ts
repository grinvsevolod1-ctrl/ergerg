import { NextRequest, NextResponse } from "next/server"
import { getSession, createSession, addMessage } from "@/lib/db/chat"

async function getOrCreateSession(sessionId: string, source: 'website' | 'telegram' = 'website') {
  let session = await getSession(sessionId)
  if (!session) {
    session = await createSession(sessionId, source)
  }
  return session
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, senderType } = body

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      )
    }

    // Ensure session exists
    await getOrCreateSession(sessionId, 'website')

    // Save message with default senderType if not provided
    const finalSenderType: 'user' | 'bot' | 'operator' = senderType || 'user'
    
    await addMessage(sessionId, finalSenderType, message)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Chat message API error]', error)
    return NextResponse.json(
      { error: 'Failed to save message' },
      { status: 500 }
    )
  }
}
