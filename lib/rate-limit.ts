/**
 * Rate Limiting Utility
 * In-memory rate limiter with database fallback for production
 */

import { NextRequest, NextResponse } from 'next/server'

// In-memory store for development
const memoryStore = new Map<string, { count: number; resetAt: number }>()

interface RateLimitConfig {
  windowMs: number     // Time window in milliseconds
  maxRequests: number  // Max requests per window
  message?: string     // Custom error message
  keyPrefix?: string   // Prefix for rate limit key
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
  headers: Record<string, string>
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,  // 1 minute
  maxRequests: 30,      // 30 requests per minute
  message: 'Too many requests, please try again later.',
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest, keyPrefix?: string): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  const prefix = keyPrefix || 'rate-limit'
  return `${prefix}:${ip}`
}

/**
 * Check rate limit using in-memory store
 */
function checkMemoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Get or create entry
  let entry = memoryStore.get(key)
  
  // Clean up expired entries periodically
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore.entries()) {
      if (v.resetAt < now) {
        memoryStore.delete(k)
      }
    }
  }
  
  if (!entry || entry.resetAt < now) {
    // New window
    entry = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    memoryStore.set(key, entry)
    
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: entry.resetAt,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(config.maxRequests - 1),
        'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      },
    }
  }
  
  // Existing window
  entry.count++
  memoryStore.set(key, entry)
  
  const remaining = Math.max(0, config.maxRequests - entry.count)
  const success = entry.count <= config.maxRequests
  
  return {
    success,
    remaining,
    resetAt: entry.resetAt,
    headers: {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
      ...(success ? {} : { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) }),
    },
  }
}

/**
 * Rate limit check with database fallback (for production with multiple instances)
 */
async function checkDatabaseRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  try {
    const { query, execute } = await import('@/lib/db')
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMs)
    
    // Clean old entries
    await execute(
      'DELETE FROM nexik_rate_limits WHERE window_start < $1',
      [windowStart]
    )
    
    // Upsert rate limit entry
    const result = await query<{ request_count: number; window_start: Date }>(
      `INSERT INTO nexik_rate_limits (key, window_start, request_count)
       VALUES ($1, date_trunc('minute', $2::timestamp), 1)
       ON CONFLICT (key, window_start) 
       DO UPDATE SET request_count = nexik_rate_limits.request_count + 1
       RETURNING request_count, window_start`,
      [key, now]
    )
    
    const count = result[0]?.request_count || 1
    const resetAt = new Date(result[0]?.window_start || now).getTime() + config.windowMs
    const remaining = Math.max(0, config.maxRequests - count)
    const success = count <= config.maxRequests
    
    return {
      success,
      remaining,
      resetAt,
      headers: {
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        ...(success ? {} : { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) }),
      },
    }
  } catch (error) {
    console.error('[Rate Limit] Database error, falling back to memory:', error)
    // Fall back to memory store if database is unavailable
    return checkMemoryRateLimit(key, config)
  }
}

/**
 * Main rate limit function
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  const key = getClientId(request, finalConfig.keyPrefix)
  
  // Use database in production for distributed rate limiting
  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    return checkDatabaseRateLimit(key, finalConfig)
  }
  
  // Use memory store in development
  return checkMemoryRateLimit(key, finalConfig)
}

/**
 * Rate limit middleware wrapper
 * Returns null if request is allowed, NextResponse if rate limited
 */
export async function withRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<NextResponse | null> {
  const result = await rateLimit(request, config)
  
  if (!result.success) {
    const message = config.message || DEFAULT_CONFIG.message
    return NextResponse.json(
      { 
        error: message,
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      { 
        status: 429,
        headers: result.headers,
      }
    )
  }
  
  return null
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // Strict: 10 requests per minute (for auth, sensitive operations)
  strict: (request: NextRequest) => withRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'rl-strict',
    message: 'Too many attempts. Please wait a minute before trying again.',
  }),
  
  // Standard: 30 requests per minute (default for most APIs)
  standard: (request: NextRequest) => withRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyPrefix: 'rl-standard',
  }),
  
  // Relaxed: 100 requests per minute (for read-only public endpoints)
  relaxed: (request: NextRequest) => withRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyPrefix: 'rl-relaxed',
  }),
  
  // AI Chat: 20 requests per minute (balancing UX with cost)
  chat: (request: NextRequest) => withRateLimit(request, {
    windowMs: 60 * 1000,
    maxRequests: 20,
    keyPrefix: 'rl-chat',
    message: 'Too many messages. Please wait a moment before sending more.',
  }),
}
