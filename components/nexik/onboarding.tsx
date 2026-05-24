"use client"

/**
 * Nexik Onboarding - Интерактивный онбординг через чат с Nexik
 * Nexik узнаёт всё о бизнесе пользователя в естественном разговоре
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Send, ArrowRight, Sparkles, Check, Building2, Target, Users, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OnboardingMessage {
  id: string
  role: 'assistant' | 'user'
  content: string
  timestamp: Date
}

interface OnboardingProps {
  onComplete: (profileData: OnboardingData) => void
  userName?: string
}

export interface OnboardingData {
  businessName: string
  businessType: string
  industry: string
  description: string
  services: string[]
  painPoints: string[]
  goals: string[]
  targetAudience: string
  contactPhone?: string
  contactEmail?: string
  websiteUrl?: string
}

const ONBOARDING_STEPS = [
  { id: 'intro', icon: Sparkles, title: 'Знакомство' },
  { id: 'business', icon: Building2, title: 'О бизнесе' },
  { id: 'audience', icon: Users, title: 'Аудитория' },
  { id: 'goals', icon: Target, title: 'Цели' },
  { id: 'complete', icon: Check, title: 'Готово' },
]

export function NexikOnboarding({ onComplete, userName }: OnboardingProps) {
  const [messages, setMessages] = useState<OnboardingMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [collectedData, setCollectedData] = useState<Partial<OnboardingData>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initial greeting
  useEffect(() => {
    const greeting = userName 
      ? `Привет, ${userName}! Я Nexik — твой персональный AI-директор.`
      : `Привет! Я Nexik — твой персональный AI-директор.`
    
    addBotMessage(greeting + `\n\nЧтобы я мог максимально эффективно помогать твоему бизнесу, мне нужно узнать о нём побольше. Это займёт пару минут.\n\nРасскажи, как называется твой бизнес и чем вы занимаетесь?`)
    
    setTimeout(() => inputRef.current?.focus(), 500)
  }, [userName])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const addBotMessage = (content: string) => {
    const msg: OnboardingMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, msg])
  }

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userInput = input.trim()
    setInput('')

    // Add user message
    const userMsg: OnboardingMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    // Process with AI
    try {
      const response = await fetch('/api/nexik/onboarding/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userInput,
          currentStep,
          collectedData,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()

      if (data.error) {
        addBotMessage('Произошла ошибка. Попробуй ещё раз.')
        setIsTyping(false)
        return
      }

      // Update collected data
      if (data.extractedData) {
        setCollectedData(prev => ({ ...prev, ...data.extractedData }))
      }

      // Update step
      if (data.nextStep !== undefined) {
        setCurrentStep(data.nextStep)
      }

      // Add bot response with typing effect
      setTimeout(() => {
        addBotMessage(data.response)
        setIsTyping(false)

        // Check if complete
        if (data.isComplete && data.finalData) {
          setTimeout(() => {
            onComplete(data.finalData)
          }, 2000)
        }
      }, 500)

    } catch (error) {
      console.error('Onboarding error:', error)
      addBotMessage('Упс, что-то пошло не так. Давай попробуем ещё раз.')
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Progress bar */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Настройка Nexik</span>
            <span className="text-sm text-primary">{Math.round((currentStep / (ONBOARDING_STEPS.length - 1)) * 100)}%</span>
          </div>
          <div className="flex gap-2">
            {ONBOARDING_STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  "flex-1 h-1.5 rounded-full transition-colors duration-300",
                  idx <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {ONBOARDING_STEPS.map((step, idx) => {
              const Icon = step.icon
              return (
                <div
                  key={step.id}
                  className={cn(
                    "flex flex-col items-center gap-1 transition-colors",
                    idx <= currentStep ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] hidden sm:block">{step.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3 whitespace-pre-wrap",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Напиши здесь..."
              disabled={isTyping}
              className={cn(
                "flex-1 bg-background border border-border rounded-xl px-4 py-3",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground",
                "disabled:opacity-50"
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="w-12 h-12 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Можешь отвечать как угодно — я всё пойму
          </p>
        </div>
      </div>
    </div>
  )
}
