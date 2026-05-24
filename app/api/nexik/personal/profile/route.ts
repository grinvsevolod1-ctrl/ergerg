import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/nexik/services/auth'
import { 
  getBusinessProfile, 
  createBusinessProfile, 
  updateBusinessProfile 
} from '@/lib/nexik/db/business-profiles'

// GET /api/nexik/personal/profile - Get user's business profile
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile = await getBusinessProfile(session.org.id)
    
    // Create profile if doesn't exist
    if (!profile) {
      profile = await createBusinessProfile(session.org.id)
    }

    return NextResponse.json({
      profile: {
        businessName: profile.business_name,
        businessType: profile.business_type,
        industry: profile.industry,
        description: profile.short_description,
        services: profile.services,
        painPoints: profile.pain_points,
        goals: profile.goals,
        targetAudience: profile.target_audience,
        onboardingCompleted: profile.onboarding_completed,
        onboardingStep: profile.onboarding_step
      }
    })

  } catch (error) {
    console.error('[Personal Profile API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/nexik/personal/profile - Update business profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Map frontend names to DB names
    const updateData: Record<string, unknown> = {}
    
    if (body.businessName !== undefined) updateData.business_name = body.businessName
    if (body.businessType !== undefined) updateData.business_type = body.businessType
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.shortDescription !== undefined) updateData.short_description = body.shortDescription
    if (body.fullDescription !== undefined) updateData.full_description = body.fullDescription
    if (body.services !== undefined) updateData.services = body.services
    if (body.products !== undefined) updateData.products = body.products
    if (body.targetAudience !== undefined) updateData.target_audience = body.targetAudience
    if (body.painPoints !== undefined) updateData.pain_points = body.painPoints
    if (body.goals !== undefined) updateData.goals = body.goals
    if (body.challenges !== undefined) updateData.challenges = body.challenges
    if (body.brandVoice !== undefined) updateData.brand_voice = body.brandVoice
    if (body.contactEmail !== undefined) updateData.contact_email = body.contactEmail
    if (body.contactPhone !== undefined) updateData.contact_phone = body.contactPhone
    if (body.websiteUrl !== undefined) updateData.website_url = body.websiteUrl
    if (body.socialLinks !== undefined) updateData.social_links = body.socialLinks
    if (body.workingHours !== undefined) updateData.working_hours = body.workingHours
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.competitors !== undefined) updateData.competitors = body.competitors
    if (body.uniqueSellingPoints !== undefined) updateData.unique_selling_points = body.uniqueSellingPoints
    if (body.faq !== undefined) updateData.faq = body.faq
    if (body.onboardingCompleted !== undefined) updateData.onboarding_completed = body.onboardingCompleted
    if (body.onboardingStep !== undefined) updateData.onboarding_step = body.onboardingStep

    // Ensure profile exists
    let profile = await getBusinessProfile(session.org.id)
    if (!profile) {
      profile = await createBusinessProfile(session.org.id)
    }

    // Update
    const updated = await updateBusinessProfile(session.org.id, updateData as any)

    return NextResponse.json({
      success: true,
      profile: updated
    })

  } catch (error) {
    console.error('[Personal Profile API] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
