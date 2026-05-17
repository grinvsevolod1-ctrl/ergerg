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
    const token = localStorage.getItem("admin_token")
    if (!token) return

    try {
      const response = await fetch(
        `/api/admin/notifications?since=${lastCheck.toISOString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setState(prev => ({
          ...prev,
          counts: data.counts,
          recentActivity: data.recentActivity,
          loading: false,
          error: null,
        }))
        setLastCheck(new Date(data.timestamp))
      }
    } catch (error) {
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
