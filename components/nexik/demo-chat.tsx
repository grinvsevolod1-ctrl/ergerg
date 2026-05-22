"use client"

/**
 * NexikDemoChat - Умный демо-чат для главной страницы
 * 
 * Показывает возможности Nexik в реальном времени.
 * Запоминает всё о пользователе и продолжает разговор при переходе на /start.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Send, X, Sparkles, ArrowRight, Mic, MicOff } from 'lucide-react'
import {
  getOrCreateVisitor,
  getCurrentConversation,
  addMessage,
  getConversationHistory,
  updateBusinessContext,
  updateStage,
  getBusinessContext,
  addFact,
  NexikMessage,
} from '@/lib/nexik/services/unified-memory'

interface NexikDemoChatProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onStartOnboarding?: () => void
}

export function NexikDemoChat({ isOpen, onOpenChange, onStartOnboarding }: NexikDemoChatProps) {
  const [messages, setMessages] = useState<NexikMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Load conversation on mount
  useEffect(() => {
    if (isOpen) {
      const conv = getCurrentConversation('homepage')
      
      if (conv.messages.length > 0) {
        setMessages(conv.messages)
      } else {
        // First time - add welcome message
        const visitor = getOrCreateVisitor()
        const welcomeContent = visitor.name 
          ? `С возвращением, ${visitor.name}! Рад снова тебя видеть. Чем могу помочь?`
          : `Привет! Я Nexik — AI-директор для бизнеса. Могу заменить целый отдел: отвечать клиентам, управлять соцсетями, обрабатывать заявки — и всё это 24/7.\n\nРасскажи о своём бизнесе — покажу, как могу помочь именно тебе.`
        
        const welcomeMsg = addMessage('assistant', welcomeContent)
        setMessages([welcomeMsg])
      }
      
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])
  
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Show CTA after business is described
  useEffect(() => {
    const visitor = getOrCreateVisitor()
    if (visitor.businessType && messages.length >= 4) {
      setShowCTA(true)
    }
  }, [messages])
  
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping || isThinking) return
    
    const userContent = input.trim()
    setInput('')
    
    // Add user message
    const userMsg = addMessage('user', userContent)
    setMessages(prev => [...prev, userMsg])
    
    // Show thinking
    setIsThinking(true)
    
    try {
      // Get context
      const history = getConversationHistory(10)
      const businessCtx = getBusinessContext()
      
      console.log('[v0] NexikDemoChat calling API with:', userContent)
      
      // Call AI
      const response = await fetch('/api/nexik/analyze-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userContent,
          conversationHistory: history,
          businessContext: businessCtx,
          page: 'homepage',
          mode: 'demo',
        }),
      })
      
      if (!response.ok) throw new Error('API error')
      
      const data = await response.json()
      
      console.log('[v0] NexikDemoChat API response:', data)
      
      setIsThinking(false)
      
      // Animate typing
      await typeMessage(data.response)
      
      // Update business context if detected
      if (data.isValidBusiness && data.businessType) {
        updateBusinessContext({
          type: data.businessType,
          description: userContent,
        })
        updateStage('discovery')
        
        // Show CTA after business description
        setTimeout(() => setShowCTA(true), 1000)
      }
      
      // Extract facts if any
      if (data.extractedFacts) {
        data.extractedFacts.forEach((fact: string) => addFact(fact))
      }
      
    } catch (error) {
      setIsThinking(false)
      const errorMsg = addMessage('assistant', 'Упс, что-то пошло не так. Попробуй ещё раз!')
      setMessages(prev => [...prev, errorMsg])
    }
  }, [input, isTyping, isThinking])
  
  // Typing animation
  const typeMessage = async (content: string) => {
    setIsTyping(true)
    
    // Add empty message that will be filled
    const msgId = Date.now().toString()
    setMessages(prev => [...prev, {
      id: msgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }])
    
    // Type character by character with varying speed
    let currentContent = ''
    const words = content.split(' ')
    
    for (const word of words) {
      currentContent += (currentContent ? ' ' : '') + word
      setMessages(prev => 
        prev.map(m => m.id === msgId ? { ...m, content: currentContent } : m)
      )
      
      // Random delay between words (30-80ms)
      await new Promise(r => setTimeout(r, 30 + Math.random() * 50))
    }
    
    // Save to memory
    addMessage('assistant', content)
    
    setIsTyping(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const handleStartClick = () => {
    // Continue to /start with all context preserved
    if (onStartOnboarding) {
      onStartOnboarding()
    } else {
      window.location.href = '/nexik/start'
    }
  }
  
  if (!isOpen) return null
  
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Chat Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "fixed z-[101] inset-4 md:inset-auto",
          "md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-[min(600px,90vw)] md:h-[min(700px,85vh)]",
          "flex flex-col",
          "bg-zinc-900 border border-zinc-700/50",
          "rounded-3xl overflow-hidden",
          "shadow-[0_0_100px_-20px_rgba(79,209,197,0.4)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Nexik</h3>
              <p className="text-xs text-zinc-400">AI-директор для бизнеса</p>
            </div>
          </div>
          
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex",
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-3 rounded-2xl",
                    msg.role === 'user'
                      ? "bg-teal-500/20 text-teal-50 rounded-br-md"
                      : "bg-zinc-800 text-zinc-100 rounded-bl-md"
                  )}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Thinking indicator */}
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* CTA Banner */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-2"
            >
              <button
                onClick={handleStartClick}
                className={cn(
                  "w-full py-3 px-4 rounded-xl",
                  "bg-gradient-to-r from-teal-500 to-cyan-500",
                  "text-white font-medium",
                  "flex items-center justify-center gap-2",
                  "hover:from-teal-400 hover:to-cyan-400",
                  "transition-all duration-300",
                  "shadow-lg shadow-teal-500/25"
                )}
              >
                <span>Запустить Nexik для моего бизнеса</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Input */}
        <div className="px-4 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-2 bg-zinc-800/50 rounded-2xl px-4 py-2 border border-zinc-700/50 focus-within:border-teal-500/50 transition-colors">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Расскажи о своём бизнесе..."
              disabled={isTyping || isThinking}
              className={cn(
                "flex-1 bg-transparent text-white text-sm",
                "placeholder:text-zinc-500",
                "focus:outline-none",
                "disabled:opacity-50"
              )}
            />
            
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping || isThinking}
              className={cn(
                "p-2 rounded-xl transition-all",
                input.trim() && !isTyping && !isThinking
                  ? "bg-teal-500 text-white hover:bg-teal-400"
                  : "bg-zinc-700 text-zinc-500"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-center text-xs text-zinc-500 mt-2">
            Nexik запоминает всё и продолжит разговор при регистрации
          </p>
        </div>
      </motion.div>
    </>
  )
}

export default NexikDemoChat
