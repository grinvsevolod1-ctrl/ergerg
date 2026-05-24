"use client"

/**
 * Personal Nexik Dashboard - Личный кабинет с персональным AI
 * Полноценный AI-ассистент, который знает всё о бизнесе пользователя
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Send, 
  Sparkles, 
  Settings, 
  MessageSquare, 
  BarChart3, 
  BookOpen,
  Lightbulb,
  Plus,
  ChevronRight,
  User,
  Building2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { NexikOnboarding, OnboardingData } from '@/components/nexik/onboarding'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface BusinessProfile {
  businessName: string | null
  businessType: string | null
  description: string | null
  onboardingCompleted: boolean
}

interface QuickAction {
  id: string
  icon: React.ElementType
  label: string
  prompt: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: 'ideas', icon: Lightbulb, label: 'Идеи для контента', prompt: 'Предложи 5 идей для контента в соцсетях на эту неделю' },
  { id: 'response', icon: MessageSquare, label: 'Ответ клиенту', prompt: 'Помоги составить ответ клиенту, который жалуется на...' },
  { id: 'analysis', icon: BarChart3, label: 'Анализ конкурентов', prompt: 'Проанализируй основных конкурентов в моей нише' },
  { id: 'script', icon: BookOpen, label: 'Скрипт продаж', prompt: 'Напиши скрипт для первого контакта с потенциальным клиентом' },
]

export default function PersonalNexikPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load profile and messages
  useEffect(() => {
    loadProfile()
  }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/nexik/personal/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        
        if (!data.profile?.onboardingCompleted) {
          setShowOnboarding(true)
        } else {
          // Load conversation history
          loadMessages()
          // Add welcome back message if no messages
          if (messages.length === 0) {
            const welcomeMsg: Message = {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Привет! Рад видеть тебя снова${data.profile?.businessName ? `, ${data.profile.businessName}` : ''}. Чем могу помочь сегодня?`,
              timestamp: new Date()
            }
            setMessages([welcomeMsg])
          }
        }
      } else {
        // Not authenticated - redirect to login
        window.location.href = '/nexik/login?redirect=/nexik/app'
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/nexik/personal/messages?limit=50')
      if (res.ok) {
        const data = await res.json()
        if (data.messages?.length > 0) {
          setMessages(data.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.created_at)
          })))
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      // Save profile
      await fetch('/api/nexik/personal/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: data.businessName,
          businessType: data.businessType,
          industry: data.industry,
          shortDescription: data.description,
          services: data.services,
          painPoints: data.painPoints,
          goals: data.goals,
          targetAudience: data.targetAudience,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          websiteUrl: data.websiteUrl,
          onboardingCompleted: true
        })
      })

      setShowOnboarding(false)
      setProfile({
        businessName: data.businessName,
        businessType: data.businessType,
        description: data.description,
        onboardingCompleted: true
      })

      // Add welcome message
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Отлично, ${data.businessName}! Теперь я знаю всё о твоём бизнесе и готов помогать.\n\nМогу предложить идеи для контента, написать ответы клиентам, помочь с продажами — и многое другое. Просто спроси!`,
        timestamp: new Date()
      }
      setMessages([welcomeMsg])

    } catch (error) {
      console.error('Failed to save profile:', error)
    }
  }

  const sendMessage = useCallback(async (content?: string) => {
    const messageText = content || input.trim()
    if (!messageText || isTyping) return

    setInput('')

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      const res = await fetch('/api/nexik/personal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Add bot response
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])

    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Произошла ошибка. Попробуй ещё раз.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleQuickAction = (action: QuickAction) => {
    setInput(action.prompt)
    inputRef.current?.focus()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background">
        <NexikOnboarding onComplete={handleOnboardingComplete} />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border bg-card/50">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">Nexik</h1>
              <p className="text-xs text-muted-foreground">Персональный AI</p>
            </div>
          </div>
        </div>

        {/* Business info */}
        {profile && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{profile.businessName || 'Мой бизнес'}</span>
            </div>
            {profile.businessType && (
              <p className="text-xs text-muted-foreground pl-7">{profile.businessType}</p>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="flex-1 p-4 overflow-y-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Быстрые действия</p>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left",
                    "hover:bg-accent text-sm transition-colors",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom nav */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/nexik/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Аналитика</span>
          </Link>
          <Link
            href="/nexik/dashboard/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Настройки</span>
          </Link>
        </div>
      </aside>

      {/* Main chat area */}
      <main className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">Nexik</span>
          </div>
          <Link href="/nexik/dashboard" className="p-2 rounded-lg hover:bg-accent">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Привет! Я твой персональный Nexik</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Я знаю всё о твоём бизнесе и готов помогать. Спроси что угодно или выбери быстрое действие слева.
                </p>
              </div>
            )}

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
                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
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

        {/* Mobile quick actions */}
        {messages.length < 3 && (
          <div className="lg:hidden px-4 pb-2">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-full text-sm hover:bg-accent transition-colors"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Спроси что угодно..."
              rows={1}
              disabled={isTyping}
              className={cn(
                "flex-1 bg-background border border-border rounded-xl px-4 py-3 resize-none",
                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                "placeholder:text-muted-foreground",
                "disabled:opacity-50",
                "min-h-[48px] max-h-32"
              )}
              style={{
                height: 'auto',
                minHeight: '48px'
              }}
            />
            <Button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="w-12 h-12 rounded-xl flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
