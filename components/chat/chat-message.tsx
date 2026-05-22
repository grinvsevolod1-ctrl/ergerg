"use client"

import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ChatMessage as ChatMessageType, ChatConfig } from './types'
import { Check, CheckCheck, Copy, AlertCircle, ThumbsUp, ThumbsDown, RotateCcw, MoreHorizontal } from 'lucide-react'
import { SiriOrb } from '@/components/ai-orb'

interface ChatMessageProps {
  message: ChatMessageType
  config: ChatConfig
  isLast?: boolean
  onReaction?: (messageId: string, reaction: 'like' | 'dislike') => void
  onRetry?: (messageId: string) => void
  className?: string
}

export function ChatMessage({ 
  message, 
  config, 
  isLast, 
  onReaction,
  onRetry,
  className 
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null)
  const [showActions, setShowActions] = useState(false)
  
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'
  
  const formattedTime = useMemo(() => {
    if (!config.showTimestamp) return null
    return message.timestamp.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }, [message.timestamp, config.showTimestamp])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [message.content])

  const handleReaction = useCallback((type: 'like' | 'dislike') => {
    const newReaction = reaction === type ? null : type
    setReaction(newReaction)
    if (onReaction && newReaction) {
      onReaction(message.id, newReaction)
    }
  }, [reaction, onReaction, message.id])

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry(message.id)
    }
  }, [onRetry, message.id])

  // System message
  if (isSystem) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex justify-center py-3",
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
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={cn(
        "group flex gap-3 px-5 py-2",
        isUser ? "justify-end" : "justify-start",
        isLast && "pb-4",
        className
      )}
    >
      {/* Avatar - assistant */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <motion.div 
            className="relative"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div 
              className="absolute inset-0 rounded-full blur-md opacity-40"
              style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.4) 0%, transparent 70%)' }}
            />
            <SiriOrb size={32} isHovered={false} />
          </motion.div>
        </div>
      )}

      {/* Message bubble */}
      <div className="flex flex-col gap-1 max-w-[75%]">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={cn(
            "relative px-4 py-3 rounded-2xl",
            "transition-all duration-200",
            isUser ? [
              "bg-gradient-to-br from-teal-500 to-teal-600",
              "text-white",
              "rounded-br-md",
              "shadow-lg shadow-teal-500/20",
            ] : [
              "bg-zinc-800/90",
              "backdrop-blur-sm",
              "border border-zinc-700/50",
              "text-zinc-100",
              "rounded-bl-md",
              "shadow-lg shadow-black/20",
            ]
          )}
        >
          {/* Content with word-by-word animation for new messages */}
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>

          {/* Quick actions from AI */}
          {message.actions && message.actions.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-zinc-600/50"
            >
              {message.actions.map((action, i) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-full",
                    "bg-zinc-700/80 hover:bg-teal-500/20",
                    "border border-zinc-600 hover:border-teal-500/50",
                    "text-zinc-200 transition-all duration-200"
                  )}
                >
                  {action.label}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Action buttons for assistant messages */}
          <AnimatePresence>
            {!isUser && showActions && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute -bottom-8 left-0 flex items-center gap-1"
              >
                {/* Like */}
                <button
                  onClick={() => handleReaction('like')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                    reaction === 'like' 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Полезный ответ"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                
                {/* Dislike */}
                <button
                  onClick={() => handleReaction('dislike')}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                    reaction === 'dislike' 
                      ? "text-red-400 bg-red-500/10 border-red-500/30" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Не полезный ответ"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                    copied 
                      ? "text-emerald-400" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Копировать"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Retry */}
                {isLast && onRetry && (
                  <button
                    onClick={handleRetry}
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      "hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                      "text-zinc-500 hover:text-zinc-300"
                    )}
                    title="Повторить запрос"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* More actions */}
                <button
                  className={cn(
                    "p-1.5 rounded-lg transition-all duration-200",
                    "hover:bg-zinc-800 border border-transparent hover:border-zinc-700",
                    "text-zinc-500 hover:text-zinc-300"
                  )}
                  title="Ещё"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Timestamp & status */}
        <div className={cn(
          "flex items-center gap-2 px-1",
          isUser ? "justify-end" : "justify-start",
          !isUser && showActions ? "mt-6" : ""
        )}>
          {formattedTime && (
            <span className="text-[10px] text-zinc-500">
              {formattedTime}
            </span>
          )}
          {isUser && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <CheckCheck className={cn(
                "w-3 h-3",
                message.status === 'sent' ? "text-zinc-500" : "text-teal-400"
              )} />
            </motion.div>
          )}
        </div>
      </div>

      {/* Avatar - user */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "w-8 h-8 rounded-full",
              "bg-gradient-to-br from-teal-500/20 to-teal-500/5",
              "border border-teal-500/30",
              "flex items-center justify-center"
            )}
          >
            <span className="text-xs font-semibold text-teal-400">
              {config.userName?.charAt(0).toUpperCase() || 'U'}
            </span>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
