import { NextRequest, NextResponse } from "next/server"

// Handle OAuth callback redirect from platforms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const { platform } = await params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const shop = searchParams.get("shop") // Shopify specific
    const error = searchParams.get("error")

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description") || "Unknown error"
      return NextResponse.redirect(
        new URL(`/nexik/dashboard/integration?error=${encodeURIComponent(errorDescription)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/nexik/dashboard/integration?error=Missing%20authorization%20code", request.url)
      )
    }

    // Decode state to get widget ID
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString())
    } catch {
      return NextResponse.redirect(
        new URL("/nexik/dashboard/integration?error=Invalid%20state", request.url)
      )
    }

    const { widgetId } = stateData

    // Exchange code for token and install widget
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const exchangeResponse = await fetch(`${baseUrl}/api/nexik/integrations/oauth/${platform}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, shop })
    })

    const result = await exchangeResponse.json()

    if (!exchangeResponse.ok || !result.success) {
      const errorMsg = result.error || "Integration failed"
      return NextResponse.redirect(
        new URL(`/nexik/dashboard/integration?error=${encodeURIComponent(errorMsg)}`, request.url)
      )
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(
      new URL(`/nexik/dashboard/integration?success=true&platform=${platform}`, request.url)
    )

  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(
      new URL("/nexik/dashboard/integration?error=Callback%20failed", request.url)
    )
  }
}
