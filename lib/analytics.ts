/**
 * Yandex Metrika analytics helpers.
 *
 * Single source of truth for the Metrika counter id and for every conversion
 * goal configured in the Yandex Metrika dashboard. The string identifiers below
 * MUST match the "Идентификатор цели" (JavaScript event) configured in Metrika,
 * otherwise the goal will never register.
 *
 * Firing goals is fire-and-forget: it must never throw or block the UI, even
 * when the Metrika script has not loaded yet (e.g. ad-blockers, SSR).
 */

// Yandex Metrika counter id (same counter used by <YandexMetrika />).
export const METRIKA_ID = 107080970

/**
 * Conversion goals. Keys are camelCase for code; values are the exact goal
 * identifiers registered in Yandex Metrika (see project tracking plan).
 */
export const YM_GOALS = {
  /** Основная контактная форма + плавающая форма CTA (любая отправка заявки) */
  trustForm: 'trustform',
  /** Всплывающая форма CTA (быстрая заявка) */
  quickFormSubmit: 'quick_form_submit',
  /** В форме выбран способ связи — Email */
  contactViaEmail: 'contact_via_email',
  /** В форме выбран способ связи — Telegram */
  contactViaTelegram: 'contact_via_telegram',
  /** В форме выбран способ связи — Телефон */
  contactViaPhone: 'contact_via_phone',
  /** Клик по контактной карточке (телефон / email) */
  clickContactInfo: 'click_contact_info',
  /** Клик по кнопке мессенджера (Telegram / WhatsApp / Viber) */
  clickMessenger: 'click_messenger',
  /** Hero: клик по кнопке «Обсудить проект» */
  clickCtaDiscuss: 'click_cta_discuss',
  /** Hero: клик по кнопке «Наши услуги» / портфолио */
  clickCtaPortfolio: 'click_cta_portfolio',
  /** Открытие чата (первый разворот виджета) */
  openChat: 'open_chat',
  /** Заявка/контакт получены через чат (запрос оператора или оставлен контакт) */
  chatLead: 'chat_lead',
} as const

export type YmGoal = (typeof YM_GOALS)[keyof typeof YM_GOALS]

/** Maps a chosen contact method to its dedicated Metrika goal. */
export function contactMethodGoal(method: 'email' | 'telegram' | 'phone'): YmGoal {
  switch (method) {
    case 'email':
      return YM_GOALS.contactViaEmail
    case 'telegram':
      return YM_GOALS.contactViaTelegram
    case 'phone':
      return YM_GOALS.contactViaPhone
  }
}

/**
 * Fire a Yandex Metrika conversion goal. Safe to call on the server (no-op) and
 * safe when the Metrika script is missing or blocked.
 */
export function reachGoal(goal: YmGoal, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  try {
    if (typeof window.ym === 'function') {
      window.ym(METRIKA_ID, 'reachGoal', goal, params)
    }
  } catch {
    // Analytics must never break the user experience.
  }
}
