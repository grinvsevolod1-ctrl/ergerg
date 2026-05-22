"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquare, Calendar, Headphones, ArrowRight, Calculator, 
  Sparkles, Zap, Brain, Rocket, ChevronDown,
  type LucideIcon 
} from 'lucide-react'
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
    case 'Sparkles': return Sparkles
    case 'Zap': return Zap
    case 'Brain': return Brain
    case 'Rocket': return Rocket
    default: return MessageSquare
  }
}

// Animated typing text
function TypeWriter({ texts, className }: { texts: string[], className?: string }) {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  
  useEffect(() => {
    const text = texts[currentTextIndex]
    const speed = isDeleting ? 30 : 50
    
    if (!isDeleting && displayText === text) {
      setTimeout(() => setIsDeleting(true), 2000)
      return
    }
    
    if (isDeleting && displayText === '') {
      setIsDeleting(false)
      setCurrentTextIndex((prev) => (prev + 1) % texts.length)
      return
    }
    
    const timeout = setTimeout(() => {
      setDisplayText(prev => 
        isDeleting 
          ? prev.slice(0, -1) 
          : text.slice(0, prev.length + 1)
      )
    }, speed)
    
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, currentTextIndex, texts])
  
  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// Floating particles
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-teal-400/30 rounded-full"
          initial={{ 
            x: Math.random() * 400, 
            y: Math.random() * 400,
            scale: Math.random() * 0.5 + 0.5 
          }}
          animate={{ 
            y: [null, Math.random() * -100],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{ 
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        />
      ))}
    </div>
  )
}

// Hint tooltip component
function HintTooltip({ text, position = 'top' }: { text: string, position?: 'top' | 'bottom' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? 10 : -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg",
        "bg-zinc-900 border border-zinc-700 shadow-xl",
        "text-xs text-zinc-300 whitespace-nowrap z-50",
        position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
    >
      {text}
      <div className={cn(
        "absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 border-zinc-700 rotate-45",
        position === 'top' 
          ? 'top-full -mt-1 border-r border-b' 
          : 'bottom-full -mb-1 border-l border-t'
      )} />
    </motion.div>
  )
}

const defaultQuickActions: ChatAction[] = [
  { id: '1', label: 'Разработка сайтов', action: 'custom', icon: 'Rocket' },
  { id: '2', label: 'AI-решения для бизнеса', action: 'custom', icon: 'Brain' },
  { id: '3', label: 'Узнать стоимость', action: 'custom', icon: 'Calculator' },
  { id: '4', label: 'Записаться на консультацию', action: 'consultation', icon: 'Calendar' },
  { id: '5', label: 'Связаться с оператором', action: 'operator', icon: 'Headphones' },
]

const typingExamples = [
  'Сколько стоит разработка сайта?',
  'Расскажи про AI-ассистентов',
  'Как работает Nexik?',
  'Хочу автоматизировать бизнес',
]

const features = [
  { icon: Zap, text: 'Отвечаю за секунды' },
  { icon: Brain, text: 'Учусь и запоминаю' },
  { icon: Sparkles, text: 'Работаю 24/7' },
]

export function ChatWelcome({ config, onQuickAction, onSendMessage, className }: ChatWelcomeProps) {
  const quickActions = config.quickActions || defaultQuickActions
  const [hoveredAction, setHoveredAction] = useState<string | null>(null)
  const [showScrollHint, setShowScrollHint] = useState(true)

  const handleAction = (action: ChatAction) => {
    if (onQuickAction) {
      onQuickAction(action)
    }
  }

  // Hide scroll hint after interaction
  useEffect(() => {
    const timer = setTimeout(() => setShowScrollHint(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      className={cn(
        "flex flex-col items-center flex-1 p-6 relative overflow-y-auto",
        className
      )}
      style={{ backgroundColor: 'rgb(24, 24, 27)' }}
    >
      <FloatingParticles />
      
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: 'radial-gradient(circle, rgba(79,209,197,0.3) 0%, transparent 60%)',
          }}
        />
      </motion.div>

      {/* Orb with enhanced glow */}
      <motion.div 
        className="relative mb-6 mt-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div 
          className="absolute inset-[-50px] rounded-full blur-3xl"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.4) 0%, transparent 60%)' }}
        />
        <motion.div 
          className="absolute inset-[-25px] rounded-full blur-xl"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.3) 0%, transparent 70%)' }}
        />
        <SiriOrb size={100} isHovered={true} />
      </motion.div>

      {/* Welcome content */}
      <motion.div 
        className="relative text-center mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-center gap-2 mb-3">
          <h3 className="text-2xl font-bold text-white">
            {config.assistantName}
          </h3>
          <motion.div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-500/20 border border-teal-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">AI</span>
          </motion.div>
        </div>
        
        <p className="text-sm text-zinc-400 max-w-[320px] leading-relaxed mb-4">
          {config.welcomeMessage}
        </p>

        {/* Feature badges */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700"
            >
              <feature.icon className="w-3 h-3 text-teal-400" />
              <span className="text-[10px] text-zinc-400">{feature.text}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Typing example hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="relative mb-6 px-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 max-w-[340px]"
      >
        <p className="text-[10px] text-zinc-500 mb-1">Попробуй спросить:</p>
        <TypeWriter 
          texts={typingExamples}
          className="text-sm text-zinc-300"
        />
      </motion.div>

      {/* Quick actions */}
      <motion.div 
        className="relative w-full max-w-[360px]"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-center mb-4 flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-zinc-700" />
          Быстрые действия
          <span className="w-8 h-px bg-zinc-700" />
        </p>
        
        <div className="space-y-2">
          {quickActions.map((action, index) => {
            const IconComponent = getIcon(action.icon)
            const isOperator = action.action === 'operator'
            const isHovered = hoveredAction === action.id
            
            return (
              <motion.button
                key={action.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => handleAction(action)}
                onMouseEnter={() => setHoveredAction(action.id)}
                onMouseLeave={() => setHoveredAction(null)}
                className={cn(
                  "group w-full flex items-center gap-3 p-3 rounded-xl relative",
                  "text-left transition-all duration-200",
                  "hover:translate-x-1 active:scale-[0.98]",
                  isOperator 
                    ? "bg-blue-500/10 border border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/15"
                    : "bg-zinc-800/60 border border-zinc-700/50 hover:border-teal-500/40 hover:bg-zinc-800/80"
                )}
              >
                {/* Hover hint */}
                <AnimatePresence>
                  {isHovered && action.action === 'consultation' && (
                    <HintTooltip text="Бесплатная консультация 15 минут" />
                  )}
                  {isHovered && isOperator && (
                    <HintTooltip text="Среднее время ответа: 2 минуты" />
                  )}
                </AnimatePresence>

                {/* Icon container */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                  isOperator 
                    ? "bg-blue-500/20 border border-blue-500/30 group-hover:bg-blue-500/30"
                    : "bg-teal-500/10 border border-teal-500/20 group-hover:bg-teal-500/20"
                )}>
                  <IconComponent className={cn(
                    "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                    isOperator ? "text-blue-400" : "text-teal-400"
                  )} />
                </div>
                
                {/* Label */}
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm font-medium block truncate",
                    isOperator ? "text-white" : "text-zinc-100"
                  )}>
                    {action.label}
                  </span>
                  {isOperator && (
                    <span className="text-[10px] text-zinc-500">Живой человек ответит вам</span>
                  )}
                </div>

                {/* Arrow */}
                <ArrowRight className={cn(
                  "w-4 h-4 transition-all duration-200 group-hover:translate-x-1",
                  isOperator ? "text-blue-500/50 group-hover:text-blue-400" : "text-zinc-600 group-hover:text-teal-400"
                )} />
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Nexik promo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative mt-6 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-500/20 max-w-[360px] w-full"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white mb-1">Хочешь такого же для своего бизнеса?</p>
            <p className="text-xs text-zinc-400 mb-2">Nexik - AI-ассистент который работает 24/7</p>
            <button 
              onClick={() => onSendMessage?.('Расскажи про Nexik')}
              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1"
            >
              Узнать больше <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <AnimatePresence>
        {showScrollHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-500"
          >
            <span className="text-[10px]">Прокрутите для подсказок</span>
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.div 
        className="relative flex items-center gap-3 mt-8 text-zinc-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="w-12 h-px bg-zinc-700" />
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-teal-500"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[11px]">Powered by <span className="text-teal-500 font-medium">{config.companyName}</span></span>
        </div>
        <div className="w-12 h-px bg-zinc-700" />
      </motion.div>
    </div>
  )
}
