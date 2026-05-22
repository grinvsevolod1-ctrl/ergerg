import * as cheerio from 'cheerio'

interface SanitizeOptions {
  removeScripts?: boolean
  removeTracking?: boolean
  removeForms?: boolean
  removeExternalLinks?: boolean
  removeChats?: boolean
  addWatermark?: boolean
  watermarkText?: string
}

const defaultOptions: SanitizeOptions = {
  removeScripts: true,
  removeTracking: true,
  removeForms: true,
  removeExternalLinks: true,
  removeChats: true,
  addWatermark: true,
  watermarkText: 'Превью создано в NetNext',
}

// Tracking and analytics patterns to remove
const TRACKING_PATTERNS = [
  /google-analytics/i,
  /googletagmanager/i,
  /gtag/i,
  /ga\.js/i,
  /analytics/i,
  /metrika/i,
  /mc\.yandex/i,
  /facebook.*pixel/i,
  /fbq/i,
  /pixel/i,
  /hotjar/i,
  /clarity/i,
  /amplitude/i,
  /mixpanel/i,
  /segment/i,
  /intercom/i,
  /crisp/i,
  /tawk/i,
  /jivosite/i,
  /jivo/i,
  /carrotquest/i,
  /carrot/i,
  /calltouch/i,
  /roistat/i,
  /comagic/i,
  /mango/i,
  /callibri/i,
  /envybox/i,
  /bitrix24/i,
  /amocrm/i,
  /usedesk/i,
  /livechat/i,
  /chatra/i,
  /zendesk/i,
  /freshchat/i,
  /drift/i,
  /hubspot/i,
]

// Chat widget selectors to remove
const CHAT_SELECTORS = [
  '[id*="jivo"]',
  '[class*="jivo"]',
  '[id*="carrot"]',
  '[class*="carrot"]',
  '[id*="chat"]',
  '[class*="chat-widget"]',
  '[id*="tawk"]',
  '[class*="tawk"]',
  '[id*="crisp"]',
  '[class*="crisp"]',
  '[id*="intercom"]',
  '[class*="intercom"]',
  '.widget-wrapper',
  '#envybox',
  '.envybox',
  '[data-widget]',
]

export function sanitizeHTML(html: string, options: SanitizeOptions = {}): string {
  const opts = { ...defaultOptions, ...options }
  const $ = cheerio.load(html)
  
  // Remove all script tags
  if (opts.removeScripts) {
    $('script').remove()
    $('noscript').remove()
  }
  
  // Remove tracking and analytics
  if (opts.removeTracking) {
    // Remove tracking scripts by src/content
    $('script').each((_, el) => {
      const src = $(el).attr('src') || ''
      const content = $(el).html() || ''
      
      for (const pattern of TRACKING_PATTERNS) {
        if (pattern.test(src) || pattern.test(content)) {
          $(el).remove()
          break
        }
      }
    })
    
    // Remove tracking images (pixels)
    $('img').each((_, el) => {
      const src = $(el).attr('src') || ''
      const width = $(el).attr('width')
      const height = $(el).attr('height')
      
      // Remove 1x1 tracking pixels
      if ((width === '1' || width === '0') && (height === '1' || height === '0')) {
        $(el).remove()
        return
      }
      
      for (const pattern of TRACKING_PATTERNS) {
        if (pattern.test(src)) {
          $(el).remove()
          break
        }
      }
    })
    
    // Remove tracking iframes
    $('iframe').each((_, el) => {
      const src = $(el).attr('src') || ''
      for (const pattern of TRACKING_PATTERNS) {
        if (pattern.test(src)) {
          $(el).remove()
          break
        }
      }
    })
  }
  
  // Remove forms or disable them
  if (opts.removeForms) {
    $('form').each((_, el) => {
      // Remove action and method to disable
      $(el).removeAttr('action')
      $(el).removeAttr('method')
      $(el).attr('onsubmit', 'return false;')
    })
    
    // Disable submit buttons
    $('button[type="submit"], input[type="submit"]').each((_, el) => {
      $(el).attr('disabled', 'disabled')
      $(el).attr('onclick', 'return false;')
    })
  }
  
  // Remove external links
  if (opts.removeExternalLinks) {
    $('a').each((_, el) => {
      const href = $(el).attr('href') || ''
      
      // Keep anchor links and empty hrefs
      if (href.startsWith('#') || href === '' || href === 'javascript:void(0)') {
        return
      }
      
      // Convert to non-functional
      $(el).attr('href', '#')
      $(el).attr('onclick', 'return false;')
      $(el).removeAttr('target')
    })
  }
  
  // Remove chat widgets
  if (opts.removeChats) {
    for (const selector of CHAT_SELECTORS) {
      $(selector).remove()
    }
  }
  
  // Remove event handlers from all elements
  $('*').each((_, el) => {
    const element = $(el)
    const attrs = (el as unknown as { attribs?: Record<string, string> }).attribs || {}
    
    for (const attr of Object.keys(attrs)) {
      if (attr.startsWith('on')) {
        element.removeAttr(attr)
      }
    }
  })
  
  // Remove meta refresh
  $('meta[http-equiv="refresh"]').remove()
  
  // Remove base tag (could redirect)
  $('base').remove()
  
  // Remove link preconnect to external domains
  $('link[rel="preconnect"], link[rel="dns-prefetch"]').remove()
  
  // Add watermark
  if (opts.addWatermark && opts.watermarkText) {
    const watermark = `
      <div id="netnext-watermark" style="
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        background: rgba(0, 0, 0, 0.85) !important;
        color: white !important;
        padding: 10px 20px !important;
        border-radius: 8px !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        z-index: 2147483647 !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        pointer-events: none !important;
        user-select: none !important;
      ">
        ${opts.watermarkText}
      </div>
    `
    $('body').append(watermark)
  }
  
  // Add base styles to ensure proper rendering
  const baseStyles = `
    <style id="netnext-base-styles">
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      img { max-width: 100%; height: auto; }
    </style>
  `
  $('head').append(baseStyles)
  
  return $.html()
}

// Extract text content from HTML for analysis
export function extractTextContent(html: string): string {
  const $ = cheerio.load(html)
  
  // Remove scripts and styles
  $('script, style, noscript').remove()
  
  // Get text
  return $('body').text().replace(/\s+/g, ' ').trim()
}

// Extract main heading
export function extractMainHeading(html: string): string | null {
  const $ = cheerio.load(html)
  
  // Try h1 first
  const h1 = $('h1').first().text().trim()
  if (h1) return h1
  
  // Try title
  const title = $('title').text().trim()
  if (title) return title
  
  // Try og:title
  const ogTitle = $('meta[property="og:title"]').attr('content')
  if (ogTitle) return ogTitle.trim()
  
  return null
}
