"use client"

import { MessageSquare, Calendar, Headphones, ArrowRight, Calculator, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiriOrb } from '@/components/ai-orb'
import { ChatConfig, ChatAction } from './types'

interface ChatWelcomeProps {
  config: ChatConfig
  onQuickAction?: (action: ChatAction) => void
  onSendMessage?: (message: string) => void
  className?: string
}

// Static icon mapping
const getIcon = (iconName?: string): LucideIcon => {
  switch (iconName) {
    case 'MessageSquare': return MessageSquare
    case 'Calendar': return Calendar
    case 'Headphones': return Headphones
    case 'Calculator': return Calculator
    default: return MessageSquare
  }
}

const defaultQuickActions: ChatAction[] = [
  { id: '1', label: 'Узнать об услугах', action: 'custom', icon: 'MessageSquare' },
  { id: '2', label: 'Записаться на консультацию', action: 'consultation', icon: 'Calendar' },
  { id: '3', label: 'Связаться с оператором', action: 'operator', icon: 'Headphones' },
]

export function ChatWelcome({ config, onQuickAction, className }: ChatWelcomeProps) {
  const quickActions = config.quickActions || defaultQuickActions

  const handleAction = (action: ChatAction) => {
    if (onQuickAction) {
      onQuickAction(action)
    }
  }

  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center flex-1 p-6 relative",
        className
      )}
      style={{ backgroundColor: 'rgb(24, 24, 27)' }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(79,209,197,0.3) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Orb with enhanced glow */}
      <div className="relative mb-8">
        <div 
          className="absolute inset-[-50px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.4) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute inset-[-25px] rounded-full opacity-60 blur-xl"
          style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.3) 0%, transparent 70%)' }}
        />
        <SiriOrb size={110} isHovered={true} />
      </div>

      {/* Welcome content */}
      <div className="relative text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h3 className="text-2xl font-bold text-white">
            {config.assistantName}
          </h3>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30">
            <div className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">AI</span>
          </div>
        </div>
        <p className="text-sm text-zinc-400 max-w-[320px] leading-relaxed">
          {config.welcomeMessage}
        </p>
      </div>

      {/* Quick actions */}
      <div className="relative w-full max-w-[360px] space-y-3">
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center mb-5 flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-zinc-700" />
          Быстрые действия
          <span className="w-8 h-px bg-zinc-700" />
        </p>
        
        {quickActions.map((action) => {
          const IconComponent = getIcon(action.icon)
          const isOperator = action.action === 'operator'
          
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={cn(
                "group w-full flex items-center gap-4 p-4 rounded-2xl",
                "text-left transition-all duration-200",
                "hover:translate-x-1 active:scale-[0.98]",
                isOperator 
                  ? "bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40"
                  : "bg-zinc-800/80 border border-zinc-700 hover:border-teal-500/40"
              )}
            >
              {/* Icon container */}
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
                isOperator 
                  ? "bg-blue-500/20 border border-blue-500/30"
                  : "bg-teal-500/10 border border-teal-500/20"
              )}>
                <IconComponent className={cn(
                  "w-5 h-5",
                  isOperator ? "text-blue-400" : "text-teal-400"
                )} />
              </div>
              
              {/* Label */}
              <div className="flex-1">
                <span className={cn(
                  "text-sm font-medium",
                  isOperator ? "text-white" : "text-zinc-100"
                )}>
                  {action.label}
                </span>
                {isOperator && (
                  <p className="text-[11px] text-zinc-500 mt-0.5">Живой человек ответит вам</p>
                )}
              </div>

              {/* Arrow */}
              <ArrowRight className={cn(
                "w-4 h-4 transition-transform duration-200 group-hover:translate-x-1",
                isOperator ? "text-blue-500/50" : "text-zinc-500"
              )} />
            </button>
          )
        })}
      </div>

      {/* Footer */}
      <div className="relative flex items-center gap-3 mt-12 text-zinc-600">
        <div className="w-12 h-px bg-zinc-700" />
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-500/50" />
          <span className="text-[11px]">Powered by <span className="text-teal-500 font-medium">{config.companyName}</span></span>
        </div>
        <div className="w-12 h-px bg-zinc-700" />
      </div>
    </div>
  )
}
