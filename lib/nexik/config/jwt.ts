/**
 * Nexik JWT Configuration
 * Centralized JWT secret management - single source of truth
 */

const isDevelopment = process.env.NODE_ENV !== 'production'

// Cache the encoded secret so we only validate/encode once per process.
let cachedSecret: Uint8Array | null = null

// Get JWT secret - MUST be set in production.
// Evaluated lazily (on first use) instead of at import time, so that a missing
// secret never crashes the build or server startup before a request is handled.
export function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret

  const secret = process.env.NEXIK_JWT_SECRET
  
  if (!secret) {
    if (isDevelopment) {
      // Only allow fallback in development
      console.warn(
        '[Nexik JWT] Warning: NEXIK_JWT_SECRET not set. Using development fallback. ' +
        'DO NOT use this in production!'
      )
      cachedSecret = new TextEncoder().encode('nexik-dev-only-secret-not-for-production')
      return cachedSecret
    }
    
    // In production, throw error - security requirement
    throw new Error(
      '[Nexik JWT] CRITICAL: NEXIK_JWT_SECRET environment variable is required in production. ' +
      'Please set a strong, random secret (min 32 characters).'
    )
  }
  
  // Validate secret strength
  if (secret.length < 32) {
    console.warn(
      '[Nexik JWT] Warning: NEXIK_JWT_SECRET should be at least 32 characters for security.'
    )
  }
  
  cachedSecret = new TextEncoder().encode(secret)
  return cachedSecret
}

// Session configuration
export const SESSION_CONFIG = {
  cookieName: 'nexik_session',
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  expirationTime: '7d',
  algorithm: 'HS256' as const,
  cookieOptions: {
    httpOnly: true,
    secure: !isDevelopment,
    sameSite: 'lax' as const,
    path: '/'
  }
}
