/**
 * Nexik Business Profiles Service
 * Manages detailed business information for personal AI assistant
 */

import { query, queryOne, execute } from '@/lib/db'

export interface BusinessProfile {
  id: string
  org_id: string
  
  // Basic info
  business_name: string | null
  business_type: string | null
  industry: string | null
  
  // Description
  short_description: string | null
  full_description: string | null
  
  // Services/Products
  services: string[]
  products: string[]
  
  // Target audience
  target_audience: string | null
  customer_personas: CustomerPersona[]
  
  // Pain points and goals
  pain_points: string[]
  goals: string[]
  challenges: string[]
  
  // Communication style
  brand_voice: 'professional' | 'friendly' | 'casual' | 'formal' | 'playful'
  tone_preferences: TonePreferences
  
  // Contact info
  contact_email: string | null
  contact_phone: string | null
  website_url: string | null
  social_links: SocialLinks
  
  // Working hours
  working_hours: WorkingHours
  timezone: string
  
  // Competitors and market
  competitors: string[]
  unique_selling_points: string[]
  
  // FAQ
  faq: FAQItem[]
  
  // Onboarding
  onboarding_completed: boolean
  onboarding_step: number
  
  // AI Memory
  ai_learned_facts: LearnedFact[]
  ai_conversation_summary: string | null
  
  created_at: Date
  updated_at: Date
}

export interface CustomerPersona {
  name: string
  description: string
  pain_points: string[]
  goals: string[]
}

export interface TonePreferences {
  formal_level?: number // 1-5
  emoji_usage?: boolean
  humor_allowed?: boolean
  custom_greetings?: string[]
}

export interface SocialLinks {
  instagram?: string
  telegram?: string
  whatsapp?: string
  facebook?: string
  vk?: string
  youtube?: string
  tiktok?: string
  linkedin?: string
}

export interface WorkingHours {
  monday?: { start: string; end: string } | null
  tuesday?: { start: string; end: string } | null
  wednesday?: { start: string; end: string } | null
  thursday?: { start: string; end: string } | null
  friday?: { start: string; end: string } | null
  saturday?: { start: string; end: string } | null
  sunday?: { start: string; end: string } | null
}

export interface FAQItem {
  question: string
  answer: string
  category?: string
}

export interface LearnedFact {
  fact: string
  source: 'onboarding' | 'conversation' | 'manual'
  timestamp: string
  confidence: number
}

// Create initial profile for organization
export async function createBusinessProfile(orgId: string): Promise<BusinessProfile> {
  const result = await query<BusinessProfile>(
    `INSERT INTO nexik_business_profiles (org_id)
     VALUES ($1)
     ON CONFLICT (org_id) DO UPDATE SET updated_at = NOW()
     RETURNING *`,
    [orgId]
  )
  return parseProfile(result[0])
}

// Get profile by org_id
export async function getBusinessProfile(orgId: string): Promise<BusinessProfile | null> {
  const result = await queryOne<BusinessProfile>(
    'SELECT * FROM nexik_business_profiles WHERE org_id = $1',
    [orgId]
  )
  return result ? parseProfile(result) : null
}

// Update profile
export async function updateBusinessProfile(
  orgId: string,
  data: Partial<Omit<BusinessProfile, 'id' | 'org_id' | 'created_at' | 'updated_at'>>
): Promise<BusinessProfile | null> {
  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = []
  let idx = 1

  const fields: (keyof typeof data)[] = [
    'business_name', 'business_type', 'industry',
    'short_description', 'full_description',
    'services', 'products',
    'target_audience', 'customer_personas',
    'pain_points', 'goals', 'challenges',
    'brand_voice', 'tone_preferences',
    'contact_email', 'contact_phone', 'website_url', 'social_links',
    'working_hours', 'timezone',
    'competitors', 'unique_selling_points',
    'faq',
    'onboarding_completed', 'onboarding_step',
    'ai_learned_facts', 'ai_conversation_summary'
  ]

  for (const field of fields) {
    if (data[field] !== undefined) {
      sets.push(`${field} = $${idx++}`)
      const value = data[field]
      // Serialize arrays and objects to JSON for JSONB fields
      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        params.push(JSON.stringify(value))
      } else {
        params.push(value)
      }
    }
  }

  if (sets.length === 1) return getBusinessProfile(orgId) // No changes

  params.push(orgId)

  const result = await query<BusinessProfile>(
    `UPDATE nexik_business_profiles SET ${sets.join(', ')} WHERE org_id = $${idx} RETURNING *`,
    params
  )
  
  return result[0] ? parseProfile(result[0]) : null
}

// Add learned fact from conversation
export async function addLearnedFact(
  orgId: string,
  fact: string,
  source: 'onboarding' | 'conversation' | 'manual' = 'conversation',
  confidence: number = 0.8
): Promise<void> {
  const newFact: LearnedFact = {
    fact,
    source,
    timestamp: new Date().toISOString(),
    confidence
  }

  await execute(
    `UPDATE nexik_business_profiles 
     SET ai_learned_facts = ai_learned_facts || $1::jsonb,
         updated_at = NOW()
     WHERE org_id = $2`,
    [JSON.stringify([newFact]), orgId]
  )
}

// Update conversation summary
export async function updateConversationSummary(
  orgId: string,
  summary: string
): Promise<void> {
  await execute(
    `UPDATE nexik_business_profiles 
     SET ai_conversation_summary = $1, updated_at = NOW()
     WHERE org_id = $2`,
    [summary, orgId]
  )
}

// Update onboarding progress
export async function updateOnboardingProgress(
  orgId: string,
  step: number,
  completed: boolean = false
): Promise<void> {
  await execute(
    `UPDATE nexik_business_profiles 
     SET onboarding_step = $1, onboarding_completed = $2, updated_at = NOW()
     WHERE org_id = $3`,
    [step, completed, orgId]
  )
}

// Build context for AI from profile
export function buildAIContext(profile: BusinessProfile): string {
  const parts: string[] = []

  if (profile.business_name) {
    parts.push(`Название бизнеса: ${profile.business_name}`)
  }
  if (profile.business_type) {
    parts.push(`Тип бизнеса: ${profile.business_type}`)
  }
  if (profile.industry) {
    parts.push(`Индустрия: ${profile.industry}`)
  }
  if (profile.short_description) {
    parts.push(`Описание: ${profile.short_description}`)
  }
  if (profile.services.length > 0) {
    parts.push(`Услуги: ${profile.services.join(', ')}`)
  }
  if (profile.products.length > 0) {
    parts.push(`Продукты: ${profile.products.join(', ')}`)
  }
  if (profile.target_audience) {
    parts.push(`Целевая аудитория: ${profile.target_audience}`)
  }
  if (profile.pain_points.length > 0) {
    parts.push(`Проблемы бизнеса: ${profile.pain_points.join('; ')}`)
  }
  if (profile.goals.length > 0) {
    parts.push(`Цели: ${profile.goals.join('; ')}`)
  }
  if (profile.unique_selling_points.length > 0) {
    parts.push(`Уникальные преимущества: ${profile.unique_selling_points.join('; ')}`)
  }
  if (profile.brand_voice) {
    const voiceMap = {
      professional: 'Профессиональный',
      friendly: 'Дружелюбный',
      casual: 'Неформальный',
      formal: 'Формальный',
      playful: 'Игривый'
    }
    parts.push(`Стиль общения: ${voiceMap[profile.brand_voice]}`)
  }
  if (profile.contact_phone) {
    parts.push(`Телефон для клиентов: ${profile.contact_phone}`)
  }
  if (profile.contact_email) {
    parts.push(`Email для клиентов: ${profile.contact_email}`)
  }
  if (profile.website_url) {
    parts.push(`Сайт: ${profile.website_url}`)
  }
  if (profile.faq.length > 0) {
    parts.push('\nЧастые вопросы:')
    profile.faq.forEach((item, i) => {
      parts.push(`${i + 1}. В: ${item.question}\n   О: ${item.answer}`)
    })
  }
  if (profile.ai_learned_facts.length > 0) {
    parts.push('\nВажные факты о бизнесе:')
    profile.ai_learned_facts.forEach(f => {
      parts.push(`- ${f.fact}`)
    })
  }

  return parts.join('\n')
}

// Parse JSON fields from DB
function parseProfile(row: any): BusinessProfile {
  return {
    ...row,
    services: row.services || [],
    products: row.products || [],
    customer_personas: typeof row.customer_personas === 'string' 
      ? JSON.parse(row.customer_personas) 
      : (row.customer_personas || []),
    pain_points: row.pain_points || [],
    goals: row.goals || [],
    challenges: row.challenges || [],
    tone_preferences: typeof row.tone_preferences === 'string'
      ? JSON.parse(row.tone_preferences)
      : (row.tone_preferences || {}),
    social_links: typeof row.social_links === 'string'
      ? JSON.parse(row.social_links)
      : (row.social_links || {}),
    working_hours: typeof row.working_hours === 'string'
      ? JSON.parse(row.working_hours)
      : (row.working_hours || {}),
    competitors: row.competitors || [],
    unique_selling_points: row.unique_selling_points || [],
    faq: typeof row.faq === 'string'
      ? JSON.parse(row.faq)
      : (row.faq || []),
    ai_learned_facts: typeof row.ai_learned_facts === 'string'
      ? JSON.parse(row.ai_learned_facts)
      : (row.ai_learned_facts || [])
  }
}
