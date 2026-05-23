"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ArrowRight, Check, Loader2, Globe, Copy, X, Sparkles, MessageCircle, ExternalLink, Lock, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { SiriOrb } from "@/components/nexik/siri-orb"
import { SiriOrb as NetNextSiriOrb } from "@/components/ai-orb"
import {
  getOrCreateVisitor,
  getCurrentConversation,
  addMessage as addMemoryMessage,
  getConversationHistory,
  updateBusinessContext,
  updateStage,
  getBusinessContext,
  updateVisitor,
  NexikMessage,
} from "@/lib/nexik/services/unified-memory"

type Step = "chat" | "platforms" | "offer" | "netnext-chat" | "register" | "done"

// Платформы для интеграции
const PLATFORMS = [
  { id: "telegram", name: "Telegram", icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" },
  { id: "whatsapp", name: "WhatsApp", icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" },
  { id: "viber", name: "Viber", icon: "https://upload.wikimedia.org/wikipedia/commons/d/df/Viber_logo.svg" },
  { id: "vk", name: "ВКонтакте", icon: "https://upload.wikimedia.org/wikipedia/commons/2/21/VK.com-logo.svg" },
  { id: "wechat", name: "WeChat", icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/WeChat_logo.svg" },
  { id: "instagram", name: "Instagram", icon: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" },
  { id: "facebook", name: "Facebook", icon: "https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png" },
  { id: "website", name: "Собственный сайт", icon: null },
]

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  buttons?: { label: string; action: string }[]
}

const businessResponses: Record<string, string> = {
  автосервис: "Автосервис - отлично! Я буду отвечать на вопросы о ценах на ТО, записывать на диагностику, сообщать статус ремонта.",
  салон: "Салон красоты - моя тема! Запись к мастерам, цены на услуги, свободные окна - всё за секунды.",
  ресторан: "Ресторан - понял! Бронирование столов, меню, время работы, доставка - отвечу мгновенно.",
  клиника: "Медицинская клиника - серьезная тема! Запись к врачам, расписание, подготовка к анализам.",
  магазин: "Интернет-магазин - супер! Наличие товаров, статус заказа, доставка, возвраты.",
  фитнес: "Фитнес-клуб - знаю! Расписание тренировок, цены, свободные слоты у тренеров.",
  default: "Интересная ниша! Я быстро изучу специфику и буду отвечать клиентам профессионально."
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  for (const [key, response] of Object.entries(businessResponses)) {
    if (key !== "default" && lower.includes(key)) {
      return response
    }
  }
  return businessResponses.default
}

// Анализ ввода через AI
async function analyzeInputWithAI(input: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<{
  isValidBusiness: boolean
  businessType: string | null
  response: string
}> {
  try {
    const res = await fetch('/api/nexik/analyze-input', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, conversationHistory })
    })
    
    if (!res.ok) throw new Error('API error')
    return await res.json()
  } catch {
    // Fallback
    return {
      isValidBusiness: false,
      businessType: null,
      response: 'Расскажи подробнее - какой у тебя бизнес?'
    }
  }
}

export default function NexikStartPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("chat")
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [widgetId, setWidgetId] = useState("")
  const [copied, setCopied] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [businessDesc, setBusinessDesc] = useState("")
  const [userName, setUserName] = useState("")
  const [userPhone, setUserPhone] = useState("")
  
  // Load conversation from unified memory on mount
  useEffect(() => {
    const conv = getCurrentConversation('start')
    const visitor = getOrCreateVisitor()
    
    // Pre-fill name if we have it
    if (visitor.name) {
      setUserName(visitor.name)
    }
    if (visitor.email) {
      setEmail(visitor.email)
    }
    if (visitor.businessDescription) {
      setBusinessDesc(visitor.businessDescription)
    }
    
    // If we have conversation history from homepage, continue it
    if (conv.messages.length > 0) {
      // Convert NexikMessages to local Message format
      const localMessages: Message[] = conv.messages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      setMessages(localMessages)
      
      // If business was already described, skip to next step or show welcome back
      if (visitor.businessType && conv.stage !== 'greeting') {
        // Add welcome back message
        const welcomeBack: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Рад видеть тебя снова! Мы уже обсуждали твой бизнес (${visitor.businessType}). Продолжим настройку?`,
          buttons: [
            { label: 'Да, продолжим', action: 'continue' },
            { label: 'Начать заново', action: 'restart' },
          ]
        }
        setMessages(prev => [...prev, welcomeBack])
      }
    } else {
      // No history - show personalized welcome
      const welcomeContent = visitor.name 
        ? `С возвращением, ${visitor.name}! Я Nexik - AI-помощник для бизнеса. Расскажи, чем занимаешься?`
        : `Привет! Я Nexik - AI-помощник для бизнеса. Расскажи, чем занимаешься? Или спроси что-нибудь обо мне.`
      
      setMessages([{ id: "1", role: "assistant", content: welcomeContent }])
      addMemoryMessage('assistant', welcomeContent)
    }
  }, [])
  
  // Platforms selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  
  // Voice input state
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  
  // NetNext chat state
  const [netnextMessages, setNetnextMessages] = useState<Message[]>([])
  const [netnextInput, setNetnextInput] = useState("")
  const [netnextTyping, setNetnextTyping] = useState(false)
  const [leadSubmitted, setLeadSubmitted] = useState(false)
  
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const netnextChatRef = useRef<HTMLDivElement>(null)

  const handleOrbClick = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (netnextChatRef.current) {
      netnextChatRef.current.scrollTop = netnextChatRef.current.scrollHeight
    }
  }, [netnextMessages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [step])

  // Check voice support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setVoiceSupported(!!SpeechRecognition)
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ru-RU'
      recognition.continuous = false
      recognition.interimResults = false
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        setIsListening(false)
      }
      
      recognition.onerror = () => {
        setIsListening(false)
      }
      
      recognition.onend = () => {
        setIsListening(false)
      }
      
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }, [isListening])

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isTyping || isThinking) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    
    // Save to unified memory
    addMemoryMessage('user', input)
    
    // Show "thinking"
    setIsThinking(true)
    
    try {
      // Get history from unified memory for context
      const history = getConversationHistory(10)
      const businessCtx = getBusinessContext()
      
      // Analyze input through AI with history and context
      const analysis = await analyzeInputWithAI(userMsg.content, history)
      
      setIsThinking(false)
      setIsTyping(true)
      
      // Small delay for typing effect
      await new Promise(r => setTimeout(r, 800))
      
      if (analysis.isValidBusiness) {
        // Valid business - save to memory and continue
        setBusinessDesc(analysis.businessType || userMsg.content)
        
        // Update unified memory with business context
        updateBusinessContext({
          type: analysis.businessType || 'other',
          description: userMsg.content,
        })
        updateStage('discovery')
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: analysis.response
        }
        setMessages(prev => [...prev, assistantMsg])
        addMemoryMessage('assistant', analysis.response)
        setIsTyping(false)
        
        // Move to platforms step
        setTimeout(() => {
          setStep("platforms")
        }, 1500)
      } else {
        // Invalid input - ask for clarification
        let response = analysis.response
        
        // Suggest microphone if supported
        if (voiceSupported) {
          response += "\n\nИли нажми на микрофон и просто расскажи голосом!"
        }
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response
        }
        setMessages(prev => [...prev, assistantMsg])
        addMemoryMessage('assistant', response)
        setIsTyping(false)
      }
    } catch {
      setIsThinking(false)
      setIsTyping(false)
      
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Произошла ошибка. Попробуй ещё раз - расскажи о своём бизнесе."
      }
      setMessages(prev => [...prev, errorMsg])
      addMemoryMessage('assistant', errorMsg.content)
    }
  }, [input, isTyping, isThinking, voiceSupported, messages])

  // Выбор платформы
  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }, [])

  const handlePlatformsSubmit = useCallback(() => {
    // Save platforms to unified memory
    if (selectedPlatforms.length > 0) {
      updateBusinessContext({
        platforms: selectedPlatforms,
      })
    }
    
    // Check if user selected "website" - only then show offer
    if (selectedPlatforms.includes("website")) {
      setStep("offer")
    } else {
      // For messenger platforms (Instagram, Telegram, etc) - go to register
      setStep("register")
    }
  }, [selectedPlatforms])

  // Открыть чат с NetNext AI
  const openNetnextChat = useCallback(() => {
    setNetnextMessages([{
      id: "1",
      role: "assistant",
      content: `Привет! Я Siri - AI-ассистент NetNext Studio.

Рад, что ты заинтересовался! Расскажу немного о нас:

**NetNext** - это молодая, но амбициозная веб-студия. Мы делаем современные сайты быстро и качественно.

**Специальное предложение для тебя:**
Сайт с полной интеграцией Nexik AI всего за **3 BYN** и **24 часа работы**!

В эту цену входит:
- Современный адаптивный дизайн
- Установленный AI-ассистент Nexik
- Базовая SEO-оптимизация
- 30 дней поддержки

Хочешь узнать подробнее или готов оставить заявку?`,
      buttons: [
        { label: "Расскажи подробнее", action: "details" },
        { label: "Хочу заказать!", action: "order" },
        { label: "Какие есть примеры?", action: "examples" }
      ]
    }])
    setStep("netnext-chat")
  }, [])

  // Отправка сообщения в чат NetNext - РЕАЛЬНЫЙ AI
  const sendNetnextMessage = useCallback(async (content?: string) => {
    const messageText = content || netnextInput.trim()
    if (!messageText || netnextTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: messageText }
    setNetnextMessages(prev => [...prev, userMsg])
    if (!content) setNetnextInput("")
    setNetnextTyping(true)

    // Проверяем на контактные данные
    const lower = messageText.toLowerCase()
    const hasPhone = lower.match(/(\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/) || lower.match(/\d{10,}/)
    const hasEmail = lower.includes("@")
    
    if (hasPhone || hasEmail) {
      // Сохраняем лид и отправляем в Telegram
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: businessDesc || "Nexik Start - заявка на сайт",
            phone: messageText.match(/[\d\+\-\(\)\s]+/)?.[0] || "",
            email: messageText.match(/[\w\.-]+@[\w\.-]+/)?.[0] || "",
            description: `Заявка из Nexik Start на создание сайта.\nБизнес: ${businessDesc}\nКонтакт: ${messageText}`,
            niche: businessDesc,
            source: "nexik_start_netnext",
            consentGiven: true
          })
        })
        setLeadSubmitted(true)
        
        // Ответ на успешную заявку
        const response: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Отлично! Записал твои контакты.

Заявка принята! Наш менеджер свяжется с тобой в ближайшее время (обычно в течение часа в рабочее время).

А пока ты можешь создать аккаунт в Nexik и попробовать AI-ассистента прямо сейчас - это бесплатно!`,
          buttons: [
            { label: "Создать аккаунт Nexik", action: "register" },
            { label: "Открыть netnext.site", action: "netnext" }
          ]
        }
        setNetnextMessages(prev => [...prev, response])
        setNetnextTyping(false)
        return
      } catch {
        // Silent fail for lead submit
      }
    }

    // Вызываем реальный AI API
    try {
      const res = await fetch("/api/chat/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: `nexik_start_${Date.now()}`,
          message: messageText,
          context: {
            companyName: "NetNext Studio",
            companyDescription: `Веб-студия NetNext. Клиент интересуется созданием сайта. Его бизнес: ${businessDesc || "не указано"}. Предлагай сайт от 3 BYN (белору��ских рублей) и 24 часа работы с интеграцией Nexik AI.`
          }
        })
      })

      const data = await res.json()
      
      // Определяем кнопки на основе контекста
      let buttons: { label: string; action: string }[] = []
      const responseText = data.text || data.error || "Произошла ошибка, попробуй еще раз"
      
      if (responseText.toLowerCase().includes("цен") || responseText.toLowerCase().includes("стоим")) {
        buttons = [
          { label: "Хочу заказать!", action: "order" },
          { label: "Расскажи подробнее", action: "details" }
        ]
      } else if (responseText.toLowerCase().includes("контакт") || responseText.toLowerCase().includes("запис")) {
        buttons = []
      } else {
        buttons = [
          { label: "Расскажи о ценах", action: "prices" },
          { label: "Хочу заказать", action: "order" }
        ]
      }

      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        buttons
      }

      setNetnextMessages(prev => [...prev, response])
    } catch {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Извини, произошла ошибка. Попробуй еще раз или напиши свои контакты - мы свяжемся!",
        buttons: [{ label: "Хочу заказать", action: "order" }]
      }
      setNetnextMessages(prev => [...prev, response])
    } finally {
      setNetnextTyping(false)
    }
  }, [netnextInput, netnextTyping, businessDesc])

  // Обработка кнопок в чате NetNext
  const handleNetnextButton = useCallback((action: string) => {
    if (action === "register") {
      setStep("register")
    } else if (action === "netnext") {
      window.open("https://netnext.site", "_blank")
    } else {
      // Отправляем как сообщение
      const buttonLabels: Record<string, string> = {
        details: "Расскажи подробнее",
        order: "Хочу заказать!",
        examples: "Какие есть примеры?",
        prices: "Расскажи про цены",
        discuss: "Давай обсудим"
      }
      sendNetnextMessage(buttonLabels[action] || action)
    }
  }, [sendNetnextMessage])

  const goToContactForm = useCallback(() => {
    window.open("https://netnext.site/#contact", "_blank")
  }, [])

  const createWidget = useCallback(async () => {
    if (!email) {
      alert("Введите email")
      return
    }

    setIsCreating(true)

    try {
      const res = await fetch("/api/nexik/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_widget",
          data: {
            businessDescription: businessDesc,
            businessName: businessDesc.slice(0, 50),
            email: email,
            password: password || undefined,
            websiteUrl: websiteUrl || null
          }
        })
      })

      const data = await res.json()

      if (data.success) {
        setWidgetId(data.widget.id)
        setStep("done")
      } else {
        alert(data.error || "Ошибка создания виджета")
      }
    } catch (error) {
      alert("Ошибка подключения к серверу")
    } finally {
      setIsCreating(false)
    }
  }, [email, password, businessDesc, websiteUrl])

  const copyCode = useCallback(() => {
    const code = `<script src="https://nexik.org/nexik/widget.js" data-id="${widgetId}"></script>`
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [widgetId])

  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/nexik" className="flex items-center gap-3">
            <SiriOrb size={32} color="#00ffff" state="idle" />
            <span className="font-semibold">Nexik</span>
          </Link>
          <Link href="/nexik/login" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Войти
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {step === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div ref={chatRef} className="flex-1 space-y-4 mb-6 overflow-y-auto">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mr-3 flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-black" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line",
                      msg.role === "user"
                        ? "bg-cyan-500 text-black rounded-br-sm"
                        : "bg-white/5 border border-white/10 rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
                {(isTyping || isThinking) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-black" />
                    </div>
                    <div className="flex gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm">
                      {isThinking ? (
                        <span className="text-sm text-zinc-400">думает...</span>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Например: у меня автосервис..."
                  disabled={isTyping || isThinking || isListening}
                  className={cn(
                    "w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-28 bg-white/5 border rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none transition-colors disabled:opacity-50",
                    isListening ? "border-cyan-500 bg-cyan-500/5" : "border-white/10 focus:border-cyan-500/50"
                  )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {voiceSupported && (
                    <button
                      onClick={toggleVoice}
                      disabled={isTyping || isThinking}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isListening 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-white/10 text-zinc-400 hover:bg-white/20 hover:text-white"
                      )}
                      title={isListening ? "Остановить запись" : "Голосовой ввод"}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                  )}
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isTyping || isThinking}
                    className="w-10 h-10 rounded-xl bg-cyan-500 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {isListening && (
                <motion.p 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-sm text-cyan-400 mt-3"
                >
                  Слушаю... Расскажи о своём бизнесе
                </motion.p>
              )}
            </motion.div>
          )}

          {step === "platforms" && (
            <motion.div
              key="platforms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 via-teal-500 to-cyan-600 flex items-center justify-center mb-8 shadow-lg shadow-cyan-500/30"
              >
                <Sparkles className="w-10 h-10 text-black" />
              </motion.div>
              
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                Где будете использовать Nexik?
              </h2>
              <p className="text-zinc-400 mb-8 max-w-md text-sm sm:text-base">
                Выберите платформы, где хотите подключить AI-ассистента. Можно выбрать несколько
              </p>
              
              <div className="w-full max-w-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {PLATFORMS.map((platform) => (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => togglePlatform(platform.id)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                        selectedPlatforms.includes(platform.id)
                          ? "bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      )}
                    >
                      {selectedPlatforms.includes(platform.id) && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                      {platform.icon ? (
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden">
                          <img 
                            src={platform.icon} 
                            alt={platform.name}
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.parentElement!.innerHTML = '<span class="text-lg">' + platform.name[0] + '</span>'
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-cyan-400" />
                        </div>
                      )}
                      <span className="text-xs sm:text-sm font-medium text-zinc-300">{platform.name}</span>
                    </motion.button>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handlePlatformsSubmit}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-black font-semibold rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    {selectedPlatforms.length > 0 
                      ? `Продолжить (${selectedPlatforms.length} ${selectedPlatforms.length === 1 ? 'платформа' : selectedPlatforms.length < 5 ? 'платформы' : 'платформ'})`
                      : 'Продолжить'
                    }
                  </button>
                  
                  {selectedPlatforms.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center">
                      Можно пропустить, если пока не определились
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === "offer" && (
            <motion.div
              key="offer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4"
            >
              {/* NetNext AI Orb с многослойным свечением */}
              <div className="relative mb-10">
                <div className="absolute inset-[-30px] rounded-full bg-gradient-to-r from-teal-500/20 via-cyan-400/15 to-teal-500/20 blur-3xl animate-pulse" />
                <div className="absolute inset-[-15px] rounded-full bg-teal-400/10 blur-xl" />
                <motion.div
                  animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <NetNextSiriOrb size={90} isHovered={true} />
                </motion.div>
              </div>
              
              {/* Заголовок с анимацией */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-bold mb-4"
              >
                <span className="bg-gradient-to-r from-white via-teal-200 to-white bg-clip-text text-transparent">
                  Нет сайта?
                </span>
                <br />
                <span className="text-teal-400">Это даже лучше!</span>
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-zinc-400 mb-8 max-w-sm text-sm sm:text-base leading-relaxed"
              >
                Создадим тебе современный сайт с у��е встроенным{" "}
                <span className="text-cyan-400 font-medium">Nexik AI</span>
                {" "}—{" "}
                <span className="text-white">твой бизнес будет на связи 24/7</span>
              </motion.p>

              {/* Карточки преимуществ */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-3 gap-3 mb-8 w-full max-w-sm"
              >
                <div className="flex flex-col items-center p-3 bg-gradient-to-b from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl">
                  <span className="text-xl sm:text-2xl font-bold text-teal-300">3</span>
                  <span className="text-[10px] sm:text-xs text-zinc-500 mt-1">BYN</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gradient-to-b from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl">
                  <span className="text-xl sm:text-2xl font-bold text-cyan-300">24</span>
                  <span className="text-[10px] sm:text-xs text-zinc-500 mt-1">часа</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gradient-to-b from-teal-500/10 to-transparent border border-teal-500/20 rounded-2xl">
                  <span className="text-xl sm:text-2xl font-bold text-teal-300">AI</span>
                  <span className="text-[10px] sm:text-xs text-zinc-500 mt-1">встроен</span>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="w-full max-w-sm space-y-3"
              >
                {/* Главная кнопка - чат с NetNext AI */}
                <button
                  onClick={openNetnextChat}
                  className="group w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-semibold rounded-2xl hover:from-teal-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-3 shadow-lg shadow-teal-500/25 hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Поговорить с NetNext AI
                </button>

                {/* Кнопка заказа напрямую */}
                <button
                  onClick={goToContactForm}
                  className="w-full py-3.5 bg-white/5 text-zinc-300 font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-sm"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                  <span>Оставить заявку на netnext.site</span>
                </button>

                {/* Разделитель */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[10px] text-zinc-600 uppercase tracking-widest">или</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {/* Кнопка "другая сфера" - неактивная */}
                <div className="relative group">
                  <button
                    disabled
                    className="w-full py-3 bg-transparent text-zinc-600 text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2 border border-dashed border-white/10"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Использовать в другой сфере
                  </button>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-zinc-900/90 backdrop-blur border border-white/10 text-[10px] text-zinc-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Скоро
                  </div>
                </div>

                {/* Кнопка продолжить без сайта */}
                <button 
                  onClick={() => setStep("register")} 
                  className="w-full py-2 text-zinc-600 hover:text-zinc-400 transition-colors text-xs"
                >
                  У меня есть сайт, пропустить
                </button>
              </motion.div>
            </motion.div>
          )}

          {step === "netnext-chat" && (
            <motion.div
              key="netnext-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col min-h-0 max-h-full"
            >
              {/* Header чата */}
              <div className="flex-shrink-0 flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
                <div className="relative">
                  <div className="absolute inset-[-4px] rounded-full bg-teal-500/20 blur-md" />
                  <NetNextSiriOrb size={44} isHovered={netnextTyping} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">NetNext AI</div>
                  <div className="text-xs text-teal-400">Онлайн</div>
                </div>
                <button 
                  onClick={() => setStep("offer")} 
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Сообщения - фиксированная высота с внутренним скроллом */}
              <div 
                ref={netnextChatRef} 
                className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
              >
                {netnextMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start", "max-w-[85%]")}>
                      <div className="flex items-end gap-2">
                        {msg.role === "assistant" && (
                          <div className="flex-shrink-0 mb-1">
                            <NetNextSiriOrb size={28} />
                          </div>
                        )}
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-black font-medium rounded-br-md"
                            : "bg-zinc-800/80 border border-zinc-700/50 text-zinc-100 rounded-bl-md"
                        )}>
                          <span className="whitespace-pre-line">{msg.content}</span>
                        </div>
                      </div>
                      {/* Кнопки */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className={cn("flex flex-wrap gap-2 mt-2", msg.role === "assistant" && "ml-9")}>
                          {msg.buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleNetnextButton(btn.action)}
                              className="px-3 py-1.5 text-xs font-medium bg-teal-500/10 text-teal-300 rounded-lg hover:bg-teal-500/20 transition-colors border border-teal-500/20"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {netnextTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-2">
                    <div className="flex-shrink-0 mb-1">
                      <NetNextSiriOrb size={28} isHovered={true} />
                    </div>
                    <div className="flex gap-1.5 px-4 py-3 bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-bl-md">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Поле ввода */}
              <div className="flex-shrink-0 pt-4 mt-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={netnextInput}
                    onChange={(e) => setNetnextInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendNetnextMessage()}
                    placeholder="Напиши сообщение..."
                    className="w-full px-4 py-3.5 pr-14 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-teal-500/50 focus:bg-zinc-800/80 transition-all"
                  />
                  <button
                    onClick={() => sendNetnextMessage()}
                    disabled={!netnextInput.trim() || netnextTyping}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:from-teal-400 hover:to-cyan-400 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Создайте аккаунт</h2>
              <p className="text-zinc-400 mb-8 max-w-sm">Мы сохраним настройки и вы сможете управлять чатом из дашборда</p>
              <div className="w-full max-w-md space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль (оставьте пустым для автоматической генерации)"
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  onClick={createWidget}
                  disabled={isCreating || !email}
                  className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <><Loader2 className="w-5 h-5 animate-spin" /> Создаём...</> : <>Создать виджет <ArrowRight className="w-5 h-5" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-black" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Готово!</h2>
              <p className="text-zinc-400 mb-8">Вставь этот код на сайт перед {"</body>"}</p>
              <div className="w-full max-w-md">
                <div className="relative bg-[#0a0a0f] border border-white/10 rounded-2xl p-4 mb-4">
                  <code className="text-sm text-cyan-400 break-all">{`<script src="https://nexik.org/nexik/widget.js" data-id="${widgetId}"></script>`}</code>
                  <button onClick={copyCode} className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>
                <button onClick={() => router.push("/nexik/dashboard")} className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
                  Открыть Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <SiriOrb size={48} color="#00ffff" state={isTyping || isAnalyzing || isCreating || isThinking || netnextTyping ? "thinking" : "idle"} onClick={handleOrbClick} />
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-20 right-4 sm:bottom-24 sm:right-6 z-50 max-w-xs sm:max-w-sm"
          >
            <div className="relative p-4 rounded-2xl border border-cyan-500/20 shadow-2xl" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.95) 50%, rgba(6,182,212,0.1) 100%)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(6,182,212,0.15), 0 20px 40px -10px rgba(0,0,0,0.5)" }}>
              <button onClick={() => setShowToast(false)} className="absolute top-3 right-3 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-4 h-4" />
              </button>
              <div className="flex gap-3 pr-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.1) 100%)", boxShadow: "0 0 20px rgba(6,182,212,0.2)" }}>
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">Де��о виджета Nexik</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">Так будет выглядеть AI-чат на вашем сайте. Клиенты смогут общаться с ботом 24/7.</p>
                </div>
              </div>
              <div className="absolute -inset-px rounded-2xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, transparent 30%, transparent 70%, rgba(6,182,212,0.2) 100%)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", padding: "1px" }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
