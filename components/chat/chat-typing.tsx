"use client"

import { cn } from '@/lib/utils'
import { SiriOrb } from '@/components/ai-orb'

interface ChatTypingProps {
  className?: string
}

export function ChatTyping({ className }: ChatTypingProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-5 py-3",
        "animate-in fade-in slide-in-from-left-4 duration-300",
        className
      )}
    >
      {/* Mini orb with glow */}
      <div className="relative flex-shrink-0">
        <div 
          className="absolute inset-[-6px] rounded-full opacity-50 blur-md animate-pulse"
          style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.4) 0%, transparent 70%)' }}
        />
        <SiriOrb size={32} isHovered={true} isActive={true} />
      </div>

      {/* Typing indicator bubble */}
      <div className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-md",
        "bg-zinc-800 border border-zinc-700"
      )}>
        <span className="text-sm text-zinc-400">Печатает</span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span 
              key={i}
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-teal-400",
                "animate-bounce"
              )}
              style={{ 
                animationDelay: `${i * 150}ms`,
                animationDuration: '0.6s'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
