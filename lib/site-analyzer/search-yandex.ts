import * as cheerio from 'cheerio'

interface SearchResult {
  url: string
  title: string
  snippet: string
}

// Domains to exclude from results
const EXCLUDED_DOMAINS = [
  'yandex.ru', 'yandex.by', 'yandex.com',
  'google.com', 'google.ru', 'google.by',
  'vk.com', 'facebook.com', 'instagram.com',
  'youtube.com', 'twitter.com', 'x.com',
  'wikipedia.org', 'avito.ru', 'kufar.by',
  'tilda.cc', 'tilda.ws',
  'wix.com', 'wordpress.com',
  'linkedin.com', 'pinterest.com',
  't.me', 'telegram.me',
  'wa.me', 'whatsapp.com',
]

function isExcludedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return EXCLUDED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    )
  } catch {
    return true
  }
}

function isValidSiteUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    // No excluded domains
    if (isExcludedDomain(url)) return false
    // No file downloads
    if (/\.(pdf|doc|docx|xls|xlsx|zip|rar)$/i.test(parsed.pathname)) return false
    return true
  } catch {
    return false
  }
}

// Search using Yandex (parsing HTML results)
export async function searchYandex(query: string, limit: number = 10): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  // Build search URL
  const searchQuery = encodeURIComponent(`${query} сайт`)
  const searchUrl = `https://yandex.ru/search/?text=${searchQuery}&lr=157` // lr=157 is Minsk
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!response.ok) {
      console.error('[Search] Yandex returned status:', response.status)
      return []
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Parse search results
    // Yandex uses various selectors, try multiple
    const selectors = [
      'li.serp-item a.organic__url',
      'li.serp-item a.link',
      'div.organic a.organic__url',
      'a[href*="http"]:not([href*="yandex"])',
    ]
    
    for (const selector of selectors) {
      $(selector).each((_, element) => {
        if (results.length >= limit) return false
        
        const $el = $(element)
        let href = $el.attr('href') || ''
        
        // Handle Yandex redirect URLs
        if (href.includes('/redir/')) {
          const match = href.match(/url=([^&]+)/)
          if (match) {
            href = decodeURIComponent(match[1])
          }
        }
        
        // Clean and validate URL
        if (href.startsWith('//')) href = 'https:' + href
        if (!href.startsWith('http')) return
        
        if (!isValidSiteUrl(href)) return
        
        // Avoid duplicates
        if (results.some(r => r.url === href)) return
        
        const title = $el.text().trim() || $el.attr('title') || ''
        const snippet = $el.closest('li, div').find('.organic__content-wrapper, .text-container').text().trim().slice(0, 200)
        
        results.push({
          url: href,
          title: title.slice(0, 100),
          snippet,
        })
      })
      
      if (results.length >= limit) break
    }
    
    // Alternative: parse from JSON in page
    if (results.length === 0) {
      const scriptMatch = html.match(/window\.__PRELOADED_STATE__\s*=\s*(\{[\s\S]+?\});?\s*<\/script>/)
      if (scriptMatch) {
        try {
          const data = JSON.parse(scriptMatch[1])
          // Navigate to search results in JSON structure
          const items = data?.searchResults?.searchResults?.items || []
          for (const item of items.slice(0, limit)) {
            if (item.url && isValidSiteUrl(item.url)) {
              results.push({
                url: item.url,
                title: item.title || '',
                snippet: item.snippet || '',
              })
            }
          }
        } catch (e) {
          console.warn('[Search] Failed to parse Yandex JSON:', e)
        }
      }
    }
    
  } catch (error) {
    console.error('[Search] Yandex search failed:', error)
  }
  
  return results
}

// Fallback: Search using Google (if Yandex fails)
export async function searchGoogle(query: string, limit: number = 10): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  const searchQuery = encodeURIComponent(`${query} сайт`)
  const searchUrl = `https://www.google.com/search?q=${searchQuery}&hl=ru&gl=by`
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    })
    
    if (!response.ok) return []
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    // Google search result links
    $('a[href^="/url?q="], a[href^="http"]:not([href*="google"])').each((_, element) => {
      if (results.length >= limit) return false
      
      let href = $(element).attr('href') || ''
      
      // Handle Google redirect
      if (href.startsWith('/url?q=')) {
        const match = href.match(/\/url\?q=([^&]+)/)
        if (match) {
          href = decodeURIComponent(match[1])
        }
      }
      
      if (!isValidSiteUrl(href)) return
      if (results.some(r => r.url === href)) return
      
      const title = $(element).text().trim()
      
      results.push({
        url: href,
        title: title.slice(0, 100),
        snippet: '',
      })
    })
    
  } catch (error) {
    console.error('[Search] Google search failed:', error)
  }
  
  return results
}

// Combined search with fallback
export async function searchSites(niche: string, limit: number = 10): Promise<SearchResult[]> {
  // Try Yandex first
  const results = await searchYandex(niche, limit)
  
  // Fallback to Google if Yandex returns nothing
  if (results.length < 3) {
    console.log('[Search] Yandex returned few results, trying Google...')
    const googleResults = await searchGoogle(niche, limit)
    
    // Merge results, avoiding duplicates
    for (const result of googleResults) {
      if (!results.some(r => r.url === result.url)) {
        results.push(result)
      }
      if (results.length >= limit) break
    }
  }
  
  return results.slice(0, limit)
}
