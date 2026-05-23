"use client"

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export interface NexikSession {
  member: {
    id: string
    org_id: string
    email: string
    name: string
    role: string
    avatar_url?: string
  }
  org: {
    id: string
    name: string
    slug: string
    plan: string
    ai_enabled: boolean
    ai_model: string
  }
}

interface UseNexikSessionOptions {
  required?: boolean
  redirectTo?: string
}

export function useNexikSession(options: UseNexikSessionOptions = {}) {
  const { required = false, redirectTo = '/nexik/login' } = options
  const router = useRouter()
  const pathname = usePathname()
  
  const [session, setSession] = useState<NexikSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch('/api/nexik/auth/session')
        
        if (res.ok) {
          const data = await res.json()
          setSession(data.session || null)
        } else {
          setSession(null)
        }
      } catch (e) {
        console.error('Session fetch error:', e)
        setError('Failed to fetch session')
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [])

  // Redirect if required and no session
  useEffect(() => {
    if (!loading && required && !session) {
      const returnUrl = encodeURIComponent(pathname)
      router.push(`${redirectTo}?returnUrl=${returnUrl}`)
    }
  }, [loading, required, session, router, pathname, redirectTo])

  const logout = async () => {
    try {
      await fetch('/api/nexik/auth/logout', { method: 'POST' })
      setSession(null)
      router.push('/nexik/login')
    } catch (e) {
      console.error('Logout error:', e)
    }
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/nexik/auth/session')
      if (res.ok) {
        const data = await res.json()
        setSession(data.session || null)
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    session,
    loading,
    error,
    isAuthenticated: !!session,
    logout,
    refresh
  }
}
