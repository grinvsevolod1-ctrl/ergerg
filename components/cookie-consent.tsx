"use client"

import { useState, useEffect } from "react"
import { Cookie, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("netnext-cookie-consent")
    if (!consent) {
      // Show after a short delay so it doesn't appear immediately
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleAccept = () => {
    setIsClosing(true)
    setTimeout(() => {
      localStorage.setItem("netnext-cookie-consent", "accepted")
      setIsVisible(false)
    }, 300)
  }

  const handleDecline = () => {
    setIsClosing(true)
    setTimeout(() => {
      localStorage.setItem("netnext-cookie-consent", "declined")
      setIsVisible(false)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed z-[100] transition-all duration-300",
        // Mobile: bottom above nav bar + floating CTA space
        "bottom-[5.5rem] md:bottom-6 left-4 right-4",
        // Desktop: bottom left corner
        "md:left-[88px] md:right-auto md:max-w-sm",
        isClosing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0",
        "animate-in slide-in-from-bottom-4 fade-in duration-500"
      )}
    >
      <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-2xl shadow-black/20">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm mb-1">
              Мы используем cookies
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Для улучшения работы сайта и персонализации контента. Продолжая использовать сайт, вы соглашаетесь с{" "}
              <a href="/privacy" className="text-primary hover:underline">
                политикой конфиденциальности
              </a>
              .
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecline}
            className="flex-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-colors"
          >
            Отклонить
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  )
}
