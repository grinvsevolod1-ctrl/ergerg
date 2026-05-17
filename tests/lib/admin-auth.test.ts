import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'admin_session') {
        return { value: Buffer.from(`${Date.now()}:test-token`).toString('base64') }
      }
      return undefined
    }),
    set: vi.fn(),
  })),
}))

// Mock env
vi.stubEnv('ADMIN_API_TOKEN', 'test-token')

describe('Admin Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('verifyAdminSession', () => {
    it('should return true for valid session cookie', async () => {
      const { verifyAdminSession } = await import('@/lib/admin-auth')
      
      const request = new NextRequest('http://localhost/api/admin/test')
      const result = await verifyAdminSession(request)
      
      expect(result).toBe(true)
    })

    it('should return true for valid Authorization header', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockReturnValue({
        get: vi.fn(() => undefined),
        set: vi.fn(),
      } as unknown as ReturnType<typeof cookies>)

      const { verifyAdminSession } = await import('@/lib/admin-auth')
      
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer test-token' },
      })
      
      const result = await verifyAdminSession(request)
      expect(result).toBe(true)
    })

    it('should return false for invalid token', async () => {
      const { cookies } = await import('next/headers')
      vi.mocked(cookies).mockReturnValue({
        get: vi.fn(() => undefined),
        set: vi.fn(),
      } as unknown as ReturnType<typeof cookies>)

      const { verifyAdminSession } = await import('@/lib/admin-auth')
      
      const request = new NextRequest('http://localhost/api/admin/test', {
        headers: { Authorization: 'Bearer wrong-token' },
      })
      
      const result = await verifyAdminSession(request)
      expect(result).toBe(false)
    })
  })

  describe('unauthorizedResponse', () => {
    it('should return 401 status', async () => {
      const { unauthorizedResponse } = await import('@/lib/admin-auth')
      
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
    })

    it('should return error message', async () => {
      const { unauthorizedResponse } = await import('@/lib/admin-auth')
      
      const response = unauthorizedResponse()
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })
})
