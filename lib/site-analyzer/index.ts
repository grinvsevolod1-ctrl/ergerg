// Site Analyzer - Main Module
// Exports all analyzer functionality

export * from './types'
export * from './cache'
export { searchSites, searchYandex, searchGoogle } from './search-yandex'
export { scrapeSite, scrapeMultiple, closeBrowser } from './scraper'
export { sanitizeHTML, extractTextContent, extractMainHeading } from './sanitizer'
export { replaceContent, validateReplacement } from './content-replacer'

import { searchSites } from './search-yandex'
import { scrapeMultiple } from './scraper'
import { sanitizeHTML } from './sanitizer'
import { replaceContent } from './content-replacer'
import { getNicheCache, setNicheCache, checkRateLimit } from './cache'
import type { UserData, AnalyzeResponse, ScrapedSite } from './types'

interface AnalyzeOptions {
  variantIndex?: number
  forceRefresh?: boolean
  maxVariants?: number
}

// Main analyze function - orchestrates the full pipeline
export async function analyzeSite(
  userData: UserData,
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  const { variantIndex = 0, forceRefresh = false, maxVariants = 5 } = options
  
  try {
    // 1. Check cache first
    let cache = forceRefresh ? null : await getNicheCache(userData.niche)
    
    // 2. If no cache, search and scrape
    if (!cache || cache.sites.length === 0) {
      console.log('[Analyzer] No cache found, searching for:', userData.niche)
      
      // Search for sites
      const searchResults = await searchSites(userData.niche, 10)
      
      if (searchResults.length === 0) {
        return {
          success: false,
          currentVariant: 0,
          totalVariants: 0,
          error: 'К сожалению, наша система временно перегружена. Попробуйте позже или свяжитесь с нами.',
        }
      }
      
      console.log('[Analyzer] Found', searchResults.length, 'search results')
      
      // Scrape sites
      const scrapedSites = await scrapeMultiple(
        searchResults.map(r => r.url),
        maxVariants,
        30000
      )
      
      if (scrapedSites.length === 0) {
        return {
          success: false,
          currentVariant: 0,
          totalVariants: 0,
          error: 'К сожалению, наша система временно перегружена. Попробуйте позже или свяжитесь с нами.',
        }
      }
      
      console.log('[Analyzer] Scraped', scrapedSites.length, 'sites')
      
      // Sanitize all scraped sites
      const sanitizedSites: ScrapedSite[] = scrapedSites.map(site => ({
        url: site.url,
        html: sanitizeHTML(site.html, { addWatermark: false }), // Add watermark later
        title: site.title,
        scrapedAt: new Date().toISOString(),
      }))
      
      // Cache the results
      cache = await setNicheCache(userData.niche, sanitizedSites)
      console.log('[Analyzer] Cached', sanitizedSites.length, 'sites for niche:', userData.niche)
    }
    
    // 3. Get requested variant
    const sites = cache.sites
    const safeIndex = Math.min(variantIndex, sites.length - 1)
    const selectedSite = sites[safeIndex]
    
    if (!selectedSite) {
      return {
        success: false,
        currentVariant: 0,
        totalVariants: 0,
        error: 'К сожалению, наша система временно перегружена. Попробуйте позже или свяжитесь с нами.',
      }
    }
    
    // 4. Replace content with user data
    const { html: processedHtml } = replaceContent(selectedSite.html, userData)
    
    // 5. Add watermark to final output
    const finalHtml = sanitizeHTML(processedHtml, {
      removeScripts: false, // Already removed
      removeTracking: false,
      removeForms: false,
      removeExternalLinks: false,
      removeChats: false,
      addWatermark: true,
      watermarkText: 'Превью создано в NetNext',
    })
    
    return {
      success: true,
      html: finalHtml,
      currentVariant: safeIndex,
      totalVariants: sites.length,
      sourceUrl: selectedSite.url,
    }
    
  } catch (error) {
    console.error('[Analyzer] Error:', error)
    return {
      success: false,
      currentVariant: 0,
      totalVariants: 0,
      error: 'К сожалению, наша система временно перегружена. Попробуйте позже или свяжитесь с нами.',
    }
  }
}

// Check if user can make request (rate limiting)
export async function canMakeRequest(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const allowed = await checkRateLimit(ip, 5, 3600) // 5 requests per hour
  const remaining = allowed ? 5 : 0 // Simplified, could calculate actual remaining
  return { allowed, remaining }
}
