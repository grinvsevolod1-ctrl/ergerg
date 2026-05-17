import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Multi-Domain Middleware
 * - netnext.site -> main site
 * - nexik.org -> /nexik/* routes (rewrite, not redirect)
 * - Also handles Nexik dashboard auth and CORS
 */
export function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl
  const hostname = host.split(':')[0] // Remove port if present
  
  // ========== MULTI-DOMAIN ROUTING ==========
  // nexik.org domain -> rewrite to /nexik/* routes
  const isNexikDomain = hostname === 'nexik.org' || hostname === 'www.nexik.org'
  
  if (isNexikDomain) {
    // Skip if already accessing /nexik/* or API routes
    if (pathname.startsWith('/nexik') || pathname.startsWith('/api')) {
      // Continue to auth/CORS checks below
    } else if (pathname === '/') {
      // nexik.org/ -> show /nexik landing page
      const url = request.nextUrl.clone()
      url.pathname = '/nexik'
      return NextResponse.rewrite(url)
    } else if (pathname === '/start' || pathname === '/login') {
      // nexik.org/start -> /nexik/start
      const url = request.nextUrl.clone()
      url.pathname = `/nexik${pathname}`
      return NextResponse.rewrite(url)
    } else if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
      // nexik.org/dashboard/* -> /nexik/dashboard/*
      const url = request.nextUrl.clone()
      url.pathname = `/nexik${pathname}`
      return NextResponse.rewrite(url)
    } else if (pathname === '/pricing') {
      const url = request.nextUrl.clone()
      url.pathname = '/nexik/pricing'
      return NextResponse.rewrite(url)
    }
  }

  // ========== NEXIK DASHBOARD AUTH ==========
  // Protected routes (works for both domains)
  const dashboardPath = isNexikDomain 
    ? pathname.startsWith('/dashboard') 
    : pathname.startsWith('/nexik/dashboard')
    
  if (dashboardPath || pathname.startsWith('/nexik/dashboard')) {
    const token = request.cookies.get('nexik_token')?.value
    const orgId = request.cookies.get('nexik_org_id')?.value

    // No token - redirect to start
    if (!token || !orgId) {
      const url = request.nextUrl.clone()
      url.pathname = '/nexik/start'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Basic JWT validation (check expiry)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000

      if (Date.now() > exp) {
        // Token expired - clear and redirect
        const response = NextResponse.redirect(new URL('/nexik/start', request.url))
        response.cookies.delete('nexik_token')
        response.cookies.delete('nexik_org_id')
        return response
      }
    } catch {
      // Invalid token format - redirect
      const response = NextResponse.redirect(new URL('/nexik/start', request.url))
      response.cookies.delete('nexik_token')
      response.cookies.delete('nexik_org_id')
      return response
    }
  }

  // Widget API - add CORS headers
  if (pathname.startsWith('/api/nexik/v1/')) {
    const response = NextResponse.next()
    
    // Allow requests from any domain (widgets are embedded on client sites)
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Widget-ID')
    
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Nexik domain routes
    '/',
    '/start',
    '/login', 
    '/pricing',
    '/dashboard/:path*',
    // Nexik internal routes
    '/nexik/dashboard/:path*',
    '/api/nexik/v1/:path*',
  ],
}
