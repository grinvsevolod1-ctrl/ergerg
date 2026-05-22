"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"

/* ───────────────────────────────────────────────
   Siri-style liquid orb with canvas animation.
   Smooth morphing blob with gradient colors.
   ─────────────────────────────────────────────── */

interface AIORBProps {
  isLoading: boolean
  isMinimized: boolean
  onLoadingComplete: () => void
  onOrbClick: () => void
  isChatOpen: boolean
}

// Siri-like color palette
const COLORS = [
  { r: 79, g: 209, b: 197 },   // teal
  { r: 99, g: 179, b: 237 },   // blue
  { r: 129, g: 230, b: 217 },  // mint
  { r: 56, g: 178, b: 172 },   // dark teal
]

export function SiriOrb({ 
  size = 56, 
  isHovered = false,
  isActive = false,
}: { 
  size?: number
  isHovered?: boolean
  isActive?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr
    const centerX = width / 2
    const centerY = height / 2
    const baseRadius = Math.min(width, height) * 0.38
    
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)
    
    timeRef.current += isHovered ? 0.025 : 0.015
    const t = timeRef.current
    
    // Amplitude of wobble
    const wobbleAmp = isHovered ? 6 : 3
    const wobbleSpeed = isHovered ? 1.5 : 1
    
    // Draw multiple layered blobs
    const layers = [
      { offset: 0, alpha: 0.15, scale: 1.15, blur: 12 },
      { offset: 0.5, alpha: 0.25, scale: 1.08, blur: 6 },
      { offset: 1, alpha: 0.4, scale: 1.0, blur: 2 },
    ]
    
    layers.forEach((layer) => {
      ctx.save()
      
      // Create gradient
      const gradient = ctx.createRadialGradient(
        centerX - baseRadius * 0.3, 
        centerY - baseRadius * 0.3, 
        0,
        centerX, 
        centerY, 
        baseRadius * layer.scale * 1.2
      )
      
      // Animated color stops
      const colorIndex = Math.floor((t * 0.3 + layer.offset) % COLORS.length)
      const nextColorIndex = (colorIndex + 1) % COLORS.length
      const colorMix = ((t * 0.3 + layer.offset) % 1)
      
      const c1 = COLORS[colorIndex]
      const c2 = COLORS[nextColorIndex]
      const r = Math.round(c1.r + (c2.r - c1.r) * colorMix)
      const g = Math.round(c1.g + (c2.g - c1.g) * colorMix)
      const b = Math.round(c1.b + (c2.b - c1.b) * colorMix)
      
      gradient.addColorStop(0, `rgba(255, 255, 255, ${layer.alpha * 1.5})`)
      gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${layer.alpha * 1.2})`)
      gradient.addColorStop(0.7, `rgba(${r * 0.7}, ${g * 0.8}, ${b * 0.9}, ${layer.alpha})`)
      gradient.addColorStop(1, `rgba(${r * 0.4}, ${g * 0.5}, ${b * 0.6}, ${layer.alpha * 0.5})`)
      
      ctx.filter = `blur(${layer.blur}px)`
      ctx.fillStyle = gradient
      
      // Draw blob shape
      ctx.beginPath()
      const points = 64
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        
        // Multiple sine waves for organic movement
        const wave1 = Math.sin(angle * 3 + t * wobbleSpeed * 2 + layer.offset) * wobbleAmp
        const wave2 = Math.sin(angle * 5 - t * wobbleSpeed * 1.5 + layer.offset * 2) * wobbleAmp * 0.5
        const wave3 = Math.cos(angle * 2 + t * wobbleSpeed + layer.offset * 3) * wobbleAmp * 0.7
        
        const radius = baseRadius * layer.scale + wave1 + wave2 + wave3
        
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.fill()
      
      ctx.restore()
    })
    
    // Inner bright core
    ctx.save()
    const coreGradient = ctx.createRadialGradient(
      centerX - baseRadius * 0.2,
      centerY - baseRadius * 0.2,
      0,
      centerX,
      centerY,
      baseRadius * 0.6
    )
    coreGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
    coreGradient.addColorStop(0.4, 'rgba(200, 255, 250, 0.6)')
    coreGradient.addColorStop(0.8, 'rgba(79, 209, 197, 0.2)')
    coreGradient.addColorStop(1, 'rgba(79, 209, 197, 0)')
    
    ctx.fillStyle = coreGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, baseRadius * 0.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
    
    // Highlight reflection
    ctx.save()
    const highlightGradient = ctx.createRadialGradient(
      centerX - baseRadius * 0.35,
      centerY - baseRadius * 0.35,
      0,
      centerX - baseRadius * 0.2,
      centerY - baseRadius * 0.2,
      baseRadius * 0.5
    )
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = highlightGradient
    ctx.beginPath()
    ctx.ellipse(
      centerX - baseRadius * 0.25,
      centerY - baseRadius * 0.25,
      baseRadius * 0.35,
      baseRadius * 0.25,
      -Math.PI / 4,
      0,
      Math.PI * 2
    )
    ctx.fill()
    ctx.restore()
    
    ctx.restore()
    
    animationRef.current = requestAnimationFrame(draw)
  }, [isHovered])
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    canvas.style.width = `${size}px`
    canvas.style.height = `${size}px`
    
    animationRef.current = requestAnimationFrame(draw)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [size, draw])
  
  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "rounded-full",
        "transition-transform duration-300",
        isHovered && "scale-110",
        isActive && "scale-95"
      )}
      style={{ background: 'transparent' }}
    />
  )
}

export function AIOrbCanvas({
  isLoading,
  isMinimized,
  onLoadingComplete,
  onOrbClick,
  isChatOpen,
}: AIORBProps) {
  const [loadProgress, setLoadProgress] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(null)

  // Loading progress
  useEffect(() => {
    if (!isLoading) return
    timerRef.current = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current!)
          setIsTransitioning(true)
          setTimeout(() => {
            onLoadingComplete()
            setTimeout(() => setShowHint(true), 1200)
          }, 500)
          return 100
        }
        return prev + Math.random() * 14 + 5
      })
    }, 70)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isLoading, onLoadingComplete])

  // Auto-hide hint
  useEffect(() => {
    if (showHint && !isChatOpen) {
      const t = setTimeout(() => setShowHint(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showHint, isChatOpen])

  const progressClamped = Math.min(Math.round(loadProgress), 100)

  return (
    <>
      {/* LOADING STATE */}
      {isLoading && !isMinimized && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div
            className={cn(
              "flex flex-col items-center gap-8 transition-all duration-500",
              isTransitioning && "opacity-0 scale-95 translate-y-4"
            )}
          >
            {/* Large Siri Orb */}
            <div className="relative">
              {/* Ambient glow behind orb */}
              <div 
                className="absolute inset-[-40px] rounded-full opacity-60"
                style={{
                  background: "radial-gradient(circle, rgba(79,209,197,0.3) 0%, rgba(99,179,237,0.15) 40%, transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              
              <SiriOrb size={140} isHovered={true} />
              
              {/* Subtle progress ring */}
              <svg
                className="absolute inset-[-8px] -rotate-90 pointer-events-none"
                viewBox="0 0 156 156"
                style={{ width: 156, height: 156 }}
              >
                <circle
                  cx="78"
                  cy="78"
                  r="76"
                  fill="none"
                  stroke="rgba(79,209,197,0.1)"
                  strokeWidth="1"
                />
                <circle
                  cx="78"
                  cy="78"
                  r="76"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 76}`}
                  strokeDashoffset={`${2 * Math.PI * 76 * (1 - progressClamped / 100)}`}
                  className="transition-[stroke-dashoffset] duration-300 ease-out"
                  opacity="0.8"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4fd1c5" />
                    <stop offset="100%" stopColor="#63b3ed" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-lg md:text-xl tracking-wide">
                <span className="text-muted-foreground/40">{"<"}</span>
                <span className="text-foreground font-semibold">NetNext</span>
                <span className="text-muted-foreground/40">{" />"}</span>
              </span>
            </div>

            {/* Minimal progress text */}
            <span className="font-mono text-xs text-muted-foreground/50 tabular-nums">
              {progressClamped}%
            </span>
          </div>
        </div>
      )}

      {/* MINIMIZED STATE */}
      {isMinimized && (
        <div
          className={cn(
            "fixed z-[60] top-[72px] right-3 md:top-5 md:right-5 select-none cursor-pointer",
            "transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            isChatOpen && "opacity-0 pointer-events-none md:opacity-100 md:pointer-events-auto"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onOrbClick}
        >
          {/* Outer glow */}
          <div
            className={cn(
              "absolute inset-[-8px] rounded-full transition-all duration-500",
              isHovered || isChatOpen
                ? "opacity-100 scale-[1.2]"
                : "opacity-50 scale-100"
            )}
            style={{
              background: "radial-gradient(circle, rgba(79,209,197,0.4) 0%, rgba(99,179,237,0.2) 50%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />

          {/* The orb */}
          <SiriOrb 
            size={72} 
            isHovered={isHovered} 
            isActive={isChatOpen}
          />

          {/* Hint tooltip */}
          {showHint && !isChatOpen && (
            <div className="absolute -bottom-12 md:-bottom-13 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
              <div className="relative px-3 py-1.5 rounded-lg bg-card border border-border/50 text-xs shadow-lg">
                <span className="text-primary/90 font-medium">AI</span>
                <span className="text-muted-foreground ml-1">Ассистент</span>
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-card border-l border-t border-border/50 rotate-45" />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
