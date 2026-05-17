"use client"

/**
 * Nexik Widget for Next.js
 * 
 * Usage:
 * import { NexikWidget } from '@nexik/next'
 * 
 * // In your layout.tsx or page.tsx:
 * <NexikWidget clientId="your-widget-id" />
 */

import dynamic from "next/dynamic"
import { Suspense, useEffect, useState } from "react"

interface NexikWidgetProps {
  clientId: string
  position?: "bottom-right" | "bottom-left"
  color?: string
  greeting?: string
  botName?: string
  autoOpen?: boolean
  lazy?: boolean
  onMessage?: (message: string, response: string) => void
  onOpen?: () => void
  onClose?: () => void
}

// Lightweight placeholder for SSR
function WidgetPlaceholder() {
  return null
}

// The actual widget component (client-side only)
function NexikWidgetClient({
  clientId,
  position = "bottom-right",
  color = "#00ffff",
  greeting = "Привет! Чем могу помочь?",
  botName = "Nexik",
  autoOpen = false,
  onMessage,
  onOpen,
  onClose
}: NexikWidgetProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Load the widget script
    const existingScript = document.querySelector('script[data-nexik-widget]')
    if (existingScript) return

    const script = document.createElement("script")
    script.src = "https://nexik.org/nexik/widget.js"
    script.async = true
    script.setAttribute("data-nexik-widget", "true")
    script.setAttribute("data-id", clientId)
    script.setAttribute("data-position", position)
    script.setAttribute("data-color", color)
    script.setAttribute("data-greeting", greeting)
    script.setAttribute("data-bot-name", botName)
    if (autoOpen) script.setAttribute("data-auto-open", "true")

    // Add event listeners
    if (onMessage || onOpen || onClose) {
      script.onload = () => {
        if (typeof window !== "undefined" && (window as any).Nexik) {
          const nexik = (window as any).Nexik
          if (onMessage) nexik.on("message", onMessage)
          if (onOpen) nexik.on("open", onOpen)
          if (onClose) nexik.on("close", onClose)
        }
      }
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      const scriptToRemove = document.querySelector('script[data-nexik-widget]')
      if (scriptToRemove) {
        scriptToRemove.remove()
      }
      // Remove widget container
      const container = document.getElementById("nexik-widget-container")
      if (container) {
        container.remove()
      }
    }
  }, [mounted, clientId, position, color, greeting, botName, autoOpen, onMessage, onOpen, onClose])

  return null
}

// Dynamic import wrapper for lazy loading
const LazyWidget = dynamic(() => Promise.resolve(NexikWidgetClient), {
  ssr: false,
  loading: () => null
})

export function NexikWidget(props: NexikWidgetProps) {
  const { lazy = true, ...widgetProps } = props

  if (lazy) {
    return (
      <Suspense fallback={<WidgetPlaceholder />}>
        <LazyWidget {...widgetProps} />
      </Suspense>
    )
  }

  return <NexikWidgetClient {...widgetProps} />
}

// Hook for programmatic control
export function useNexik() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const checkReady = () => {
      if (typeof window !== "undefined" && (window as any).Nexik) {
        setIsReady(true)
        return true
      }
      return false
    }

    if (checkReady()) return

    const interval = setInterval(() => {
      if (checkReady()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const open = () => {
    if (typeof window !== "undefined" && (window as any).Nexik) {
      (window as any).Nexik.open()
    }
  }

  const close = () => {
    if (typeof window !== "undefined" && (window as any).Nexik) {
      (window as any).Nexik.close()
    }
  }

  const toggle = () => {
    if (typeof window !== "undefined" && (window as any).Nexik) {
      (window as any).Nexik.toggle()
    }
  }

  const sendMessage = (message: string) => {
    if (typeof window !== "undefined" && (window as any).Nexik) {
      (window as any).Nexik.sendMessage(message)
    }
  }

  return {
    isReady,
    open,
    close,
    toggle,
    sendMessage
  }
}

export default NexikWidget
