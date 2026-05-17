import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/db/leads'
import { extractIP, sanitizeInput } from '@/lib/security'
import { getGeoFromIP, getDeviceType } from '@/lib/db/analytics'

interface ContactLeadBody {
  companyName: string
  phone?: string
  email?: string
  telegram?: string
  contactMethod: 'email' | 'telegram' | 'phone'
  projectType?: string
  budget?: string
  description?: string
  source?: string
  consentGiven: boolean
}

const budgetLabels: Record<string, string> = {
  small: 'до 3 000 Br',
  medium: '3 000 - 10 000 Br',
  large: '10 000 - 30 000 Br',
  enterprise: '30 000+ Br',
}

const projectLabels: Record<string, string> = {
  website: 'Сайт',
  app: 'Приложение',
  design: 'Дизайн',
  other: 'Другое',
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactLeadBody = await request.json()
    
    // Validate required fields
    if (!body.companyName) {
      return NextResponse.json(
        { success: false, error: 'Имя обязательно' },
        { status: 400 }
      )
    }
    
    // Must have at least one contact method
    if (!body.phone && !body.email && !body.telegram) {
      return NextResponse.json(
        { success: false, error: 'Укажите способ связи' },
        { status: 400 }
      )
    }
    
    // Extract metadata
    const ip = extractIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const geo = getGeoFromIP(ip)
    const deviceType = getDeviceType(userAgent)
    
    // Build description with project info
    let fullDescription = body.description || ''
    if (body.projectType || body.budget) {
      const parts: string[] = []
      if (body.projectType) {
        parts.push(`Тип проекта: ${projectLabels[body.projectType] || body.projectType}`)
      }
      if (body.budget) {
        parts.push(`Бюджет: ${budgetLabels[body.budget] || body.budget}`)
      }
      parts.push(`Способ связи: ${body.contactMethod}`)
      if (body.telegram) {
        parts.push(`Telegram: ${body.telegram}`)
      }
      fullDescription = parts.join('\n') + (fullDescription ? '\n\n' + fullDescription : '')
    }
    
    // Create lead
    const lead = await createLead({
      companyName: sanitizeInput(body.companyName),
      phone: body.phone ? sanitizeInput(body.phone) : '',
      email: body.email ? sanitizeInput(body.email).toLowerCase() : '',
      description: fullDescription,
      deviceType,
      source: body.source || 'contact_form',
      ipAddress: ip,
      userAgent,
      country: geo.country || undefined,
      city: geo.city || undefined,
    })
    
    return NextResponse.json({
      success: true,
      leadId: lead.id,
    })
    
  } catch (error) {
    console.error('[API] contact leads error:', error)
    return NextResponse.json(
      { success: false, error: 'Ошибка сохранения заявки' },
      { status: 500 }
    )
  }
}
