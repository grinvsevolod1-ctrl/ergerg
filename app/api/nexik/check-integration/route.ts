import { NextRequest, NextResponse } from "next/server"

// Platform detection patterns
const platformPatterns: Record<string, RegExp[]> = {
  tilda: [/tilda\.cc/i, /tildacdn\.com/i, /t-records/i],
  wordpress: [/wp-content/i, /wp-includes/i, /wordpress/i],
  wix: [/wix\.com/i, /wixstatic\.com/i],
  shopify: [/cdn\.shopify\.com/i, /shopify\.com/i],
  squarespace: [/squarespace\.com/i, /sqsp\.net/i],
  bitrix: [/bitrix/i, /bx-panel/i],
  nextjs: [/__NEXT_DATA__/i, /_next\/static/i],
}

export async function POST(req: NextRequest) {
  try {
    const { url, widgetId } = await req.json()
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }
    
    // Normalize URL
    let normalizedUrl = url
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl
    }
    
    let html = ""
    let platform: string | null = null
    let installed = false
    
    try {
      const response = await fetch(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
      })
      
      if (!response.ok) {
        return NextResponse.json({
          installed: false,
          platform: null,
          error: `HTTP ${response.status}`
        })
      }
      
      html = await response.text()
      
      // Check if widget is installed
      // Look for our widget script
      const widgetPatterns = [
        /nexik\.io\/widget\.js/i,
        /netnext\.site\/nexik\/widget\.js/i,
        new RegExp(`data-id=["']${widgetId}["']`, 'i'),
        /nexik-widget/i,
      ]
      
      for (const pattern of widgetPatterns) {
        if (pattern.test(html)) {
          installed = true
          break
        }
      }
      
      // Detect platform
      for (const [platformName, patterns] of Object.entries(platformPatterns)) {
        for (const pattern of patterns) {
          if (pattern.test(html)) {
            platform = platformName
            break
          }
        }
        if (platform) break
      }
      
    } catch (fetchError) {
      console.error('[check-integration] Fetch error:', fetchError)
      return NextResponse.json({
        installed: false,
        platform: null,
        error: 'Could not fetch website'
      })
    }
    
    return NextResponse.json({
      installed,
      platform,
      url: normalizedUrl
    })
    
  } catch (error) {
    console.error('[check-integration] Error:', error)
    return NextResponse.json(
      { error: "Failed to check integration" },
      { status: 500 }
    )
  }
}
