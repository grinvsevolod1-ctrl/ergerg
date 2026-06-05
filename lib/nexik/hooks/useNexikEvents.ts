"use client"

import { useEffect, useRef, useCallback, useState } from 'react'
import { notificationSound } from '@/lib/nexik/services/notification-sound'

type EventType = 'new_message' | 'new_conversation' | 'operator_joined' | 'stats_update' | 'connected'

interface NexikEvent {
  type: EventType
  data?: Record<string, unknown>
  timestamp: number
}

type EventCallback = (event: NexikEvent) => void

interface UseNexikEventsOptions {
  orgId: string
  onMessage?: (data: { conversationId: string; message: unknown }) => void
  onNewConversation?: (data: { conversationId: string; visitor: unknown }) => void
  onStatsUpdate?: (data: unknown) => void
  onConnect?: () => void
  onDisconnect?: () => void
  enabled?: boolean
  playSound?: boolean
}

export function useNexikEvents({
  orgId,
  onMessage,
  onNewConversation,
  onStatsUpdate,
  onConnect,
  onDisconnect,
  enabled = true,
  playSound = true
}: UseNexikEventsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<NexikEvent | null>(null)

  const connect = useCallback(() => {
    if (!orgId || !enabled) return

    // Закрываем предыдущее соединение
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const eventSource = new EventSource(`/api/nexik/events?org_id=${orgId}`)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      onConnect?.()
    }

    eventSource.onmessage = (event) => {
      try {
        const data: NexikEvent = JSON.parse(event.data)
        setLastEvent(data)

        switch (data.type) {
          case 'connected':
            setIsConnected(true)
            break
          
          case 'new_message':
            if (playSound) notificationSound.playNotification()
            onMessage?.(data.data as { conversationId: string; message: unknown })
            break
          
          case 'new_conversation':
            if (playSound) notificationSound.playUrgent()
            onNewConversation?.(data.data as { conversationId: string; visitor: unknown })
            break
          
          case 'stats_update':
            onStatsUpdate?.(data.data)
            break
        }
      } catch {
        // Parse error - silent fail
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      onDisconnect?.()

      // Reconnect через 5 секунд
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        if (enabled) {
          connect()
        }
      }, 5000)
    }
  }, [orgId, enabled, onConnect, onDisconnect, onMessage, onNewConversation, onStatsUpdate])

  // Connect on mount
  useEffect(() => {
    if (enabled && orgId) {
      connect()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [connect, enabled, orgId])

  return {
    isConnected,
    lastEvent,
    reconnect: connect
  }
}
