import { chromium, Browser, Page } from 'playwright'

let browserInstance: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
    })
  }
  return browserInstance
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}

interface ScrapeResult {
  success: boolean
  html?: string
  title?: string
  error?: string
}

export async function scrapeSite(url: string, timeout: number = 30000): Promise<ScrapeResult> {
  let page: Page | null = null
  
  try {
    const browser = await getBrowser()
    page = await browser.newPage()
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    // Set user agent
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
    })
    
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout,
    })
    
    // Wait additional time for JS rendering
    await page.waitForTimeout(2000)
    
    // Get page title
    const title = await page.title()
    
    // Convert all images to base64
    await page.evaluate(async () => {
      const images = document.querySelectorAll('img')
      
      for (const img of images) {
        if (img.src && img.src.startsWith('http')) {
          try {
            const response = await fetch(img.src)
            const blob = await response.blob()
            const reader = new FileReader()
            
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  img.src = reader.result
                }
                resolve()
              }
              reader.readAsDataURL(blob)
            })
          } catch {
            // Keep original src if fetch fails
          }
        }
      }
      
      // Convert background images to base64
      const elementsWithBg = document.querySelectorAll('[style*="background"]')
      for (const el of elementsWithBg) {
        const style = (el as HTMLElement).style.backgroundImage
        const match = style.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/)
        
        if (match) {
          try {
            const response = await fetch(match[1])
            const blob = await response.blob()
            const reader = new FileReader()
            
            await new Promise<void>((resolve) => {
              reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                  (el as HTMLElement).style.backgroundImage = `url(${reader.result})`
                }
                resolve()
              }
              reader.readAsDataURL(blob)
            })
          } catch {
            // Keep original
          }
        }
      }
    })
    
    // Get computed styles and inline them
    const html = await page.evaluate(() => {
      // Function to get computed styles as string
      function getInlineStyles(element: Element): string {
        const computed = window.getComputedStyle(element)
        const styles: string[] = []
        
        // Key properties to preserve
        const props = [
          'color', 'background-color', 'background-image', 'background',
          'font-family', 'font-size', 'font-weight', 'line-height', 'text-align',
          'padding', 'margin', 'border', 'border-radius',
          'width', 'max-width', 'min-width', 'height', 'max-height', 'min-height',
          'display', 'flex-direction', 'justify-content', 'align-items', 'gap',
          'position', 'top', 'right', 'bottom', 'left', 'z-index',
          'box-shadow', 'text-shadow', 'opacity', 'transform',
          'grid-template-columns', 'grid-gap',
        ]
        
        for (const prop of props) {
          const value = computed.getPropertyValue(prop)
          if (value && value !== 'none' && value !== 'normal' && value !== 'auto') {
            styles.push(`${prop}: ${value}`)
          }
        }
        
        return styles.join('; ')
      }
      
      // Clone document for modification
      const clone = document.documentElement.cloneNode(true) as HTMLElement
      
      // Process all elements
      const allElements = clone.querySelectorAll('*')
      const originalElements = document.querySelectorAll('*')
      
      allElements.forEach((el, index) => {
        const original = originalElements[index]
        if (original && el instanceof HTMLElement) {
          const inlineStyle = getInlineStyles(original)
          if (inlineStyle) {
            el.setAttribute('style', inlineStyle)
          }
        }
      })
      
      return clone.outerHTML
    })
    
    return {
      success: true,
      html,
      title,
    }
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Scraper] Failed to scrape:', url, message)
    
    return {
      success: false,
      error: message,
    }
  } finally {
    if (page) {
      await page.close().catch(() => {})
    }
  }
}

// Batch scrape multiple URLs, return first successful results
export async function scrapeMultiple(
  urls: string[],
  maxResults: number = 5,
  timeout: number = 30000
): Promise<Array<{ url: string; html: string; title: string }>> {
  const results: Array<{ url: string; html: string; title: string }> = []
  
  for (const url of urls) {
    if (results.length >= maxResults) break
    
    console.log('[Scraper] Scraping:', url)
    const result = await scrapeSite(url, timeout)
    
    if (result.success && result.html) {
      results.push({
        url,
        html: result.html,
        title: result.title || url,
      })
      console.log('[Scraper] Success:', url)
    } else {
      console.log('[Scraper] Failed:', url, result.error)
    }
  }
  
  return results
}
