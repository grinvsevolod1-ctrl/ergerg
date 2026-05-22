"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Send,
  Rocket,
  CheckCircle,
  MessageSquare,
  Briefcase,
  ArrowRight,
  Clock,
} from "lucide-react"
import { CreativeIcon } from "@/components/icons"

/* ───────────────────────────────────────────────
   Floating CTA notification -- appears after user
   scrolls past the hero. A small, elegant toast-like
   notification that says "Got a project idea?" with
   quick-submit form. Not intrusive, easy to dismiss.
   ─────────────────────────────────────────────── */

const projectTypes = [
  { id: "website", label: "Сайт", icon: MessageSquare },
  { id: "app", label: "Приложение", icon: Rocket },
  { id: "design", label: "Дизайн", icon: CreativeIcon },
  { id: "other", label: "Другое", icon: Briefcase },
]

export function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    type: "",
    message: "",
  })
  const hasShownRef = useRef(false)

  // Show after scrolling past ~40% of viewport height
  useEffect(() => {
    if (isDismissed) return

    const handleScroll = () => {
      const threshold = window.innerHeight * 0.6
      if (window.scrollY > threshold && !hasShownRef.current) {
        hasShownRef.current = true
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isDismissed])

  // Auto-dismiss after successful submit
  useEffect(() => {
    if (isSubmitted) {
      const t = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => setIsDismissed(true), 500)
      }, 3000)
      return () => clearTimeout(t)
    }
  }, [isSubmitted])

  const dismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => setIsDismissed(true), 400)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.contact) return

    setIsLoading(true)
    try {
      // Determine contact type
      const isEmail = formData.contact.includes("@") && !formData.contact.startsWith("@")
      const isTelegram = formData.contact.startsWith("@")
      
      // Save lead to database
      await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.name,
          email: isEmail ? formData.contact : "",
          telegram: isTelegram ? formData.contact : "",
          phone: !isEmail && !isTelegram ? formData.contact : "",
          contactMethod: isEmail ? "email" : isTelegram ? "telegram" : "phone",
          projectType: formData.type,
          description: formData.message,
          source: "quick_form",
          consentGiven: true,
        }),
      }).catch(() => {/* silent */})

      // Send to Telegram notification
      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quick_form",
          data: formData,
        }),
      })
    } catch {
      // silent fail
    }
    setIsLoading(false)
    setIsSubmitted(true)
  }

  if (isDismissed) return null

  return (
    <div
      className={cn(
        "fixed z-[55] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        // Position: bottom-left on desktop, bottom-center on mobile (above mobile nav)
        "bottom-[4.5rem] md:bottom-6 left-4 right-4 md:left-[88px] md:right-auto md:max-w-sm md:transition-[left] md:duration-300",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8 pointer-events-none"
      )}
    >
      <div className="bg-card border border-border/50 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden float-cta-enter">
        {/* ── Collapsed: notification toast ── */}
        {!isExpanded && !isSubmitted && (
          <div className="p-4 flex items-center gap-3">
            {/* Pulse dot */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500">
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Есть идея проекта?
              </p>
              <p className="text-xs text-muted-foreground">
                Оставьте заявку за 30 секунд
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5 px-3"
                onClick={() => setIsExpanded(true)}
              >
                Оставить
                <ArrowRight className="w-3 h-3" />
              </Button>
              <button
                onClick={dismiss}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Expanded: quick form ── */}
        {isExpanded && !isSubmitted && (
          <form onSubmit={handleSubmit} className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">
                Быстрая заявка
              </h4>
              <button
                type="button"
                onClick={dismiss}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Type selection (compact) */}
            <div className="flex gap-1.5 mb-3">
              {projectTypes.map((type) => {
                const Icon = type.icon
                const isSelected = formData.type === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: type.id })
                    }
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 border",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Name + contact in a row */}
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Имя"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="h-9 text-xs bg-background/50 border-border/50"
              />
              <Input
                placeholder="Email / Telegram"
                value={formData.contact}
                onChange={(e) =>
                  setFormData({ ...formData, contact: e.target.value })
                }
                required
                className="h-9 text-xs bg-background/50 border-border/50"
              />
            </div>

            {/* Optional message */}
            <Textarea
              placeholder="Кратко опишите проект (необязательно)"
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              rows={2}
              className="text-xs bg-background/50 border-border/50 resize-none mb-3"
            />

            <Button
              type="submit"
              className="w-full h-9 text-xs gap-2"
              disabled={isLoading || !formData.name || !formData.contact}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Отправляем...
                </span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Отправить заявку
                </>
              )}
            </Button>
          </form>
        )}

        {/* ── Success state ── */}
        {isSubmitted && (
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Отправлено!</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ответим в течение 2 часов
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
