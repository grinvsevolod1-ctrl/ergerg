import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { getBusinessProfile, buildAIContext, addLearnedFact } from '@/lib/nexik/db/business-profiles'
import { getAIResponse } from '@/lib/ai/router'
import { buildNexikPrompt, NEXIK_PERSONAL_CONTEXT } from '@/lib/nexik/persona'
import { query, execute } from '@/lib/db'

// POST /api/nexik/personal/chat - Chat with personal Nexik
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { message, conversationHistory } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Get business profile for context
    const profile = await getBusinessProfile(session.org.id)
    const businessContext = profile ? buildAIContext(profile) : ''

    // Build system prompt with personal mode and business context
    const systemPrompt = buildNexikPrompt({
      mode: 'personal',
      userBusiness: profile ? {
        name: profile.business_name || undefined,
        type: profile.business_type || undefined,
        description: profile.short_description || undefined,
        services: profile.services,
        knowledgeBase: businessContext
      } : undefined
    })

    // Prepare messages
    const messages = [
      ...(conversationHistory || []).map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      })),
      { role: 'user' as const, content: message }
    ]

    // Get AI response
    const response = await getAIResponse({
      messages,
      systemPrompt,
      maxTokens: 1000,
      temperature: 0.7
    })

    // Save messages to DB
    const conversationId = `personal_${session.org.id}_${Date.now()}`
    
    await execute(
      `INSERT INTO nexik_personal_messages (org_id, member_id, conversation_id, role, content, created_at)
       VALUES ($1, $2, $3, 'user', $4, NOW())`,
      [session.org.id, session.member.id, conversationId, message]
    )

    await execute(
      `INSERT INTO nexik_personal_messages (org_id, member_id, conversation_id, role, content, created_at)
       VALUES ($1, $2, $3, 'assistant', $4, NOW())`,
      [session.org.id, session.member.id, conversationId, response]
    )

    // Try to extract facts from user message (simple heuristics)
    const factsToLearn = extractFacts(message)
    for (const fact of factsToLearn) {
      await addLearnedFact(session.org.id, fact, 'conversation', 0.7)
    }

    return NextResponse.json({
      response,
      conversationId
    })

  } catch (error) {
    console.error('[Personal Chat API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Simple fact extraction from user messages
function extractFacts(message: string): string[] {
  const facts: string[] = []
  const lower = message.toLowerCase()

  // Look for declarative statements about business
  const patterns = [
    /(?:мы|наша компания|наш бизнес|я)\s+(?:занимаемся|делаем|продаём|предлагаем)\s+(.+)/i,
    /(?:наши клиенты|наша аудитория)\s+(?:—|это|:)\s*(.+)/i,
    /(?:главная проблема|основная сложность)\s+(?:—|это|:)\s*(.+)/i,
    /(?:мы хотим|наша цель|планируем)\s+(.+)/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      const fact = match[1].trim()
      if (fact.length > 10 && fact.length < 200) {
        facts.push(fact)
      }
    }
  }

  return facts.slice(0, 3) // Max 3 facts per message
}
