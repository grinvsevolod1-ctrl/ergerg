// Site Analyzer Types

export interface UserData {
  niche: string
  companyName: string
  phone: string
  email: string
  description?: string
}

export interface ScrapedSite {
  url: string
  html: string
  title: string
  scrapedAt: string
}

export interface NicheCache {
  niche: string
  normalizedNiche: string
  searchedAt: string
  expiresAt: string
  sites: ScrapedSite[]
}

export interface AnalyzeRequest {
  userData: UserData
  variantIndex?: number
}

export interface AnalyzeResponse {
  success: boolean
  html?: string
  currentVariant: number
  totalVariants: number
  sourceUrl?: string
  error?: string
  jobId?: string
}

export interface Lead {
  id: string
  companyName: string
  phone: string
  email: string
  description?: string
  niche: string
  selectedVariantUrl?: string
  variantsViewed: number
  timeSpentSeconds?: number
  deviceType?: 'mobile' | 'tablet' | 'desktop'
  status: 'new' | 'contacted' | 'qualified' | 'sold' | 'lost'
  source: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  createdAt: string
  updatedAt: string
  ipAddress?: string
  userAgent?: string
  country?: string
  city?: string
  consentGiven: boolean
  consentDate: string
  dataDeletionRequestedAt?: string
}

export interface AnalyticsEvent {
  id: string
  leadId?: string
  sessionId: string
  eventType: 
    | 'generation_started'
    | 'generation_completed'
    | 'generation_failed'
    | 'variant_viewed'
    | 'variant_liked'
    | 'variant_disliked'
    | 'order_clicked'
    | 'preview_shared'
    | 'device_toggled'
    | 'fullscreen_toggled'
  eventData?: Record<string, unknown>
  createdAt: string
}

export interface VariantFeedback {
  id: string
  niche: string
  variantUrl: string
  feedback: 'like' | 'dislike'
  createdAt: string
}

export interface PreviewShare {
  id: string
  niche: string
  variantIndex: number
  userData: Omit<UserData, 'phone' | 'email'>
  html: string
  createdAt: string
  expiresAt: string
}

export interface JobStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  phase: string
  result?: AnalyzeResponse
  error?: string
}

export type DeviceType = 'desktop' | 'tablet' | 'mobile'

export interface DevicePreset {
  type: DeviceType
  width: number
  height: number
  label: string
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { type: 'desktop', width: 1920, height: 1080, label: 'Desktop' },
  { type: 'tablet', width: 768, height: 1024, label: 'Tablet' },
  { type: 'mobile', width: 375, height: 812, label: 'Mobile' },
]
