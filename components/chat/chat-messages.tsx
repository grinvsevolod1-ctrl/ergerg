"use client"

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChatMessage as ChatMessageType, ChatConfig, ChatAction } from './types'
import { ChatMessage } from './chat-message'
import { ChatTyping } from './chat-typing'
import { ChatWelcome } from './chat-welcome'

interface ChatMessagesProps {
  messages: ChatMessageType[]
  config: ChatConfig
  isTyping: boolean
  onQuickAction?: (action: ChatAction) => void
  onSendMessage?: (message: string) => void
  className?: string
}

export function ChatMessages({
  messages,
  config,
  isTyping,
  onQuickAction,
  onSendMessage,
  className,
}: ChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages, isTyping])

  // Show welcome screen if no messages
  if (messages.length === 0 && !isTyping) {
    return (
      <div className={cn("flex-1 overflow-hidden", className)}>
        <ChatWelcome 
          config={config} 
          onQuickAction={onQuickAction}
          onSendMessage={onSendMessage}
        />
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        className
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Messages */}
      <div className="relative py-4">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            config={config}
            isLast={index === messages.length - 1 && !isTyping}
          />
        ))}

        {/* Typing indicator */}
        {isTyping && <ChatTyping />}

        {/* Scroll anchor */}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  )
}
