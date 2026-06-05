import { NextRequest, NextResponse } from "next/server"

interface WebsiteAnalysis {
  platform: string | null
  platformConfidence: number
  businessName: string
  description: string
  services: string[]
  contacts: {
    phone?: string
    email?: string
    address?: string
  }
  workingHours?: string
  socialLinks: string[]
  registrar?: string
}

// Platform detection patterns
const platformPatterns: Record<string, { patterns: RegExp[], confidence: number }> = {
  tilda: {
    patterns: [
      /tilda\.cc/i,
      /tildacdn\.com/i,
      /<meta[^>]*generator[^>]*tilda/i,
      /t-records/i,
      /t-cover/i,
      /t-container/i,
    ],
    confidence: 0.95
  },
  wordpress: {
    patterns: [
      /wp-content/i,
      /wp-includes/i,
      /wordpress/i,
      /<meta[^>]*generator[^>]*WordPress/i,
    ],
    confidence: 0.9
  },
  wix: {
    patterns: [
      /wix\.com/i,
      /wixstatic\.com/i,
      /wix-code-sdk/i,
      /_wix_browser_sess/i,
    ],
    confidence: 0.95
  },
  shopify: {
    patterns: [
      /cdn\.shopify\.com/i,
      /shopify\.com/i,
      /Shopify\.theme/i,
    ],
    confidence: 0.95
  },
  squarespace: {
    patterns: [
      /squarespace\.com/i,
      /sqsp\.net/i,
      /squarespace-cdn/i,
    ],
    confidence: 0.95
  },
  bitrix: {
    patterns: [
      /bitrix/i,
      /bx-panel/i,
      /1c-bitrix/i,
    ],
    confidence: 0.9
  },
  webflow: {
    patterns: [
      /webflow\.com/i,
      /webflow/i,
    ],
    confidence: 0.9
  },
  react: {
    patterns: [
      /__NEXT_DATA__/i,
      /data-reactroot/i,
      /_next\/static/i,
    ],
    confidence: 0.8
  },
  nextjs: {
    patterns: [
      /__NEXT_DATA__/i,
      /_next\/static/i,
      /next\.js/i,
    ],
    confidence: 0.85
  },
}

// DNS registrar detection via NS records
const registrarPatterns: Record<string, RegExp[]> = {
  "REG.RU": [/reg\.ru/i, /regru/i],
  "Beget": [/beget/i],
  "Timeweb": [/timeweb/i],
  "NIC.RU": [/nic\.ru/i],
  "RU-CENTER": [/nic\.ru/i],
  "GoDaddy": [/domaincontrol\.com/i, /godaddy/i],
  "Namecheap": [/registrar-servers\.com/i, /namecheap/i],
  "Cloudflare": [/cloudflare/i],
  "Google Domains": [/googledomains/i],
}

function detectPlatform(html: string): { platform: string | null, confidence: number } {
  for (const [platform, { patterns, confidence }] of Object.entries(platformPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(html)) {
        return { platform, confidence }
      }
    }
  }
  return { platform: "html", confidence: 0.5 }
}

function extractBusinessName(html: string, url: string): string {
  // Try to extract from <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    // Clean up title - remove common suffixes
    const title = titleMatch[1]
      .replace(/\s*[-|–—]\s*.*$/, '') // Remove anything after - | – —
      .replace(/Главная\s*/i, '')
      .replace(/Home\s*/i, '')
      .trim()
    
    if (title.length > 3 && title.length < 100) {
      return title
    }
  }
  
  // Try og:site_name
  const ogSiteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i)
  if (ogSiteMatch) {
    return ogSiteMatch[1]
  }
  
  // Fallback to domain
  try {
    const domain = new URL(url).hostname.replace('www.', '')
    return domain.split('.')[0]
  } catch {
    return "Бизнес"
  }
}

function extractDescription(html: string): string {
  // Meta description
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
  if (metaDesc) {
    return metaDesc[1].slice(0, 300)
  }
  
  // OG description
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
  if (ogDesc) {
    return ogDesc[1].slice(0, 300)
  }
  
  return ""
}

function extractServices(html: string): string[] {
  const services: string[] = []
  
  // Look for common service list patterns
  // h2/h3 headings that might be services
  const headings = html.match(/<h[23][^>]*>([^<]{3,50})<\/h[23]>/gi) || []
  for (const h of headings.slice(0, 10)) {
    const match = h.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i)
    if (match) {
      const text = match[1].trim()
      // Filter out navigation/common headings
      if (!/(о нас|контакт|отзыв|about|contact|portfolio|блог|новост)/i.test(text)) {
        services.push(text)
      }
    }
  }
  
  return services.slice(0, 8)
}

function extractContacts(html: string): { phone?: string, email?: string, address?: string } {
  const contacts: { phone?: string, email?: string, address?: string } = {}
  
  // Phone patterns
  const phonePatterns = [
    /\+7[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
    /8[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g,
    /\+\d{1,3}[\s\-]?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{2,4}/g,
  ]
  
  for (const pattern of phonePatterns) {
    const match = html.match(pattern)
    if (match) {
      contacts.phone = match[0]
      break
    }
  }
  
  // Email
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i)
  if (emailMatch && !emailMatch[0].includes('example') && !emailMatch[0].includes('test')) {
    contacts.email = emailMatch[0]
  }
  
  return contacts
}

function extractSocialLinks(html: string): string[] {
  const socials: string[] = []
  const patterns = [
    /https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._]+/gi,
    /https?:\/\/(www\.)?vk\.com\/[a-zA-Z0-9._]+/gi,
    /https?:\/\/(www\.)?t\.me\/[a-zA-Z0-9._]+/gi,
    /https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._]+/gi,
    /https?:\/\/(www\.)?youtube\.com\/(c\/|channel\/|@)?[a-zA-Z0-9._-]+/gi,
  ]
  
  for (const pattern of patterns) {
    const matches = html.match(pattern)
    if (matches) {
      socials.push(matches[0])
    }
  }
  
  return [...new Set(socials)]
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    // Normalize URL
    let normalizedUrl = url
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    
    // Fetch the website
    let html = ""
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        redirect: 'follow',
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      html = await response.text()
    } catch (fetchError) {
      console.error('[analyze-website] Fetch error:', fetchError)
      // Return minimal analysis if fetch fails
      return NextResponse.json({
        success: true,
        analysis: {
          platform: "unknown",
          platformConfidence: 0,
          businessName: new URL(normalizedUrl).hostname.replace('www.', '').split('.')[0],
          description: "",
          services: [],
          contacts: {},
          socialLinks: []
        }
      })
    }
    
    // Detect platform
    const { platform, confidence } = detectPlatform(html)
    
    // Extract info
    const businessName = extractBusinessName(html, normalizedUrl)
    const description = extractDescription(html)
    const services = extractServices(html)
    const contacts = extractContacts(html)
    const socialLinks = extractSocialLinks(html)
    
    const analysis: WebsiteAnalysis = {
      platform,
      platformConfidence: confidence,
      businessName,
      description,
      services,
      contacts,
      socialLinks,
    }
    
    return NextResponse.json({
      success: true,
      analysis
    })
    
  } catch (error) {
    console.error('[analyze-website] Error:', error)
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 500 }
    )
  }
}
