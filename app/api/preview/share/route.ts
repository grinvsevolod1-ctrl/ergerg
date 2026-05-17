import { NextRequest, NextResponse } from 'next/server'
import { createPreviewShare } from '@/lib/site-analyzer/cache'
import { trackEvent } from '@/lib/db/analytics'
import { sanitizeInput } from '@/lib/security'

interface ShareRequestBody {
  niche: string
  variantIndex: number
  companyName: string
  html: string
  sessionId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: ShareRequestBody = await request.json()
    
    if (!body.niche || !body.html || body.variantIndex === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Create share link
    const shareId = await createPreviewShare({
      niche: sanitizeInput(body.niche),
      variantIndex: body.variantIndex,
      userData: {
        niche: body.niche,
        companyName: body.companyName || 'Компания',
      },
      html: body.html,
    })
    
    // Track event
    if (body.sessionId) {
      await trackEvent(body.sessionId, 'preview_shared', {
        niche: body.niche,
        variantIndex: body.variantIndex,
        shareId,
      })
    }
    
    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://netnext.site'
    const shareUrl = `${baseUrl}/api/preview/${shareId}`
    
    return NextResponse.json({
      success: true,
      shareId,
      shareUrl,
      expiresIn: '24 hours',
    })
    
  } catch (error) {
    console.error('[API] share error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка создания ссылки' },
      { status: 500 }
    )
  }
}
