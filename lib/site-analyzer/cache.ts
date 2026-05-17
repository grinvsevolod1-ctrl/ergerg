import Redis from 'ioredis'
import { query, queryOne, execute } from '../db'
import type { NicheCache, ScrapedSite, PreviewShare } from './types'

// Redis client for fast caching
let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    })
    redis.on('error', (err) => {
      console.error('[Cache] Redis error:', err)
    })
  }
  return redis
}

// Normalize niche for consistent caching
export function normalizeNiche(niche: string): string {
  return niche
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9\s]/gi, '')
    .replace(/\s+/g, '_')
}

// Get cached niche from Redis (fast) or PostgreSQL (fallback)
export async function getNicheCache(niche: string): Promise<NicheCache | null> {
  const normalizedNiche = normalizeNiche(niche)
  const redisKey = `niche:${normalizedNiche}`

  try {
    // Try Redis first
    const cached = await getRedis().get(redisKey)
    if (cached) {
      return JSON.parse(cached) as NicheCache
    }
  } catch (err) {
    console.warn('[Cache] Redis get failed, trying PostgreSQL:', err)
  }

  // Fallback to PostgreSQL
  const dbCache = await queryOne<{
    niche: string
    normalized_niche: string
    sites: ScrapedSite[]
    searched_at: Date
    expires_at: Date
  }>(
    'SELECT * FROM niche_cache WHERE normalized_niche = $1 AND expires_at > NOW()',
    [normalizedNiche]
  )

  if (dbCache) {
    const cache: NicheCache = {
      niche: dbCache.niche,
      normalizedNiche: dbCache.normalized_niche,
      sites: dbCache.sites,
      searchedAt: dbCache.searched_at.toISOString(),
      expiresAt: dbCache.expires_at.toISOString(),
    }

    // Restore to Redis
    try {
      const ttl = Math.floor((new Date(cache.expiresAt).getTime() - Date.now()) / 1000)
      if (ttl > 0) {
        await getRedis().setex(redisKey, ttl, JSON.stringify(cache))
      }
    } catch (err) {
      console.warn('[Cache] Redis set failed:', err)
    }

    return cache
  }

  return null
}

// Save niche cache to both Redis and PostgreSQL
export async function setNicheCache(
  niche: string,
  sites: ScrapedSite[],
  ttlDays: number = 7
): Promise<NicheCache> {
  const normalizedNiche = normalizeNiche(niche)
  const now = new Date()
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000)
  const redisKey = `niche:${normalizedNiche}`

  const cache: NicheCache = {
    niche,
    normalizedNiche,
    sites,
    searchedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  }

  // Save to PostgreSQL (upsert)
  await execute(
    `INSERT INTO niche_cache (niche, normalized_niche, sites, searched_at, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (normalized_niche) 
     DO UPDATE SET sites = $3, searched_at = $4, expires_at = $5`,
    [niche, normalizedNiche, JSON.stringify(sites), now, expiresAt]
  )

  // Save to Redis
  try {
    const ttlSeconds = ttlDays * 24 * 60 * 60
    await getRedis().setex(redisKey, ttlSeconds, JSON.stringify(cache))
  } catch (err) {
    console.warn('[Cache] Redis set failed:', err)
  }

  return cache
}

// Add a site to existing cache
export async function addSiteToCache(niche: string, site: ScrapedSite): Promise<void> {
  const existing = await getNicheCache(niche)
  if (existing) {
    const sites = [...existing.sites, site]
    await setNicheCache(niche, sites)
  } else {
    await setNicheCache(niche, [site])
  }
}

// Rate limiting
export async function checkRateLimit(ip: string, limit: number = 5, windowSeconds: number = 3600): Promise<boolean> {
  const key = `ratelimit:${ip}`
  try {
    const current = await getRedis().incr(key)
    if (current === 1) {
      await getRedis().expire(key, windowSeconds)
    }
    return current <= limit
  } catch (err) {
    console.warn('[Cache] Rate limit check failed:', err)
    return true // Allow on error
  }
}

export async function getRateLimitRemaining(ip: string, limit: number = 5): Promise<number> {
  const key = `ratelimit:${ip}`
  try {
    const current = await getRedis().get(key)
    return Math.max(0, limit - (parseInt(current || '0', 10)))
  } catch {
    return limit
  }
}

// Job status caching
export async function setJobStatus(jobId: string, status: Record<string, unknown>): Promise<void> {
  try {
    await getRedis().setex(`job:${jobId}`, 600, JSON.stringify(status)) // 10 min TTL
  } catch (err) {
    console.warn('[Cache] Job status set failed:', err)
  }
}

export async function getJobStatus(jobId: string): Promise<Record<string, unknown> | null> {
  try {
    const data = await getRedis().get(`job:${jobId}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// Preview share management
export async function createPreviewShare(data: Omit<PreviewShare, 'id' | 'createdAt' | 'expiresAt'>): Promise<string> {
  const result = await query<{ id: string }>(
    `INSERT INTO preview_shares (niche, variant_index, user_data, html)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [data.niche, data.variantIndex, JSON.stringify(data.userData), data.html]
  )
  return result[0].id
}

export async function getPreviewShare(id: string): Promise<PreviewShare | null> {
  const result = await queryOne<{
    id: string
    niche: string
    variant_index: number
    user_data: object
    html: string
    created_at: Date
    expires_at: Date
  }>(
    'SELECT * FROM preview_shares WHERE id = $1 AND expires_at > NOW()',
    [id]
  )

  if (!result) return null

  return {
    id: result.id,
    niche: result.niche,
    variantIndex: result.variant_index,
    userData: result.user_data as PreviewShare['userData'],
    html: result.html,
    createdAt: result.created_at.toISOString(),
    expiresAt: result.expires_at.toISOString(),
  }
}

// Cleanup expired data
export async function cleanupExpired(): Promise<void> {
  await execute('DELETE FROM niche_cache WHERE expires_at < NOW()')
  await execute('DELETE FROM preview_shares WHERE expires_at < NOW()')
}
