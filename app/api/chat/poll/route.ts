import { NextRequest, NextResponse } from "next/server"
import { getOperatorMessages, isOperatorConnected } from "@/app/api/telegram/webhook/route"

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId")
  
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID required" }, { status: 400 })
  }
  
  try {
    // These are now async functions that query PostgreSQL
    const messages = await getOperatorMessages(sessionId)
    const operatorConnected = await isOperatorConnected(sessionId)
    
    return NextResponse.json({
      messages,
      operatorConnected,
    })
  } catch (error) {
    console.error("Poll error:", error)
    return NextResponse.json({
      messages: [],
      operatorConnected: false,
    })
  }
}
