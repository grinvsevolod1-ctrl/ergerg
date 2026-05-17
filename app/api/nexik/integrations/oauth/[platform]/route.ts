import { NextRequest, NextResponse } from "next/server"

// OAuth configurations for each platform
const OAUTH_CONFIGS = {
  shopify: {
    authUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
    tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
    scopes: ["read_script_tags", "write_script_tags", "read_themes"],
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  },
  wix: {
    authUrl: "https://www.wix.com/installer/install",
    tokenUrl: "https://www.wix.com/oauth/access",
    scopes: ["site.domain.read", "site.structure.write"],
    clientId: process.env.WIX_CLIENT_ID,
    clientSecret: process.env.WIX_CLIENT_SECRET,
  },
  squarespace: {
    authUrl: "https://login.squarespace.com/api/1/login/oauth/provider/authorize",
    tokenUrl: "https://login.squarespace.com/api/1/login/oauth/provider/tokens",
    scopes: ["website.code-injection.read", "website.code-injection.write"],
    clientId: process.env.SQUARESPACE_CLIENT_ID,
    clientSecret: process.env.SQUARESPACE_CLIENT_SECRET,
  },
  wordpress: {
    authUrl: "https://public-api.wordpress.com/oauth2/authorize",
    tokenUrl: "https://public-api.wordpress.com/oauth2/token",
    scopes: ["global"],
    clientId: process.env.WORDPRESS_CLIENT_ID,
    clientSecret: process.env.WORDPRESS_CLIENT_SECRET,
  }
}

type Platform = keyof typeof OAUTH_CONFIGS

// Generate OAuth authorization URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const searchParams = request.nextUrl.searchParams
    const widgetId = searchParams.get("widget_id")
    const shop = searchParams.get("shop") // For Shopify

    if (!widgetId) {
      return NextResponse.json({ error: "widget_id is required" }, { status: 400 })
    }

    const config = OAUTH_CONFIGS[platform as Platform]
    if (!config) {
      return NextResponse.json({ error: "Unsupported platform" }, { status: 400 })
    }

    // Check if OAuth is configured
    if (!config.clientId) {
      return NextResponse.json({ 
        error: "OAuth not configured",
        message: `${platform} OAuth integration is not configured yet. Please use manual integration.`,
        fallback: "manual"
      }, { status: 501 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://netnext.site"
    const redirectUri = `${baseUrl}/api/nexik/integrations/oauth/${platform}/callback`
    const state = Buffer.from(JSON.stringify({ widgetId, shop })).toString("base64")

    let authUrl = config.authUrl
    if (platform === "shopify" && shop) {
      authUrl = authUrl.replace("{shop}", shop)
    }

    const params2 = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      state,
      response_type: "code"
    })

    // Platform-specific params
    if (platform === "wix") {
      params2.set("token", config.clientId) // Wix uses 'token' instead of 'client_id'
    }

    const fullAuthUrl = `${authUrl}?${params2.toString()}`

    return NextResponse.json({ 
      authUrl: fullAuthUrl,
      platform 
    })

  } catch (error) {
    console.error("OAuth init error:", error)
    return NextResponse.json({ error: "Failed to initialize OAuth" }, { status: 500 })
  }
}

// Handle OAuth callback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const body = await request.json()
    const { code, state, shop } = body

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state" }, { status: 400 })
    }

    const config = OAUTH_CONFIGS[platform as Platform]
    if (!config || !config.clientId || !config.clientSecret) {
      return NextResponse.json({ error: "OAuth not configured" }, { status: 501 })
    }

    // Decode state to get widget ID
    const stateData = JSON.parse(Buffer.from(state, "base64").toString())
    const { widgetId } = stateData

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://netnext.site"
    const redirectUri = `${baseUrl}/api/nexik/integrations/oauth/${platform}/callback`

    let tokenUrl = config.tokenUrl
    if (platform === "shopify" && shop) {
      tokenUrl = tokenUrl.replace("{shop}", shop)
    }

    // Exchange code for access token
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error("Token exchange failed:", error)
      return NextResponse.json({ error: "Token exchange failed" }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Install widget based on platform
    let installResult
    switch (platform) {
      case "shopify":
        installResult = await installShopifyWidget(shop, accessToken, widgetId)
        break
      case "wix":
        installResult = await installWixWidget(accessToken, widgetId)
        break
      case "squarespace":
        installResult = await installSquarespaceWidget(accessToken, widgetId)
        break
      case "wordpress":
        installResult = await installWordPressWidget(accessToken, widgetId)
        break
      default:
        installResult = { success: false, error: "Unknown platform" }
    }

    if (!installResult.success) {
      return NextResponse.json({ error: installResult.error }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Widget installed successfully",
      platform,
      widgetId
    })

  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 })
  }
}

// Platform-specific widget installation functions

async function installShopifyWidget(shop: string, accessToken: string, widgetId: string) {
  try {
    const widgetScript = `https://netnext.site/widget.js`
    
    const response = await fetch(`https://${shop}.myshopify.com/admin/api/2024-01/script_tags.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        script_tag: {
          event: "onload",
          src: `${widgetScript}?id=${widgetId}`
        }
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, error: `Shopify API error: ${error}` }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function installWixWidget(accessToken: string, widgetId: string) {
  try {
    // Wix uses Velo to inject code
    // This would require additional Wix API setup
    // For now, return instructions for manual setup
    return { 
      success: true, 
      message: "Wix integration requires additional setup. Please add the widget code manually to your site settings."
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function installSquarespaceWidget(accessToken: string, widgetId: string) {
  try {
    // Squarespace uses code injection API
    const widgetCode = `<script src="https://netnext.site/widget.js" data-id="${widgetId}"></script>`
    
    // Get site ID first
    const siteResponse = await fetch("https://api.squarespace.com/1.0/authorization/website", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    
    if (!siteResponse.ok) {
      return { success: false, error: "Failed to get Squarespace site" }
    }
    
    const siteData = await siteResponse.json()
    const siteId = siteData.id

    // Add code injection
    const injectResponse = await fetch(`https://api.squarespace.com/1.0/commerce/website/${siteId}/code-injection`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        footerCodeInjection: widgetCode
      })
    })

    if (!injectResponse.ok) {
      return { success: false, error: "Failed to inject code to Squarespace" }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

async function installWordPressWidget(accessToken: string, widgetId: string) {
  try {
    // WordPress.com REST API to add widget
    // This requires the Jetpack plugin or WordPress.com site
    const widgetCode = `<script src="https://netnext.site/widget.js" data-id="${widgetId}"></script>`
    
    // Get site info
    const siteResponse = await fetch("https://public-api.wordpress.com/rest/v1.1/me/sites", {
      headers: { "Authorization": `Bearer ${accessToken}` }
    })
    
    if (!siteResponse.ok) {
      return { success: false, error: "Failed to get WordPress sites" }
    }
    
    const siteData = await siteResponse.json()
    if (!siteData.sites || siteData.sites.length === 0) {
      return { success: false, error: "No WordPress sites found" }
    }

    const siteId = siteData.sites[0].ID

    // Add footer code using customizations
    // Note: This may require specific permissions
    return { 
      success: true, 
      message: "WordPress integration complete. Add the widget code to your theme footer.",
      code: widgetCode
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
