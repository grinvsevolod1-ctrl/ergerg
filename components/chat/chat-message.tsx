"use client"

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessage as ChatMessageType, ChatConfig } from './types'
import { Check, CheckCheck, Copy, AlertCircle } from 'lucide-react'
import { SiriOrb } from '@/components/ai-orb'

interface ChatMessageProps {
  message: ChatMessageType
  config: ChatConfig
  isLast?: boolean
  className?: string
}

export function ChatMessage({ message, config, isLast, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  const formattedTime = useMemo(() => {
    if (!config.showTimestamp) return null
    return message.timestamp.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }, [message.timestamp, config.showTimestamp])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // System message
  if (isSystem) {
    return (
      <div 
        className={cn(
          "flex justify-center py-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
          className
        )}
      >
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-full",
          "bg-teal-500/10 border border-teal-500/20",
          "text-xs text-zinc-400"
        )}>
          <AlertCircle className="w-3.5 h-3.5 text-teal-400" />
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex gap-3 px-5 py-2",
        "animate-in fade-in duration-300",
        isUser ? "justify-end" : "justify-start",
        isUser ? "slide-in-from-right-4" : "slide-in-from-left-4",
        isLast && "pb-4",
        className
      )}
    >
      {/* Avatar - assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full blur-md opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.4) 0%, transparent 70%)' }}
            />
            <SiriOrb size={32} isHovered={false} />
          </div>
        </div>
      )}

      {/* Message bubble */}
      <div className="flex flex-col gap-1 max-w-[75%]">
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl",
            "transition-all duration-200",
            isUser ? [
              // User message - teal gradient
              "bg-gradient-to-br from-teal-500 to-teal-600",
              "text-white",
              "rounded-br-md",
              "shadow-lg shadow-teal-500/20",
            ] : [
              // Assistant message - dark glass
              "bg-zinc-800",
              "border border-zinc-700",
              "text-zinc-100",
              "rounded-bl-md",
              "shadow-lg shadow-black/20",
            ]
          )}
        >
          {/* Content */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>

          {/* Quick actions from AI */}
          {message.actions && message.actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-600">
              {message.actions.map((action) => (
                <button
                  key={action.id}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full",
                    "bg-zinc-700 hover:bg-zinc-600",
                    "border border-zinc-600",
                    "text-zinc-200 transition-colors"
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Copy button - assistant only */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className={cn(
                "absolute -right-2 -top-2 p-1.5 rounded-lg",
                "bg-zinc-800 border border-zinc-700",
                "text-zinc-400 hover:text-white",
                "opacity-0 group-hover:opacity-100",
                "transition-all duration-200",
                "scale-90 group-hover:scale-100"
              )}
              title="Копировать"
            >
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        {/* Timestamp & status */}
        <div className={cn(
          "flex items-center gap-2 px-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {formattedTime && (
            <span className="text-[10px] text-zinc-500">
              {formattedTime}
            </span>
          )}
          {isUser && (
            <CheckCheck className={cn(
              "w-3 h-3",
              message.status === 'sent' ? "text-zinc-500" : "text-teal-400"
            )} />
          )}
        </div>
      </div>

      {/* Avatar - user */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className={cn(
            "w-8 h-8 rounded-full",
            "bg-gradient-to-br from-teal-500/20 to-teal-500/5",
            "border border-teal-500/30",
            "flex items-center justify-center"
          )}>
            <span className="text-xs font-semibold text-teal-400">
              {config.userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
