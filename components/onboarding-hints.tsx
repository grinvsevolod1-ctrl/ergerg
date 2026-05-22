"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Shield,
  Clock,
  TrendingUp,
  X,
} from "lucide-react"
import { VelocityIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────
   Smart contextual hints that appear as the user scrolls.
   Each hint is tied to a scroll-depth zone and shows
   a useful value proposition. Auto-dismisses after 7s
   if user doesn't interact. Once all shown or dismissed,
   never appears again (persisted via localStorage).
   ───────────────────────────────────────────────────── */

interface SmartHint {
  id: string
  /** scroll-depth in vh units at which the hint triggers */
  triggerVH: number
  icon: React.ElementType
  text: string
  accent: string
}

const smartHints: SmartHint[] = [
  {
    id: "speed",
    triggerVH: 0.8,
    icon: VelocityIcon,
    text: "Первый прототип -- за 48 часов после брифинга",
    accent: "text-amber-400",
  },
  {
    id: "guarantee",
    triggerVH: 2.0,
    icon: Shield,
    text: "Бесплатная поддержка 3 месяца после запуска",
    accent: "text-emerald-400",
  },
  {
    id: "deadline",
    triggerVH: 3.2,
    icon: Clock,
    text: "90% проектов сдаём раньше дедлайна",
    accent: "text-sky-400",
  },
  {
    id: "result",
    triggerVH: 4.5,
    icon: TrendingUp,
    text: "Средний рост конверсии у клиентов -- +40%",
    accent: "text-violet-400",
  },
]

const STORAGE_KEY = "netnext-hints-v2"
const AUTO_DISMISS_MS = 7000

export function OnboardingHints() {
  const [activeHint, setActiveHint] = useState<SmartHint | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const shownIdsRef = useRef<Set<string>>(new Set<string>())
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cooldownRef = useRef(false)

  // Check localStorage on mount and cleanup timers on unmount
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) setIsDone(true)
    } catch (_) { /* noop */ }
    
    return () => {
      clearTimeout(autoTimerRef.current)
    }
  }, [])

  // Schedule auto-dismiss whenever a hint becomes visible
  useEffect(() => {
    if (!isVisible || !activeHint) return

    clearTimeout(autoTimerRef.current)
    autoTimerRef.current = setTimeout(() => {
      hide()
    }, AUTO_DISMISS_MS)

    return () => clearTimeout(autoTimerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, activeHint?.id])

  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  
  const hide = useCallback(() => {
    setIsVisible(false)
    // Brief cooldown so we don't immediately trigger the next one
    cooldownRef.current = true
    clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false
      setActiveHint(null)
    }, 800)
  }, [])

  const dismissAll = useCallback(() => {
    setIsVisible(false)
    cooldownRef.current = true
    clearTimeout(cooldownTimerRef.current)
    cooldownTimerRef.current = setTimeout(() => {
      cooldownRef.current = false
      setActiveHint(null)
    }, 800)
    setIsDone(true)
    try { localStorage.setItem(STORAGE_KEY, "1") } catch (_) { /* noop */ }
  }, [])

  // Scroll listener that picks the right hint based on depth
  useEffect(() => {
    if (isDone) return

    let ticking = false

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        ticking = false
        if (cooldownRef.current || isVisible) return

        const scrollVH = window.scrollY / window.innerHeight

        // Find the first un-shown hint whose trigger we've passed
        for (const hint of smartHints) {
          if (shownIdsRef.current.has(hint.id)) continue
          if (scrollVH >= hint.triggerVH) {
            shownIdsRef.current.add(hint.id)
            setActiveHint(hint)
            // Small delay so the DOM mounts before we animate in
            setTimeout(() => setIsVisible(true), 50)

            // If all hints have been shown, mark as done
            if (shownIdsRef.current.size >= smartHints.length) {
              // After this hint auto-dismisses, persist
              setTimeout(() => {
                try { localStorage.setItem(STORAGE_KEY, "1") } catch (_) { /* noop */ }
                setIsDone(true)
              }, AUTO_DISMISS_MS + 1000)
            }
            break
          }
        }
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [isDone, isVisible])

  if (isDone || !activeHint) return null

  const Icon = activeHint.icon

  return (
    <div
      className={cn(
        "fixed z-[65] pointer-events-none",
        // Below AI orb on mobile, top-right on desktop
        "top-[4.5rem] md:top-6 right-4 md:right-6 left-4 md:left-auto md:max-w-xs",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-4"
      )}
    >
      <div className="pointer-events-auto bg-card border border-border/60 rounded-xl px-4 py-3 shadow-lg shadow-black/10 flex items-center gap-3">
        {/* Icon */}
        <div className={cn("flex-shrink-0", activeHint.accent)}>
          <Icon className="w-4 h-4" />
        </div>

        {/* Text */}
        <p className="text-sm text-foreground/90 leading-snug flex-1">
          {activeHint.text}
        </p>

        {/* Dismiss */}
        <button
          onClick={dismissAll}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          aria-label="Закрыть подсказки"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Auto-dismiss progress bar */}
        <div className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full overflow-hidden bg-border/30">
          <div
            className="h-full bg-primary/50 rounded-full"
            style={{
              animation: isVisible ? `hint-progress ${AUTO_DISMISS_MS}ms linear forwards` : "none",
            }}
          />
        </div>
      </div>
    </div>
  )
}
