// Nexik Configuration
// Central config for all Nexik-related settings

export const nexikConfig = {
  // AI Settings
  ai: {
    model: process.env.NEXIK_AI_MODEL || process.env.OLLAMA_MODEL || "gpt-4o-mini",
    maxTokens: parseInt(process.env.NEXIK_MAX_TOKENS || "1000"),
    temperature: 0.7,
    systemPrompt: `Ты Nexik — AI-ассистент для бизнеса. Твоя задача — помогать клиентам: отвечать на вопросы, записывать на услуги, предоставлять информацию о ценах и услугах.

Правила:
- Отвечай кратко и по делу (1-3 предложения)
- Будь вежливым и профессиональным
- Если не знаешь ответ — честно скажи и предложи связаться с менеджером
- Используй информацию из базы знаний клиента
- Не придумывай цены и услуги — только то, что есть в базе`,
  },

  // Widget Settings
  widget: {
    domain: process.env.NEXIK_WIDGET_DOMAIN || "https://netnext.site",
    defaultColor: "#4fd1c5",
    defaultPosition: "bottom-right" as const,
    defaultMode: "modal" as const,
  },

  // API Settings
  api: {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute per IP
    },
    maxMessageLength: 2000,
    maxHistoryMessages: 50,
  },

  // Storage Keys
  storage: {
    chatHistory: "nexik_chat_history",
    sessionId: "nexik_session_id",
    userPrefs: "nexik_user_prefs",
  },

  // Feature Flags
  features: {
    enableVoice: false, // Voice input (coming soon)
    enableFileUpload: false, // File attachments (coming soon)
    enableAnalytics: true,
    enableOperatorMode: true,
  },

  // Plans and Limits
  plans: {
    free: {
      messagesPerMonth: 500,
      widgets: 1,
      features: ["basic_ai", "email_support"],
    },
    business: {
      messagesPerMonth: 10000,
      widgets: 3,
      features: ["advanced_ai", "website_analysis", "knowledge_base", "priority_support"],
    },
    enterprise: {
      messagesPerMonth: -1, // unlimited
      widgets: -1, // unlimited
      features: ["dedicated_ai", "api_access", "webhooks", "sla", "personal_manager"],
    },
  },
} as const

export type NexikPlan = keyof typeof nexikConfig.plans

// Helper to get plan limits
export function getPlanLimits(plan: NexikPlan) {
  return nexikConfig.plans[plan]
}

// Helper to check if feature is enabled for plan
export function isPlanFeatureEnabled(plan: NexikPlan, feature: string): boolean {
  const planFeatures = nexikConfig.plans[plan].features as readonly string[]
  return planFeatures.includes(feature)
}
