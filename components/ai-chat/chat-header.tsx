"use client"

import { X, User, Headphones } from "lucide-react"
import { NNAssistantIcon } from "@/components/icons"
import { cn } from "@/lib/utils"

interface ChatHeaderProps {
  operatorConnected: boolean
  onClose: () => void
}

export function ChatHeader({ operatorConnected, onClose }: ChatHeaderProps) {
  return (
    <>
      {/* Header with safe area padding on mobile */}
      <div className="relative flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-border/50 shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5" />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              operatorConnected
                ? "bg-gradient-to-br from-green-500 to-emerald-600"
                : "bg-gradient-to-br from-primary to-accent"
            )}>
              {operatorConnected ? (
                <User className="w-5 h-5 text-white" />
              ) : (
                <NNAssistantIcon className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground leading-tight">
              {operatorConnected ? "Оператор" : "NetNext"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {operatorConnected ? "Отвечает живой человек" : "Онлайн • Отвечаем быстро"}
            </p>
          </div>
        </div>
        {/* Close button with better touch target */}
        <button
          onClick={onClose}
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/80 active:bg-secondary transition-colors"
          aria-label="Закрыть чат"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Operator banner */}
      {operatorConnected && (
        <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400 shrink-0">
          <Headphones className="w-3.5 h-3.5" />
          <span>Вы общаетесь с оператором</span>
        </div>
      )}
    </>
  )
}
