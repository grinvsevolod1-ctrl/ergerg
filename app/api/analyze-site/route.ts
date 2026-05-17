import { NextRequest, NextResponse } from 'next/server'
import { analyzeSite, canMakeRequest } from '@/lib/site-analyzer'
import type { UserData } from '@/lib/site-analyzer/types'
import { extractIP, sanitizeInput, isValidEmail, isValidPhone } from '@/lib/security'
import { trackEvent } from '@/lib/db/analytics'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60 // 60 seconds timeout
export const dynamic = 'force-dynamic'

interface AnalyzeRequestBody {
  niche: string
  companyName: string
  phone: string
  email: string
  description?: string
  variantIndex?: number
  sessionId?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let sessionId = ''
  
  try {
    // Parse request body
    const body: AnalyzeRequestBody = await request.json()
    sessionId = body.sessionId || uuidv4()
    
    // Validate required fields
    if (!body.niche || !body.companyName || !body.phone || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      )
    }
    
    // Validate formats
    if (!isValidEmail(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат email' },
        { status: 400 }
      )
    }
    
    if (!isValidPhone(body.phone)) {
      return NextResponse.json(
        { success: false, error: 'Неверный формат телефона' },
        { status: 400 }
      )
    }
    
    // Check rate limit
    const ip = extractIP(request)
    const { allowed, remaining } = await canMakeRequest(ip)
    
    if (!allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Превышен лимит запросов. Попробуйте через час или свяжитесь с нами.',
          rateLimitRemaining: 0
        },
        { status: 429 }
      )
    }
    
    // Sanitize inputs
    const userData: UserData = {
      niche: sanitizeInput(body.niche),
      companyName: sanitizeInput(body.companyName),
      phone: sanitizeInput(body.phone),
      email: sanitizeInput(body.email).toLowerCase(),
      description: body.description ? sanitizeInput(body.description) : undefined,
    }
    
    // Track generation start
    await trackEvent(sessionId, 'generation_started', {
      niche: userData.niche,
      variantIndex: body.variantIndex || 0,
    })
    
    // Run analysis
    const result = await analyzeSite(userData, {
      variantIndex: body.variantIndex || 0,
    })
    
    const duration = Date.now() - startTime
    
    if (result.success) {
      // Track success
      await trackEvent(sessionId, 'generation_completed', {
        niche: userData.niche,
        variantIndex: result.currentVariant,
        totalVariants: result.totalVariants,
        durationMs: duration,
      })
      
      return NextResponse.json({
        success: true,
        html: result.html,
        currentVariant: result.currentVariant,
        totalVariants: result.totalVariants,
        sourceUrl: result.sourceUrl,
        sessionId,
        rateLimitRemaining: remaining - 1,
        generationTime: duration,
      })
    } else {
      // Track failure
      await trackEvent(sessionId, 'generation_failed', {
        niche: userData.niche,
        error: result.error,
        durationMs: duration,
      })
      
      return NextResponse.json({
        success: false,
        error: result.error,
        sessionId,
        rateLimitRemaining: remaining - 1,
      })
    }
    
  } catch (error) {
    console.error('[API] analyze-site error:', error)
    
    // Track error
    if (sessionId) {
      await trackEvent(sessionId, 'generation_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      }).catch(() => {})
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'К сожалению, наша система временно перегружена. Попробуйте позже или свяжитесь с нами.' 
      },
      { status: 500 }
    )
  }
}
