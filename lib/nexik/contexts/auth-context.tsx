'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Types matching the auth service
export interface NexikMember {
  id: string
  org_id: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'operator' | 'member'
  avatar_url: string | null
  created_at: string
  last_login_at: string | null
}

export interface NexikOrganization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'starter' | 'pro' | 'enterprise'
  ai_enabled: boolean
  ai_model: string | null
  created_at: string
}

export interface NexikSession {
  member: NexikMember
  org: NexikOrganization
}

interface AuthContextValue {
  session: NexikSession | null
  isLoading: boolean
  error: string | null
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function NexikAuthProvider({ 
  children,
  initialSession 
}: { 
  children: ReactNode
  initialSession?: NexikSession | null 
}) {
  const [session, setSession] = useState<NexikSession | null>(initialSession || null)
  const [isLoading, setIsLoading] = useState(!initialSession)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch('/api/nexik/auth/session')
      
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
      } else if (res.status === 401) {
        setSession(null)
      } else {
        throw new Error('Failed to fetch session')
      }
    } catch (err) {
      console.error('[NexikAuth] Session fetch error:', err)
      setError('Ошибка загрузки сессии')
      setSession(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/nexik/auth/logout', { method: 'POST' })
      setSession(null)
      router.push('/nexik/start')
    } catch (err) {
      console.error('[NexikAuth] Logout error:', err)
    }
  }, [router])

  const refresh = useCallback(async () => {
    await fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (!initialSession) {
      fetchSession()
    }
  }, [initialSession, fetchSession])

  return (
    <AuthContext.Provider value={{ session, isLoading, error, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useNexikAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useNexikAuth must be used within NexikAuthProvider')
  }
  return context
}

// Helper hook to require auth (redirects if not authenticated)
export function useRequireNexikAuth() {
  const { session, isLoading, error } = useNexikAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/nexik/start')
    }
  }, [session, isLoading, router])

  return { session, isLoading, error }
}
