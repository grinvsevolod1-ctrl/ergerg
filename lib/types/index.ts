// Shared types for API responses and requests

// =============================================================================
// Lead types
// =============================================================================

export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  project_type: ProjectType
  budget?: BudgetRange
  message?: string
  source: string
  status: LeadStatus
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  created_at: string
  updated_at?: string
}

export type ProjectType = 
  | 'landing'
  | 'corporate'
  | 'ecommerce'
  | 'webapp'
  | 'mobile'
  | 'design'
  | 'marketing'
  | 'other'

export type BudgetRange = 
  | 'small'      // до 3 000 BYN
  | 'medium'     // 3 000 - 10 000 BYN
  | 'large'      // 10 000 - 30 000 BYN
  | 'enterprise' // 30 000+ BYN

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  landing: 'Лендинг',
  corporate: 'Корпоративный сайт',
  ecommerce: 'Интернет-магазин',
  webapp: 'Веб-приложение',
  mobile: 'Мобильное приложение',
  design: 'UI/UX дизайн',
  marketing: 'Маркетинг и реклама',
  other: 'Другое',
}

export const BUDGET_RANGE_LABELS: Record<BudgetRange, string> = {
  small: 'до 3 000 BYN',
  medium: '3 000 - 10 000 BYN',
  large: '10 000 - 30 000 BYN',
  enterprise: '30 000+ BYN',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый',
  contacted: 'Связались',
  qualified: 'Квалифицирован',
  proposal: 'Предложение',
  negotiation: 'Переговоры',
  won: 'Выигран',
  lost: 'Потерян',
}

// =============================================================================
// Chat types
// =============================================================================

export interface ChatSession {
  id: string
  user_type: 'website' | 'telegram'
  telegram_chat_id?: number
  telegram_username?: string
  telegram_name?: string
  operator_connected: boolean
  operator_connected_at?: string
  created_at: string
  last_activity: string
  metadata: Record<string, unknown>
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'bot' | 'operator'
  message: string
  delivered: boolean
  created_at: string
}

// =============================================================================
// Mailing types
// =============================================================================

export interface MailingCampaign {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  status: CampaignStatus
  total_recipients: number
  sent_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export type CampaignStatus = 
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'paused'
  | 'completed'
  | 'failed'

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Черновик',
  scheduled: 'Запланирована',
  sending: 'Отправляется',
  paused: 'Приостановлена',
  completed: 'Завершена',
  failed: 'Ошибка',
}

export interface MailingRecipient {
  id: string
  campaign_id: string
  email: string
  name?: string
  company?: string
  status: RecipientStatus
  sent_at?: string
  opened_at?: string
  clicked_at?: string
  error_message?: string
  metadata: Record<string, unknown>
}

export type RecipientStatus = 
  | 'pending'
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_content: string
  text_content?: string
  variables: TemplateVariable[]
  created_at: string
  updated_at: string
}

export interface TemplateVariable {
  name: string
  description: string
  default_value?: string
  required: boolean
}

// =============================================================================
// Analytics types
// =============================================================================

export interface AnalyticsEvent {
  id: string
  session_id: string
  event_type: string
  event_data: Record<string, unknown>
  page_url?: string
  referrer?: string
  user_agent?: string
  ip_hash?: string
  created_at: string
}

export interface AnalyticsSummary {
  total_visits: number
  unique_visitors: number
  page_views: number
  avg_session_duration: number
  bounce_rate: number
  top_pages: { url: string; views: number }[]
  top_referrers: { referrer: string; count: number }[]
  conversions: number
  conversion_rate: number
}

// =============================================================================
// API Response types
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// =============================================================================
// Site Generator types
// =============================================================================

export interface GeneratorConfig {
  niche: string
  variant: number
  company_name?: string
  phone?: string
  email?: string
  address?: string
  colors?: {
    primary: string
    secondary: string
    accent: string
  }
}

export interface GeneratedSite {
  html: string
  css: string
  preview_url?: string
  download_url?: string
}

// =============================================================================
// Utility types
// =============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined

export interface DateRange {
  from: Date
  to: Date
}
