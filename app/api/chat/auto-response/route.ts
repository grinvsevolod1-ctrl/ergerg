import { NextRequest, NextResponse } from "next/server"
import { findMatchingAutoResponse, incrementAutoResponseUse } from "@/lib/db/auto-responses"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Try to find matching auto-response rule from database
    const rule = await findMatchingAutoResponse(message)

    if (rule) {
      // Increment use count asynchronously
      incrementAutoResponseUse(rule.id).catch(() => {})

      return NextResponse.json({
        found: true,
        text: rule.response_text,
        buttons: rule.response_buttons || [],
        ruleId: rule.id,
        ruleName: rule.name,
      })
    }

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('[Auto-response API error]', error)
    return NextResponse.json({ found: false })
  }
}
