import { NextRequest, NextResponse } from "next/server"

// Support request handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, website, message, widgetId, type } = body

    if (!email || !website) {
      return NextResponse.json(
        { error: "Email and website are required" },
        { status: 400 }
      )
    }

    // In production, this would:
    // 1. Store in database
    // 2. Send email notification to support team
    // 3. Create a ticket in support system (e.g., Linear, Zendesk)
    // 4. Send confirmation email to user

    const supportRequest = {
      id: `support_${Date.now()}`,
      name: name || "Anonymous",
      email,
      website,
      message: message || "",
      widgetId: widgetId || "unknown",
      type: type || "general",
      createdAt: new Date().toISOString(),
      status: "new"
    }

    // Log for now (in production, save to DB and send notifications)
    console.log("New support request:", supportRequest)

    // Simulate sending email (in production, use actual email service)
    // await sendEmail({
    //   to: "support@netnext.site",
    //   subject: `New ${type} request from ${email}`,
    //   body: `
    //     Name: ${name}
    //     Email: ${email}
    //     Website: ${website}
    //     Widget ID: ${widgetId}
    //     Message: ${message}
    //   `
    // })

    return NextResponse.json({
      success: true,
      message: "Support request received",
      requestId: supportRequest.id
    })

  } catch (error) {
    console.error("Support request error:", error)
    return NextResponse.json(
      { error: "Failed to submit support request" },
      { status: 500 }
    )
  }
}

// Get support request status (for tracking)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const requestId = searchParams.get("id")

  if (!requestId) {
    return NextResponse.json(
      { error: "Request ID is required" },
      { status: 400 }
    )
  }

  // In production, fetch from database
  // For now, return mock status
  return NextResponse.json({
    id: requestId,
    status: "pending",
    message: "Your request is being processed. We will contact you within 24 hours."
  })
}
