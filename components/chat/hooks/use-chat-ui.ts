"use client"

import { useState, useCallback, useEffect } from 'react'
import { ChatDisplayConfig, DEFAULT_DISPLAY_CONFIG } from '../types'

const DISPLAY_KEY = 'netnext_chat_display'

export function useChatUI(initialConfig?: Partial<ChatDisplayConfig>) {
  const [displayConfig, setDisplayConfig] = useState<ChatDisplayConfig>({
    ...DEFAULT_DISPLAY_CONFIG,
    ...initialConfig,
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Load display preferences
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISPLAY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<ChatDisplayConfig>
        setDisplayConfig(prev => ({ ...prev, ...parsed }))
      }
    } catch {
      // Ignore
    }
  }, [])

  // Save display preferences
  const updateDisplayConfig = useCallback((updates: Partial<ChatDisplayConfig>) => {
    setDisplayConfig(prev => {
      const next = { ...prev, ...updates }
      try {
        localStorage.setItem(DISPLAY_KEY, JSON.stringify(next))
      } catch {
        // Ignore
      }
      return next
    })
  }, [])

  const openChat = useCallback(() => {
    setIsOpen(true)
    setIsMinimized(false)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setIsMinimized(false)
  }, [])

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat()
    } else {
      openChat()
    }
  }, [isOpen, openChat, closeChat])

  const minimizeChat = useCallback(() => {
    setIsMinimized(true)
  }, [])

  const maximizeChat = useCallback(() => {
    setIsMinimized(false)
  }, [])

  const switchMode = useCallback((mode: ChatDisplayConfig['mode']) => {
    updateDisplayConfig({ mode })
  }, [updateDisplayConfig])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        closeChat()
      }
      
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleChat()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeChat, toggleChat])

  // Get modal size in percentage
  const getModalSizePercent = useCallback(() => {
    switch (displayConfig.modalSize) {
      case 'sm': return 50
      case 'md': return 60
      case 'lg': return 70
      case 'xl': return 80
      default: return 70
    }
  }, [displayConfig.modalSize])

  return {
    displayConfig,
    isOpen,
    isMinimized,
    openChat,
    closeChat,
    toggleChat,
    minimizeChat,
    maximizeChat,
    switchMode,
    updateDisplayConfig,
    getModalSizePercent,
  }
}
