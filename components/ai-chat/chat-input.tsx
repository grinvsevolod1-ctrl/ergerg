"use client"

import { useRef, useEffect } from "react"
import { Send, ArrowRight, Globe, Code2, MessageCircle, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { QuickAction } from "./types"

// --- Quick Action Chips ---
const quickActions: QuickAction[] = [
  { label: "Услуги", action: "services", icon: <Layers className="w-3.5 h-3.5" /> },
  { label: "Портфолио", action: "portfolio", icon: <Globe className="w-3.5 h-3.5" /> },
  { label: "Стоимость", action: "estimate", icon: <Code2 className="w-3.5 h-3.5" /> },
  { label: "Контакты", action: "contact", icon: <MessageCircle className="w-3.5 h-3.5" /> },
]

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (content: string, action?: string) => void
  operatorConnected: boolean
  showQuickActions: boolean
  isOpen: boolean
}

export function ChatInput({ 
  value, 
  onChange, 
  onSend, 
  operatorConnected, 
  showQuickActions,
  isOpen 
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend(value)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    const el = e.target
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }

  return (
    <div className="border-t border-border/50 bg-card shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-0">
      {/* Quick actions -- only when no operator */}
      {!operatorConnected && showQuickActions && (
        <div className="flex flex-wrap gap-2 px-3 pt-3 pb-1">
          {quickActions.map((a) => (
            <button
              key={a.action}
              onClick={() => onSend("", a.action)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-xl",
                "bg-secondary/70 hover:bg-primary hover:text-primary-foreground active:scale-95",
                "border border-border/50 hover:border-primary",
                "transition-all touch-manipulation"
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end p-3 pt-2">
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={operatorConnected ? "Сообщение оператору..." : "Напишите сообщение..."}
          rows={1}
          className={cn(
            "flex-1 resize-none text-[15px] leading-relaxed",
            "bg-secondary/50 border border-border/50 rounded-xl px-4 py-3",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
            "placeholder:text-muted-foreground/60 transition-all",
            "max-h-[120px]"
          )}
        />
        <Button
          size="icon"
          className={cn(
            "h-11 w-11 rounded-xl shrink-0 transition-all touch-manipulation",
            value.trim() ? "opacity-100" : "opacity-40 pointer-events-none"
          )}
          onClick={() => onSend(value)}
          disabled={!value.trim()}
          aria-label="Отправить"
        >
          {operatorConnected ? (
            <Send className="h-5 w-5" />
          ) : (
            <ArrowRight className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}

export { quickActions }
