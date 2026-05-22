"use client"

import { useEffect, useRef, useState } from "react"

interface SiriOrbProps {
  size?: number
  color?: string
  state?: "idle" | "listening" | "thinking" | "speaking"
  onClick?: () => void
  className?: string
}

export function SiriOrb({ 
  size = 72, 
  color = "#4fd1c5", 
  state = "idle",
  onClick,
  className = ""
}: SiriOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(Math.random() * 100)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    // Parse color
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 79, g: 209, b: 197 }
    }

    const rgb = hexToRgb(color)

    function draw() {
      if (!ctx) return
      
      const currentState = state
      timeRef.current += currentState === "thinking" ? 0.06 : currentState === "speaking" ? 0.04 : 0.02
      const time = timeRef.current
      
      ctx.clearRect(0, 0, size, size)
      
      const cx = size / 2
      const cy = size / 2
      const baseRadius = size * 0.38

      // Intensity based on state
      const intensity = currentState === "thinking" ? 1.8 : currentState === "speaking" ? 1.4 : currentState === "listening" ? 1.5 : 1
      const waveIntensity = currentState === "thinking" ? 10 : currentState === "speaking" ? 7 : 4

      // Outer glow rings (3 layers)
      for (let ring = 4; ring >= 1; ring--) {
        const ringRadius = baseRadius * (1 + ring * 0.22)
        const alpha = (0.12 / ring) * intensity
        const pulseOffset = Math.sin(time * (0.6 + ring * 0.15)) * 0.12
        
        ctx.beginPath()
        ctx.arc(cx, cy, ringRadius * (1 + pulseOffset), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`
        ctx.fill()
      }

      // Multiple blob layers for depth
      const layers = 5
      for (let layer = layers - 1; layer >= 0; layer--) {
        const layerProgress = layer / (layers - 1)
        const layerRadius = baseRadius * (0.4 + layerProgress * 0.6)
        
        ctx.beginPath()
        const points = 90
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2
          
          // Multiple harmonics for organic "liquid" movement
          const wave1 = Math.sin(angle * 3 + time * 1.3 + layer * 0.7) * waveIntensity * 0.35
          const wave2 = Math.cos(angle * 5 - time * 0.9 + layer * 0.4) * waveIntensity * 0.25
          const wave3 = Math.sin(angle * 7 + time * 1.7 - layer * 0.5) * waveIntensity * 0.18
          const wave4 = Math.cos(angle * 2 - time * 0.6 + layer * 0.2) * waveIntensity * 0.12
          const wave5 = Math.sin(angle * 11 + time * 2.1) * waveIntensity * 0.08
          
          const r = layerRadius + (wave1 + wave2 + wave3 + wave4 + wave5) * (1 - layerProgress * 0.4)
          const x = cx + r * Math.cos(angle)
          const y = cy + r * Math.sin(angle)
          
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.closePath()
        
        // Beautiful gradient for each layer
        const grad = ctx.createRadialGradient(
          cx - layerRadius * 0.35,
          cy - layerRadius * 0.35,
          0,
          cx, cy,
          layerRadius * 1.4
        )
        
        if (layer === 0) {
          // Core layer - most saturated
          grad.addColorStop(0, `rgba(255, 255, 255, 0.95)`)
          grad.addColorStop(0.2, `rgba(${Math.min(rgb.r + 60, 255)}, ${Math.min(rgb.g + 60, 255)}, ${Math.min(rgb.b + 60, 255)}, 0.9)`)
          grad.addColorStop(0.5, color)
          grad.addColorStop(0.8, `rgba(${Math.max(rgb.r - 30, 0)}, ${Math.max(rgb.g - 30, 0)}, ${Math.max(rgb.b - 30, 0)}, 0.85)`)
          grad.addColorStop(1, `rgba(${Math.max(rgb.r - 60, 0)}, ${Math.max(rgb.g - 60, 0)}, ${Math.max(rgb.b - 60, 0)}, 0.7)`)
        } else {
          const alpha = 0.5 - layerProgress * 0.25
          const hueShift = layerProgress * 25
          grad.addColorStop(0, `rgba(${Math.min(rgb.r + 40 + hueShift, 255)}, ${Math.min(rgb.g + 40, 255)}, ${Math.min(rgb.b + 40 - hueShift, 255)}, ${alpha})`)
          grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.3})`)
        }
        
        ctx.fillStyle = grad
        ctx.fill()
      }

      // Inner bright core with highlight
      const coreGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.25,
        cy - baseRadius * 0.25,
        0,
        cx, cy,
        baseRadius * 0.55
      )
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.85 * intensity})`)
      coreGrad.addColorStop(0.25, `rgba(255, 255, 255, ${0.45 * intensity})`)
      coreGrad.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
      coreGrad.addColorStop(1, "transparent")
      
      ctx.beginPath()
      ctx.arc(cx, cy, baseRadius * 0.55, 0, Math.PI * 2)
      ctx.fillStyle = coreGrad
      ctx.fill()

      // Sparkle particles for thinking state
      if (currentState === "thinking") {
        for (let i = 0; i < 8; i++) {
          const sparkleAngle = time * 0.6 + (i / 8) * Math.PI * 2
          const sparkleRadius = baseRadius * (0.75 + Math.sin(time * 2.5 + i * 0.8) * 0.25)
          const sparkleX = cx + Math.cos(sparkleAngle) * sparkleRadius
          const sparkleY = cy + Math.sin(sparkleAngle) * sparkleRadius
          const sparkleSize = 2.5 + Math.sin(time * 3.5 + i * 1.2) * 1.5
          
          ctx.beginPath()
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + Math.sin(time * 4 + i) * 0.35})`
          ctx.fill()
        }
      }

      // Small ambient particles (always visible)
      for (let i = 0; i < 4; i++) {
        const pAngle = time * 0.3 + (i / 4) * Math.PI * 2 + Math.sin(time + i) * 0.3
        const pRadius = baseRadius * (1.1 + Math.sin(time * 0.8 + i * 1.5) * 0.15)
        const pX = cx + Math.cos(pAngle) * pRadius
        const pY = cy + Math.sin(pAngle) * pRadius
        const pSize = 1.5 + Math.sin(time * 2 + i * 2) * 0.8
        const pAlpha = 0.3 + Math.sin(time * 1.5 + i) * 0.2
        
        ctx.beginPath()
        ctx.arc(pX, pY, pSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${pAlpha})`
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size, color, state])

  return (
    <button
      onClick={onClick}
      className={`relative rounded-full transition-transform hover:scale-110 ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-full"
      />
      {/* Outer pulse ring */}
      <div 
        className="absolute inset-[-6px] rounded-full border border-current opacity-20 animate-ping"
        style={{ borderColor: color, animationDuration: "2s" }}
      />
    </button>
  )
}
