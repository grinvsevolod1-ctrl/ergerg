import { NextRequest, NextResponse } from 'next/server'
import { classifyBusiness, generateClassificationResponse } from '@/lib/ai/classifier'
import { aiCache } from '@/lib/ai/cache'
import { routedChat, AI_SERVERS } from '@/lib/ai/router'

/**
 * Fast business input analysis
 * 
 * Strategy:
 * 1. Check cache first (instant)
 * 2. Try fast rule-based classifier (1-5ms)
 * 3. If confidence low, fallback to lightweight AI model (500ms-2s)
 * 4. Cache the result
 */

const AI_SYSTEM_PROMPT = `Проанализируй описание бизнеса. Ответь JSON:
{"valid":true/false,"type":"тип бизнеса","response":"твой ответ"}
Если valid=true, response должен быть дружелюбным про их нишу.
Если valid=false, попроси конкретнее описать бизнес.
ВАЖНО: "порно студия", мат в описании - это ОК если понятен бизнес.`

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body = await request.json()
    const { input } = body
    
    console.log('[v0] analyze-input received:', input)
    
    if (!input || typeof input !== 'string') {
      console.log('[v0] analyze-input: invalid input')
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      )
    }

    // 1. Check cache
    const cached = aiCache.get([{ role: 'user', content: input }], 'business-classify')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return NextResponse.json({
          ...parsed,
          source: 'cache',
          timeMs: Date.now() - startTime
        })
      } catch {
        // Invalid cache, continue
      }
    }

    // 2. Try fast classifier
    const classification = classifyBusiness(input)
    console.log('[v0] classifier result:', classification)
    
    // High confidence - use classifier result directly
    if (classification.confidence >= 0.6) {
      const response = generateClassificationResponse(input, classification)
      console.log('[v0] High confidence, returning:', { isValid: classification.isValidBusiness, response })
      
      const result = {
        isValidBusiness: classification.isValidBusiness,
        businessType: classification.businessType,
        response,
        source: 'classifier',
        confidence: classification.confidence,
        timeMs: Date.now() - startTime
      }
      
      // Cache high-confidence results
      aiCache.set(
        [{ role: 'user', content: input }],
        'business-classify',
        JSON.stringify(result)
      )
      
      return NextResponse.json(result)
    }

    // 3. Medium confidence or ambiguous - use lightweight AI on FAST server
    // Only for edge cases where classifier isn't sure
    if (classification.confidence >= 0.3 && classification.confidence < 0.6) {
      try {
        // Use FAST server with qwen2.5:1.5b for quick analysis
        const aiResult = await routedChat(
          'classify',  // Routes to FAST server
          [{ role: 'user', content: input }],
          {
            model: AI_SERVERS.fast.defaultModel,  // qwen2.5:1.5b
            system: AI_SYSTEM_PROMPT,
            temperature: 0.3,
            maxTokens: 150
          }
        )
        
        // Parse AI response
        const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          
          const result = {
            isValidBusiness: parsed.valid ?? classification.isValidBusiness,
            businessType: parsed.type || classification.businessType,
            response: parsed.response || generateClassificationResponse(input, classification),
            source: 'ai_lightweight',
            timeMs: Date.now() - startTime
          }
          
          aiCache.set(
            [{ role: 'user', content: input }],
            'business-classify',
            JSON.stringify(result)
          )
          
          return NextResponse.json(result)
        }
      } catch {
        // AI failed, use classifier result
      }
    }

    // 4. Low confidence - use classifier result anyway but mark as uncertain
    const response = generateClassificationResponse(input, classification)
    
    const result = {
      isValidBusiness: classification.isValidBusiness,
      businessType: classification.businessType,
      response,
      source: 'classifier_low_confidence',
      confidence: classification.confidence,
      timeMs: Date.now() - startTime
    }
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('[Analyze Input] Error:', error)
    
    // Ultimate fallback
    return NextResponse.json({
      isValidBusiness: false,
      businessType: null,
      response: 'Расскажи подробнее о своём бизнесе - что продаёшь или какие услуги оказываешь?',
      source: 'error_fallback',
      timeMs: Date.now() - startTime
    })
  }
}
