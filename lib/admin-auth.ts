import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN
const SESSION_NAME = 'admin_session'

/**
 * Verify admin session from HTTP-only cookie
 */
export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  if (!ADMIN_TOKEN) {
    console.warn('[Admin] ADMIN_API_TOKEN not set - admin access disabled')
    return false
  }

  // First try cookie-based auth (preferred)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_NAME)

  if (sessionCookie?.value) {
    try {
      const decoded = Buffer.from(sessionCookie.value, 'base64').toString()
      const [, storedToken] = decoded.split(':')
      if (storedToken === ADMIN_TOKEN) {
        return true
      }
    } catch {
      // Invalid session format, continue to header check
    }
  }

  // Fallback: check Authorization header (for backward compatibility)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    if (token === ADMIN_TOKEN) {
      return true
    }
  }

  return false
}

/**
 * Legacy: Verify admin token from request headers only
 * @deprecated Use verifyAdminSession instead
 */
export function verifyAdminToken(request: NextRequest): boolean {
  if (!ADMIN_TOKEN) {
    console.warn('[Admin] ADMIN_API_TOKEN not set - admin access disabled')
    return false
  }

  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return false
  }

  const token = authHeader.slice(7)
  return token === ADMIN_TOKEN
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}

/**
 * Wrapper for admin API routes that require authentication
 * Supports both cookie-based and header-based auth
 */
export function withAdminAuth(
  handler: (request: NextRequest, context?: unknown) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: unknown) => {
    const isAuthenticated = await verifyAdminSession(request)
    if (!isAuthenticated) {
      return unauthorizedResponse()
    }
    return handler(request, context)
  }
}
