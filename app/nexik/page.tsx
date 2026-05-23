"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Mic, MicOff, Check, Loader2, Globe, MessageCircle, Zap, Shield, Clock } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

// Session type
interface Session {
  member: {
    id: string
    email: string
    name: string
    role: string
  }
  org: {
    id: string
    name: string
    plan: string
  }
}

// Platforms
const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" },
  { id: "telegram", name: "Telegram", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
  { id: "whatsapp", name: "WhatsApp", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" },
  { id: "website", name: "Сайт", icon: null },
]

// AI responses for different business types
const AI_RESPONSES: Record<string, string> = {
  "автосервис": `Отлично! Для автосервиса я могу:

- Записывать на ТО и ремонт
- Отвечать о ценах и сроках
- Сообщать статус ремонта
- Напоминать о плановом ТО

Где вы хотите использовать Nexik?`,

  "салон": `Супер! Для салона красоты я умею:

- Записывать к мастерам
- Показывать свободные окна
- Напоминать о визите
- Собирать отзывы

Где вы хотите использовать Nexik?`,

  "ресторан": `Круто! Для ресторана я могу:

- Принимать заказы на доставку
- Бронировать столики
- Показывать меню
- Собирать отзывы

Где вы хотите использовать Nexik?`,

  "default": `Понял! Для вашего бизнеса я могу:

- Отвечать клиентам 24/7
- Записывать на услуги
- Собирать заявки и контакты
- Отвечать на частые вопросы

Где вы хотите использовать Nexik?`
}

function getAIResponse(input: string): { response: string; isValidBusiness: boolean } {
  const lower = input.toLowerCase()
  
  if (lower.includes("авто") || lower.includes("сто") || lower.includes("ремонт")) {
    return { response: AI_RESPONSES["автосервис"], isValidBusiness: true }
  }
  if (lower.includes("салон") || lower.includes("красот") || lower.includes("маникюр") || lower.includes("ресниц") || lower.includes("эпиляц")) {
    return { response: AI_RESPONSES["салон"], isValidBusiness: true }
  }
  if (lower.includes("ресторан") || lower.includes("кафе") || lower.includes("доставк")) {
    return { response: AI_RESPONSES["ресторан"], isValidBusiness: true }
  }
  if (lower.length > 10) {
    return { response: AI_RESPONSES["default"], isValidBusiness: true }
  }
  
  return { 
    response: "Расскажите подробнее - какой у вас бизнес? Например: салон красоты, автосервис, ресторан...", 
    isValidBusiness: false 
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  showPlatforms?: boolean
}

// Main content component
function NexikContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Session state
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "1", 
      role: "assistant", 
      content: "Привет! Я Nexik - AI-ассистент для бизнеса.\n\nОтвечаю клиентам за секунды, 24/7, на любой платформе.\n\nРасскажите, какой у вас бизнес?"
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [businessValidated, setBusinessValidated] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/nexik/auth/session')
        if (res.ok) {
          const data = await res.json()
          if (data.session) {
            setSession(data.session)
          }
        }
      } catch (e) {
        console.error('Session check failed:', e)
      } finally {
        setSessionLoading(false)
      }
    }
    checkSession()
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Speech recognition
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается')
      return
    }
    
    if (isListening) {
      setIsListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'ru-RU'
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript)
      setIsListening(false)
    }

    recognition.start()
  }, [isListening])

  // Send message
  const send = useCallback(async () => {
    if (!input.trim() || isTyping) return
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // Simulate thinking
    await new Promise(r => setTimeout(r, 800))

    try {
      // Call AI API
      const res = await fetch('/api/nexik/analyze-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: userMsg.content,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      if (res.ok) {
        const data = await res.json()
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: "assistant", 
          content: data.response,
          showPlatforms: data.isValidBusiness && !businessValidated
        }
        setMessages(prev => [...prev, aiMsg])
        
        if (data.isValidBusiness) {
          setBusinessValidated(true)
        }
      } else {
        throw new Error('API error')
      }
    } catch {
      // Fallback
      const { response, isValidBusiness } = getAIResponse(userMsg.content)
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "assistant", 
        content: response,
        showPlatforms: isValidBusiness && !businessValidated
      }
      setMessages(prev => [...prev, aiMsg])
      
      if (isValidBusiness) {
        setBusinessValidated(true)
      }
    }
    
    setIsTyping(false)
  }, [input, isTyping, messages, businessValidated])

  // Handle platform selection
  const handlePlatformSelect = (platformId: string) => {
    setSelectedPlatform(platformId)
    
    // Add message about selection
    const platformName = PLATFORMS.find(p => p.id === platformId)?.name || platformId
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content: `Отлично, ${platformName}! Давайте настроим Nexik.\n\nДля начала нужно создать аккаунт - это займет 30 секунд.`
    }])
    
    // Redirect to register with platform info
    setTimeout(() => {
      if (session) {
        router.push(`/nexik/connect/${platformId}`)
      } else {
        router.push(`/nexik/register?platform=${platformId}`)
      }
    }, 1500)
  }

  // Quick actions
  const quickActions = ["Салон красоты", "Автосервис", "Ресторан", "Магазин"]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/nexik" className="flex items-center gap-2">
            <SiriOrb size={32} state="idle" />
            <span className="font-semibold text-lg">Nexik</span>
          </Link>
          
          {sessionLoading ? (
            <div className="w-20 h-9 bg-white/5 rounded-lg animate-pulse" />
          ) : session ? (
            <Link 
              href="/nexik/dashboard"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              {session.member.name || 'Dashboard'}
            </Link>
          ) : (
            <Link 
              href="/nexik/login"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-colors"
            >
              Войти
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="pt-24 pb-8 px-4">
        <div className="max-w-lg mx-auto">
          
          {/* Hero section - only show if no messages sent yet */}
          {messages.length === 1 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="flex justify-center mb-6">
                <SiriOrb size={80} state="idle" />
              </div>
              <h1 className="text-2xl font-bold mb-3">
                AI-ассистент для вашего бизнеса
              </h1>
              <p className="text-zinc-400 text-sm">
                Отвечает клиентам 24/7. Настройка за 2 минуты.
              </p>
              
              {/* Features */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ответ за секунды</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Работает 24/7</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Безопасно</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Chat container */}
          <div 
            className="rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            {/* Messages */}
            <div className="min-h-[300px] max-h-[400px] overflow-y-auto p-4 space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className="max-w-[85%]">
                      <div
                        className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                          msg.role === "user"
                            ? "bg-cyan-500 text-black rounded-2xl rounded-br-sm"
                            : "bg-white/5 text-white/90 rounded-2xl rounded-bl-sm border border-white/5"
                        }`}
                      >
                        {msg.content}
                      </div>
                      
                      {/* Platform selection */}
                      {msg.showPlatforms && !selectedPlatform && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="mt-3 grid grid-cols-2 gap-2"
                        >
                          {PLATFORMS.map((platform) => (
                            <button
                              key={platform.id}
                              onClick={() => handlePlatformSelect(platform.id)}
                              className="flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-xl text-sm transition-all"
                            >
                              {platform.icon ? (
                                <img src={platform.icon} alt="" className="w-5 h-5" />
                              ) : (
                                <Globe className="w-5 h-5 text-cyan-400" />
                              )}
                              <span>{platform.name}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-cyan-400"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick actions - only show on first message */}
              {messages.length === 1 && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => {
                        setInput(`У меня ${action.toLowerCase()}`)
                        setTimeout(() => inputRef.current?.focus(), 100)
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <button
                  onClick={toggleVoice}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? "bg-red-500/20 border border-red-500/50 text-red-400" 
                      : "bg-white/5 border border-white/10 text-zinc-500 hover:text-cyan-400"
                  }`}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Расскажите о вашем бизнесе..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />

                <button
                  onClick={send}
                  disabled={!input.trim() || isTyping}
                  className="w-11 h-11 rounded-xl bg-cyan-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
                >
                  <ArrowRight className="w-5 h-5 text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-zinc-600">
              Бесплатно. Без карты. 2 минуты на настройку.
            </p>
            <p className="mt-2 text-xs text-zinc-700">
              powered by <Link href="/" className="text-cyan-600 hover:text-cyan-500">NetNext</Link>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  )
}

// Main page with Suspense
export default function NexikPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NexikContent />
    </Suspense>
  )
}
