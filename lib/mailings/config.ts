/**
 * Email Mailing System Configuration
 * Anti-spam compliant configuration for commercial email sending
 */

export const mailingConfig = {
  // SMTP Configuration (Mail.ru / Your provider)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mail.ru',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true, // SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },

  // Sender Information
  sender: {
    email: process.env.SMTP_FROM || process.env.SMTP_USER || 'hello@netnext.site',
    name: process.env.SMTP_FROM_NAME || 'NetNext',
  },

  // DKIM Configuration
  dkim: {
    domainName: process.env.DKIM_DOMAIN || 'netnext.site',
    selector: process.env.DKIM_SELECTOR || 'vps',
    privateKeyPath: process.env.DKIM_KEY_PATH || '/etc/opendkim/keys/vps.private',
  },

  // Anti-Spam Rate Limiting (CRITICAL for avoiding blocks)
  rateLimits: {
    // Maximum emails per hour (Mail.ru limit is ~100/hour for new accounts)
    maxPerHour: parseInt(process.env.MAILING_MAX_PER_HOUR || '50'),
    // Delay between emails in milliseconds (recommended: 3-10 seconds)
    delayBetweenEmails: parseInt(process.env.MAILING_DELAY_MS || '5000'),
    // Maximum concurrent sending workers
    maxConcurrency: 1, // Keep at 1 for VPS to avoid overload
    // Pause sending during these hours (optional)
    quietHours: {
      enabled: false,
      start: 22, // 10 PM
      end: 8,    // 8 AM
    },
  },

  // Required for CAN-SPAM / GDPR compliance
  compliance: {
    // Physical address (required by law in most countries)
    companyAddress: 'NetNext, Минск, Беларусь',
    // Unsubscribe URL base (will append ?token=xxx)
    unsubscribeUrlBase: process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe`
      : 'https://netnext.site/unsubscribe',
  },

  // Queue configuration (BullMQ + Redis)
  queue: {
    name: 'email-queue',
    redis: {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: 3,
    },
  },
}

// Validation
export function validateMailingConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!mailingConfig.smtp.auth.user) {
    errors.push('SMTP_USER is required')
  }
  if (!mailingConfig.smtp.auth.pass) {
    errors.push('SMTP_PASS is required')
  }
  if (!mailingConfig.queue.redis.url) {
    errors.push('REDIS_URL is required for email queue')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
