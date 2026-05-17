"use client"

import { User } from "lucide-react"
import { NNAssistantIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { Message, QuickButton } from "./types"

interface ChatMessageProps {
  message: Message
  onButtonClick: (action: string) => void
}

// --- Markdown parser с защитой от undefined ---
function parseMarkdown(text: string) {
  const safeText = text || ''
  return safeText.split("\n").map((line, i) => {
    let html = line
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>')
      .replace(/`(.*?)`/g, '<code class="px-1 py-0.5 rounded bg-secondary text-xs font-mono">$1</code>')
    if (line.startsWith("- ")) {
      html = `<span class="text-primary mr-1">&#8226;</span>${html.slice(2)}`
    }
    return (
      <span key={i} className="block leading-relaxed" dangerouslySetInnerHTML={{ __html: html || "&nbsp;" }} />
    )
  })
}

export function ChatMessage({ message, onButtonClick }: ChatMessageProps) {
  const { role, content, buttons } = message

  // System message
  if (role === "system") {
    return (
      <div className="flex justify-center py-1">
        <span className="text-[11px] text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          {content}
        </span>
      </div>
    )
  }

  // User message
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13px] bg-primary text-primary-foreground leading-relaxed">
          {content}
        </div>
      </div>
    )
  }

  // Assistant / Operator message
  return (
    <div className="flex gap-2.5 items-start">
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        role === "operator"
          ? "bg-gradient-to-br from-green-500 to-emerald-600"
          : "bg-gradient-to-br from-primary to-accent"
      )}>
        {role === "operator" ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <NNAssistantIcon className="w-3.5 h-3.5 text-primary-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-2 max-w-[80%]">
        <div className={cn(
          "rounded-2xl rounded-bl-md px-3.5 py-2.5 text-[13px] leading-relaxed",
          role === "operator"
            ? "bg-green-500/10 border border-green-500/20 text-foreground"
            : "bg-secondary/60 text-foreground"
        )}>
          {role === "assistant" ? parseMarkdown(content) : content}
        </div>
        {buttons && buttons.length > 0 && (
          <MessageButtons buttons={buttons} onButtonClick={onButtonClick} />
        )}
      </div>
    </div>
  )
}

interface MessageButtonsProps {
  buttons: QuickButton[]
  onButtonClick: (action: string) => void
}

function MessageButtons({ buttons, onButtonClick }: MessageButtonsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {buttons.map((btn) => (
        <button
          key={btn.action}
          onClick={() => onButtonClick(btn.action)}
          className={cn(
            "text-[12px] px-3 py-1.5 rounded-full border border-border/60",
            "bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary",
            "transition-colors"
          )}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}
