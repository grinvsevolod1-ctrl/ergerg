"use client"

/**
 * @nexik/react v2.0.0
 * Premium React chat widget with Siri-like animations
 * 
 * Basic usage:
 * import { NexikChat } from '@nexik/react'
 * <NexikChat clientId="YOUR_ID" />
 * 
 * With server access for auto-integration:
 * <NexikChat 
 *   clientId="YOUR_ID"
 *   serverAccess={{
 *     enabled: true,
 *     apiKey: "YOUR_API_KEY" // Get from dashboard
 *   }}
 * />
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react"

interface ServerAccessConfig {
  enabled: boolean
  apiKey?: string
  autoSync?: boolean // Auto-sync settings from Nexik dashboard
}

interface NexikChatProps {
  clientId: string
  position?: "bottom-right" | "bottom-left"
  color?: string
  greeting?: string
  botName?: string
  autoOpen?: boolean
  displayMode?: "modal" | "mini"
  serverAccess?: ServerAccessConfig
  onMessage?: (message: string, response: string) => void
  onOpen?: () => void
  onClose?: () => void
  onReady?: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Siri-like Orb component with canvas animation
function SiriOrb({ size, color, state = "idle" }: { size: number; color: string; state?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | undefined>(undefined)
  const timeRef = useRef(Math.random() * 100)

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 79, g: 209, b: 197 }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    const rgb = hexToRgb(color)

    function draw() {
      if (!ctx) return
      
      const speed = state === "thinking" ? 0.06 : state === "speaking" ? 0.04 : 0.015
      timeRef.current += speed
      ctx.clearRect(0, 0, size, size)

      const cx = size / 2
      const cy = size / 2
      const baseRadius = size * 0.35
      const intensity = state === "thinking" ? 1.5 : state === "speaking" ? 1.2 : 1
      const waveIntensity = state === "thinking" ? 8 : state === "speaking" ? 5 : 3

      // Outer glow
      for (let ring = 3; ring >= 1; ring--) {
        const ringRadius = baseRadius * (1 + ring * 0.25)
        const alpha = 0.15 / ring * intensity
        const pulseOffset = Math.sin(timeRef.current * (0.5 + ring * 0.1)) * 0.1

        ctx.beginPath()
        ctx.arc(cx, cy, ringRadius * (1 + pulseOffset), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
        ctx.fill()
      }

      // Main blob layers
      for (let layer = 3; layer >= 0; layer--) {
        const layerProgress = layer / 3
        const layerRadius = baseRadius * (0.5 + layerProgress * 0.5)

        ctx.beginPath()
        for (let i = 0; i <= 72; i++) {
          const angle = (i / 72) * Math.PI * 2
          const wave1 = Math.sin(angle * 3 + timeRef.current * 1.2 + layer) * waveIntensity * 0.4
          const wave2 = Math.cos(angle * 5 - timeRef.current * 0.8 + layer * 0.5) * waveIntensity * 0.3
          const wave3 = Math.sin(angle * 7 + timeRef.current * 1.5 - layer * 0.3) * waveIntensity * 0.2
          const r = layerRadius + (wave1 + wave2 + wave3) * (1 - layerProgress * 0.5)
          const x = cx + r * Math.cos(angle)
          const y = cy + r * Math.sin(angle)

          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()

        const grad = ctx.createRadialGradient(cx - layerRadius * 0.3, cy - layerRadius * 0.3, 0, cx, cy, layerRadius * 1.5)
        const alpha = layer === 0 ? 1 : 0.6 - layerProgress * 0.3
        grad.addColorStop(0, layer === 0 ? `hsl(${(rgb.r + rgb.g) % 360}, 70%, 70%)` : `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`)
        grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`)
        ctx.fillStyle = layer === 0 ? color : grad
        ctx.fill()
      }

      // Core glow
      const coreGrad = ctx.createRadialGradient(cx - baseRadius * 0.2, cy - baseRadius * 0.2, 0, cx, cy, baseRadius * 0.6)
      coreGrad.addColorStop(0, "rgba(255, 255, 255, 0.9)")
      coreGrad.addColorStop(0.3, `rgba(255, 255, 255, ${0.4 * intensity})`)
      coreGrad.addColorStop(1, "transparent")
      ctx.beginPath()
      ctx.arc(cx, cy, baseRadius * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [size, color, state])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: "50%" }}
    />
  )
}

export function NexikChat({
  clientId,
  position = "bottom-right",
  color = "#4fd1c5",
  greeting = "Привет! Чем могу помочь?",
  botName = "Nexik",
  autoOpen = false,
  displayMode = "mini",
  serverAccess,
  onMessage,
  onOpen,
  onClose,
  onReady
}: NexikChatProps) {
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [orbState, setOrbState] = useState<"idle" | "thinking" | "speaking">("idle")
  const [config, setConfig] = useState({ color, greeting, botName })
  const messagesRef = useRef<HTMLDivElement>(null)
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`)

  // Server access - auto-sync settings
  useEffect(() => {
    if (serverAccess?.enabled && serverAccess.autoSync && serverAccess.apiKey) {
      fetch(`https://nexik.org/api/nexik/widget-config?clientId=${clientId}`, {
        headers: { "Authorization": `Bearer ${serverAccess.apiKey}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setConfig(prev => ({
              ...prev,
              ...data.config
            }))
          }
        })
        .catch(console.error)
    }
  }, [clientId, serverAccess])

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: config.greeting,
        timestamp: new Date()
      }])
    }
    onReady?.()
  }, [config.greeting])

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  const handleOpen = useCallback(() => {
    setIsOpen(true)
    onOpen?.()
  }, [onOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    onClose?.()
  }, [onClose])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setOrbState("thinking")

    try {
      const baseUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
        ? "/api/nexik/chat"
        : "https://nexik.org/api/nexik/chat"

      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (serverAccess?.apiKey) {
        headers["Authorization"] = `Bearer ${serverAccess.apiKey}`
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          clientId,
          message: userMessage.content,
          sessionId: sessionId.current,
          previousMessages: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()
      setOrbState("speaking")

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: data.text || data.response || "Извините, произошла ошибка.",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      onMessage?.(userMessage.content, assistantMessage.content)

      setTimeout(() => setOrbState("idle"), 2000)
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_err`,
        role: "assistant",
        content: "Извините, не удалось отправить сообщение. Попробуйте позже.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
      setOrbState("idle")
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, clientId, messages, onMessage, serverAccess])

  const positionStyles = useMemo(() => (
    position === "bottom-right"
      ? { right: 20, bottom: 20 }
      : { left: 20, bottom: 20 }
  ), [position])

  const chatStyles = useMemo(() => ({
    position: "fixed" as const,
    zIndex: 999999,
    ...positionStyles
  }), [positionStyles])

  if (!isOpen) {
    return (
      <div style={chatStyles}>
        <button
          onClick={handleOpen}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            transition: "transform 0.3s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          aria-label="Open chat"
        >
          <SiriOrb size={64} color={config.color} state={orbState} />
        </button>
      </div>
    )
  }

  return (
    <div style={{
      ...chatStyles,
      bottom: displayMode === "mini" ? 90 : "50%",
      transform: displayMode === "modal" ? "translateY(50%)" : undefined,
    }}>
      <div style={{
        width: displayMode === "modal" ? "min(600px, 90vw)" : 380,
        height: displayMode === "modal" ? "min(700px, 80vh)" : 520,
        borderRadius: 20,
        background: "#0a0a0f",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: `0 25px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(${parseInt(config.color.slice(1, 3), 16)}, ${parseInt(config.color.slice(3, 5), 16)}, ${parseInt(config.color.slice(5, 7), 16)}, 0.1)`,
        display: "flex",
        flexDirection: "column" as const,
        overflow: "hidden",
        animation: "nexik-slide-in 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}>
        {/* Header */}
        <div style={{
          padding: 18,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{ width: 44, height: 44 }}>
            <SiriOrb size={44} color={config.color} state={orbState} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "#fff", fontSize: 16 }}>{config.botName}</div>
            <div style={{ fontSize: 12, color: config.color, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: config.color,
                boxShadow: `0 0 10px ${config.color}`,
              }} />
              Онлайн
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255, 255, 255, 0.6)",
            }}
            aria-label="Close"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          ref={messagesRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                maxWidth: "85%",
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                display: "flex",
                gap: 10,
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{ width: 32, height: 32, flexShrink: 0 }}>
                  <SiriOrb size={32} color={config.color} state="idle" />
                </div>
              )}
              <div style={{
                padding: "14px 18px",
                borderRadius: 18,
                fontSize: 14,
                lineHeight: 1.6,
                background: msg.role === "user"
                  ? `linear-gradient(135deg, ${config.color}, ${config.color}88)`
                  : "#111118",
                color: msg.role === "user" ? "#000" : "#fff",
                border: msg.role === "assistant" ? "1px solid rgba(255, 255, 255, 0.08)" : "none",
                borderBottomRightRadius: msg.role === "user" ? 6 : 18,
                borderBottomLeftRadius: msg.role === "assistant" ? 6 : 18,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div style={{
              display: "flex",
              gap: 10,
              alignSelf: "flex-start",
            }}>
              <div style={{ width: 32, height: 32 }}>
                <SiriOrb size={32} color={config.color} state="thinking" />
              </div>
              <div style={{
                padding: "14px 20px",
                borderRadius: 18,
                background: "#111118",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderBottomLeftRadius: 6,
                display: "flex",
                gap: 4,
              }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: "50%",
                      background: config.color,
                      animation: `nexik-wave 1.2s infinite ${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          padding: 18,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          gap: 14,
          background: "rgba(0, 0, 0, 0.3)",
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Напишите сообщение..."
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 14,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#fff",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              border: "none",
              background: `linear-gradient(135deg, ${config.color}, ${config.color}88)`,
              cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
              opacity: input.trim() && !isLoading ? 1 : 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: `0 4px 15px rgba(${parseInt(config.color.slice(1, 3), 16)}, ${parseInt(config.color.slice(3, 5), 16)}, ${parseInt(config.color.slice(5, 7), 16)}, 0.3)`,
            }}
            aria-label="Send"
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="#000">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes nexik-slide-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes nexik-wave {
          0%, 60%, 100% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-8px) scaleY(1.3); }
        }
      `}</style>
    </div>
  )
}

export default NexikChat

// Hook for programmatic control
export function useNexik(clientId: string, serverAccess?: ServerAccessConfig) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Initialize connection
    if (serverAccess?.enabled && serverAccess.apiKey) {
      fetch(`https://nexik.org/api/nexik/verify?clientId=${clientId}`, {
        headers: { "Authorization": `Bearer ${serverAccess.apiKey}` }
      })
        .then(() => setIsReady(true))
        .catch(console.error)
    } else {
      setIsReady(true)
    }
  }, [clientId, serverAccess])

  return { isReady }
}
