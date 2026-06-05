"use client"

import { useState, useEffect, useCallback } from 'react'

interface NotificationCounts {
  newMessages: number
  newLeads: number
  activeSessions: number
}

interface ActivityItem {
  type: 'message' | 'lead'
  id: string
  message: string
  created_at: string
}

interface NotificationState {
  counts: NotificationCounts
  recentActivity: ActivityItem[]
  loading: boolean
  error: string | null
}

export function useAdminNotifications(pollInterval = 15000) {
  const [state, setState] = useState<NotificationState>({
    counts: { newMessages: 0, newLeads: 0, activeSessions: 0 },
    recentActivity: [],
    loading: true,
    error: null,
  })
  const [lastCheck, setLastCheck] = useState<Date>(new Date())

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/admin/notifications?since=${lastCheck.toISOString()}`,
        {
          credentials: 'include',
        }
      )

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          counts: data.counts ?? prev.counts,
          recentActivity: data.recentActivity ?? [],
          loading: false,
          error: null,
        }))
        if (data.timestamp) setLastCheck(new Date(data.timestamp))
      } else if (response.status === 401) {
        // Not authenticated yet (e.g. on login screen) — stay quiet
        setState(prev => ({ ...prev, loading: false, error: null }))
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to fetch notifications',
        }))
      }
    } catch {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch notifications',
      }))
    }
  }, [lastCheck])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, pollInterval)
    return () => clearInterval(interval)
  }, [fetchNotifications, pollInterval])

  const totalCount = state.counts.newMessages + state.counts.newLeads

  return {
    ...state,
    totalCount,
    refresh: fetchNotifications,
  }
}
