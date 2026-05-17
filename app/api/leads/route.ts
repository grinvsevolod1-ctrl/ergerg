import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters } from '@/lib/rate-limit'
import { createLead } from '@/lib/db/leads'
import { trackEvent, getGeoFromIP, getDeviceType } from '@/lib/db/analytics'
import { extractIP, sanitizeInput, isValidEmail, isValidPhone } from '@/lib/security'

interface CreateLeadBody {
  companyName: string
  phone: string
  email: string
  description?: string
  niche?: string
  selectedVariantUrl?: string
  variantsViewed?: number
  timeSpentSeconds?: number
  sessionId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  consentGiven: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit for lead submissions
    const rateLimitResponse = await rateLimiters.standard(request)
    if (rateLimitResponse) return rateLimitResponse
    
    const body: CreateLeadBody = await request.json()
    
    // Validate required fields
    if (!body.companyName || !body.phone || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Все обязательные поля должны быть заполнены' },
        { status: 400 }
      )
    }
    
    // Validate consent
    if (!body.consentGiven) {
      return NextResponse.json(
        { success: false, error: 'Необходимо согласие на обработку данных' },
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
    
    // Extract metadata
    const ip = extractIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const geo = getGeoFromIP(ip)
    const deviceType = getDeviceType(userAgent)
    
    // Create lead
    const lead = await createLead({
      companyName: sanitizeInput(body.companyName),
      phone: sanitizeInput(body.phone),
      email: sanitizeInput(body.email).toLowerCase(),
      description: body.description ? sanitizeInput(body.description) : undefined,
      niche: body.niche ? sanitizeInput(body.niche) : undefined,
      selectedVariantUrl: body.selectedVariantUrl,
      variantsViewed: body.variantsViewed,
      timeSpentSeconds: body.timeSpentSeconds,
      deviceType,
      source: 'generator',
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      ipAddress: ip,
      userAgent,
      country: geo.country || undefined,
      city: geo.city || undefined,
    })
    
    // Track event
    if (body.sessionId) {
      await trackEvent(body.sessionId, 'order_clicked', {
        leadId: lead.id,
        niche: body.niche,
        variantsViewed: body.variantsViewed,
      }, lead.id)
    }
    
    // Send notifications (Telegram & Email)
    try {
      // Telegram notification
      if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        const message = `🎯 Новая заявка с генератора!\n\n` +
          `📝 Компания: ${body.companyName}\n` +
          `📞 Телефон: ${body.phone}\n` +
          `📧 Email: ${body.email}\n` +
          `🏷 Ниша: ${body.niche || 'Не указана'}\n` +
          `📊 Просмотрено вариантов: ${body.variantsViewed || 1}\n` +
          `🌍 Город: ${geo.city || 'Неизвестно'}, ${geo.country || ''}\n` +
          `📱 Устройство: ${deviceType}`
        
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML',
          }),
        })
      }
    } catch (notifyError) {
      console.error('[Leads] Notification error:', notifyError)
      // Don't fail the request if notifications fail
    }
    
    return NextResponse.json({
      success: true,
      leadId: lead.id,
    })
    
  } catch (error) {
    console.error('[API] leads error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения заявки. Попробуйте позже.' },
      { status: 500 }
    )
  }
}
