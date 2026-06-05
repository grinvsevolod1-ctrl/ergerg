import CryptoJS from 'crypto-js'

// Resolve the encryption key lazily at call time (not at module load).
// Throwing at import time would crash the build/server before any request.
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production')
    }
    return 'dev-key-not-for-production'
  }
  return key
}

// Encrypt sensitive data
export function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, getEncryptionKey()).toString()
}

// Decrypt sensitive data
export function decrypt(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getEncryptionKey())
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '&': '&amp;',
      }
      return entities[char] || char
    })
    .trim()
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Validate phone format (flexible for international)
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/
  return phoneRegex.test(phone)
}

// Generate session ID
export function generateSessionId(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}

// Hash for caching (non-sensitive)
export function hashForCache(text: string): string {
  return CryptoJS.MD5(text).toString()
}

// Mask sensitive data for logging
export function maskPhone(phone: string): string {
  if (phone.length < 6) return '***'
  return phone.slice(0, 3) + '***' + phone.slice(-2)
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***@***'
  const maskedLocal = local.slice(0, 2) + '***'
  return `${maskedLocal}@${domain}`
}

// IP extraction from headers
export function extractIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  return '127.0.0.1'
}

// CORS validation
// Allowed origins can be configured via the ALLOWED_ORIGINS env var
// (comma-separated) so the project works on any deployment domain/VPS.
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  const envOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  const allowedOrigins = [
    ...envOrigins,
    'https://netnext.site',
    'https://www.netnext.site',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
  ].filter(Boolean)
  return allowedOrigins.includes(origin)
}

// Content Security Policy for iframe
export function getIframeCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'none'",
    "frame-ancestors 'self'",
  ].join('; ')
}
