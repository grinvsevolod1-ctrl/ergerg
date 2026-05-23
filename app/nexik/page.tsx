"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, X, Sparkles, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiriOrb } from "@/components/nexik/siri-orb"

// Приветственное сообщение
const WELCOME_MESSAGE = `Привет! Я Nexik — AI-ассистент для бизнеса.

Я могу работать на вашем сайте 24/7: отвечать клиентам за секунды, записывать на услуги, собирать заявки и не терять ни одного обращения.

Расскажите, какой у вас бизнес?`

// Развернутые ответы для разных ниш
const AI_RESPONSES: Record<string, string> = {
  "автосервис": `Отлично, для автосервиса я могу:

• Записывать на ТО и ремонт в свободные слоты
• Отвечать о ценах, сроках и наличии запчастей
• Сообщать клиенту статус ремонта
• Вызывать эвакуатор и оформлять заявки
• Напоминать о плановом ТО

Работаю 24/7, даже когда ваши менеджеры спят.`,

  "салон": `Идеально, для салона красоты я умею:

• Записывать к мастерам в реальном времени
• Показывать свободные окна и цены
• Напоминать о визите за день
• Отвечать о процедурах и акциях
• Собирать отзывы после визита

Ни один клиент не уйдёт без записи.`,

  "ресторан": `Супер, для ресторана я могу:

• Принимать заказы на доставку и самовывоз
• Бронировать столики на нужное время
• Показывать меню с ценами и составом
• Отвечать об аллергенах и калориях
• Собирать отзывы и пожелания

Каждый заказ будет обработан мгновенно.`,

  "клиника": `Отлично, для клиники я умею:

• Записывать на приём к нужному врачу
• Отвечать о специалистах и услугах
• Напоминать о визите и подготовке
• Собирать первичную информацию о симптомах
• Отправлять результаты анализов

HIPAA-совместимый, данные в безопасности.`,

  "магазин": `Прекрасно, для магазина я могу:

• Помогать выбрать нужный товар
• Отвечать о наличии, размерах, цветах
• Оформлять заказы и отслеживать доставку
• Обрабатывать возвраты и обмены
• Рекомендовать похожие товары

Конверсия вырастает в среднем на 35%.`,

  "фитнес": `Круто, для фитнес-клуба я умею:

• Записывать на групповые занятия
• Отвечать о расписании и тренерах
• Продавать абонементы и доп. услуги
• Напоминать о тренировках
• Собирать обратную связь

Ваш виртуальный администратор 24/7.`,

  "недвижимость": `Для агентства недвижимости я могу:

• Подбирать объекты под запрос клиента
• Записывать на просмотры
• Отвечать о ценах, метраже, районах
• Квалифицировать лиды перед звонком
• Собирать контакты потенциальных клиентов

Горячие лиды не будут ждать.`,

  "default": `Понял! Для вашего бизнеса я могу:

• Отвечать клиентам мгновенно, 24/7
• Записывать на услуги и консультации
• Собирать заявки и контакты
• Отвечать на частые вопросы
• Интегрироваться с вашей CRM

Хотите увидеть как это будет работать?`
}

function getResponse(input: string): string {
  const lower = input.toLowerCase()
  
  // Автосервис
  if (lower.includes("авто") || lower.includes("сто") || lower.includes("ремонт") || lower.includes("машин")) {
    return AI_RESPONSES["автосервис"]
  }
  // Салон красоты
  if (lower.includes("салон") || lower.includes("красот") || lower.includes("маникюр") || lower.includes("парик") || lower.includes("стриж")) {
    return AI_RESPONSES["салон"]
  }
  // Ресторан/кафе
  if (lower.includes("ресторан") || lower.includes("кафе") || lower.includes("еда") || lower.includes("доставк") || lower.includes("пицц")) {
    return AI_RESPONSES["ресторан"]
  }
  // Клиника
  if (lower.includes("клиник") || lower.includes("врач") || lower.includes("медиц") || lower.includes("стоматол") || lower.includes("здоров")) {
    return AI_RESPONSES["клиника"]
  }
  // Магазин
  if (lower.includes("магазин") || lower.includes("товар") || lower.includes("продаж") || lower.includes("интернет-магазин") || lower.includes("ecommerce")) {
    return AI_RESPONSES["магазин"]
  }
  // Фитнес
  if (lower.includes("фитнес") || lower.includes("спорт") || lower.includes("трениро") || lower.includes("зал") || lower.includes("йог")) {
    return AI_RESPONSES["фитнес"]
  }
  // Недвижимость
  if (lower.includes("недвижим") || lower.includes("квартир") || lower.includes("дом") || lower.includes("аренд") || lower.includes("риелтор")) {
    return AI_RESPONSES["недвижимость"]
  }
  
  return AI_RESPONSES["default"]
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

function DotGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.08)" />
          </pattern>
          <radialGradient id="gridFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="gridMask">
            <rect width="100%" height="100%" fill="url(#gridFade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" mask="url(#gridMask)" />
      </svg>
    </div>
  )
}

function ChatDemo({ visible }: { visible: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: WELCOME_MESSAGE }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [visitorId] = useState(() => {
    // Generate or get visitor ID from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('nexik_visitor_id')
      if (stored) return stored
      const newId = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      localStorage.setItem('nexik_visitor_id', newId)
      return newId
    }
    return `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isFirstRender = useRef(true)

  // Speech recognition
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой ввод не поддерживается в вашем браузере')
      return
    }
    
    if (isListening) {
      setIsListening(false)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognitionAPI) return
    
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.start()
  }, [isListening])

  useEffect(() => {
    // Don't auto-scroll on first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = useCallback(async () => {
    if (!input.trim() || isTyping) return
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      // Call AI API with visitorId for memory
      const response = await fetch('/api/nexik/analyze-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: userMsg.content,
          visitorId,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }])
    } catch {
      // Fallback to template
      const response = getResponse(userMsg.content)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response }])
    }
    
    setIsTyping(false)
  }, [input, isTyping, messages])

  const quickActions = ["Автосервис", "Салон красоты", "Ресторан", "Клиника", "Магазин", "Фитнес"]

  const sendQuickAction = useCallback(async (action: string) => {
    if (isTyping) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: `У меня ${action.toLowerCase()}` }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)

    try {
      const response = await fetch('/api/nexik/analyze-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: userMsg.content,
          visitorId,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
        })
      })
      
      const data = await response.json()
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: data.response }])
    } catch {
      const response = getResponse(userMsg.content)
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: response }])
    }
    
    setIsTyping(false)
  }, [isTyping, messages])

  if (!visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg mx-auto"
    >
      <div 
        className="relative rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,255,255,0.03) 100%)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 0 60px -10px rgba(0,255,255,0.15), 0 40px 80px -20px rgba(0,0,0,0.6)",
        }}
      >
        {/* Subtle glow border effect */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(0,255,255,0.1) 0%, transparent 50%, rgba(0,255,255,0.05) 100%)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: "1px",
          }}
        />
        {/* Header */}
        <div 
          className="flex items-center gap-4 p-5 border-b border-white/5"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
          }}
        >
          <div className="relative">
            <SiriOrb size={48} state={isTyping ? "thinking" : "idle"} />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Nexik</h3>
            <p className="text-sm text-cyan-400/80">{isTyping ? "печатает..." : "AI-ассистент"}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-[180px] max-h-72 overflow-y-auto p-5 space-y-4 flex flex-col justify-start">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-[15px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-cyan-400 to-cyan-500 text-black font-medium rounded-2xl rounded-br-sm"
                      : "bg-white/[0.08] text-white/90 rounded-2xl rounded-bl-sm border border-white/10"
                  }`}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i} className={line.startsWith('•') ? 'block ml-1' : 'block'}>
                      {line || <br />}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/[0.08] border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {messages.length === 1 && !isTyping && (
            <div className="flex flex-wrap gap-2 pt-2">
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendQuickAction(action)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-zinc-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors"
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
            {/* Voice button */}
            <button
              onClick={toggleVoice}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isListening 
                  ? "bg-red-500/20 border border-red-500/50 text-red-400" 
                  : "bg-white/5 border border-white/10 text-zinc-500 hover:text-cyan-400 hover:border-cyan-500/30"
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 animate-pulse" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {/* Input field */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Расскажите о вашем бизнесе..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-[15px] placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />

            {/* Custom send button */}
            <button
              onClick={send}
              disabled={!input.trim() || isTyping}
              className="group relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden transition-all hover:shadow-lg hover:shadow-cyan-500/30"
            >
              {/* Animated background */}
              <span className="absolute inset-0 bg-gradient-to-br from-cyan-300 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Custom send icon - arrow burst */}
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                className="relative w-5 h-5 text-black group-hover:scale-110 transition-transform"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="group-hover:translate-x-0.5 transition-transform"
                />
                {/* Burst effect lines */}
                <path
                  d="M4 8L2 6M4 16L2 18M3 12H1"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="opacity-0 group-hover:opacity-60 transition-opacity"
                />
              </svg>
            </button>
          </div>

          {/* Voice indicator */}
          {isListening && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-400 mt-2 flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Слушаю... Говорите
            </motion.p>
          )}
        </div>
      </div>

      {/* CTA below chat */}
      <div className="mt-10 text-center">
        <Link 
          href="/nexik/start"
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
            boxShadow: "0 0 0 1px rgba(34,211,238,0.3), 0 10px 40px -10px rgba(34,211,238,0.5), 0 0 80px -20px rgba(34,211,238,0.4)",
          }}
        >
          {/* Shine effect */}
          <span 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)",
            }}
          />
          {/* Glow pulse on hover */}
          <span 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: "0 0 60px 10px rgba(34,211,238,0.3)",
            }}
          />
          <span className="relative text-black">Запустить Nexik</span>
          <ArrowRight className="relative w-5 h-5 text-black/80 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>
        <p className="mt-8 text-sm text-zinc-500">Бесплатно. Без карты. 2 минуты на настройку.</p>
        <p className="mt-2 text-xs text-zinc-600">
          powered by <Link href="/" className="text-cyan-500/70 hover:text-cyan-400 transition-colors">NetNext</Link>
        </p>
      </div>
    </motion.div>
  )
}

export default function NexikPage() {
  const [phase, setPhase] = useState<"title" | "chat">("title")
  const [headerTitle, setHeaderTitle] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const handleOrbClick = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 4000)
  }

  useEffect(() => {
    // Scroll to top on mount
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    const timer = setTimeout(() => {
      setPhase("chat")
      setHeaderTitle(true)
      // Scroll to top after chat animation completes
      setTimeout(() => {
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        window.scrollTo(0, 0)
      }, 700)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f14] text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        {/* Base gradient - much brighter */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(0,180,180,0.25) 0%, rgba(0,80,100,0.1) 40%, transparent 70%)",
          }}
        />
        
        {/* Secondary upper glow */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 50% 10%, rgba(34,211,238,0.15) 0%, transparent 50%)",
          }}
        />
        
        {/* Dot grid pattern */}
        <DotGrid />
        
        {/* Center glow - more visible */}
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,255,255,0.12) 0%, rgba(0,200,200,0.05) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        
        {/* Side accents - brighter */}
        <div 
          className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,200,150,0.1) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div 
          className="absolute top-1/3 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,255,255,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        
        {/* Bottom glow for depth */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(0,100,120,0.1) 0%, transparent 60%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="mx-4 sm:mx-6 mt-4 flex items-center justify-between gap-4">
          {/* Left pill - Logo & Title */}
          <div 
            className="rounded-full px-3 py-2 flex items-center gap-3"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Link href="/nexik" className="flex items-center gap-3">
              <SiriOrb size={28} state="idle" />
              <span className="font-semibold text-lg">Nexik</span>
            </Link>
            <AnimatePresence>
              {headerTitle && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  transition={{ duration: 0.4 }}
                  className="hidden sm:flex flex-col leading-tight border-l border-white/10 pl-3 ml-1"
                >
                  <span className="text-xs text-zinc-400">Общение</span>
                  <span className="text-xs text-zinc-500">без ожидания</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Right pill - Actions */}
          <div 
            className="rounded-full px-2 py-2 flex items-center gap-1"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Link 
              href="/nexik/login" 
              className="px-4 py-1.5 text-sm text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              Войти
            </Link>
            <Button 
              className="bg-white text-black hover:bg-zinc-200 h-8 px-4 text-sm font-medium rounded-full" 
              asChild
            >
              <Link href="/nexik/start">
                Начать
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative min-h-screen flex flex-col items-center px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-12 sm:pb-16">
        {/* Animated title -> chat transition */}
        <AnimatePresence mode="wait">
          {phase === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
              className="text-center flex-1 flex items-center justify-center"
            >
              <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-[1.1]">
                <span className="block bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                  Общение
                </span>
                <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-cyan-300 to-cyan-500 bg-clip-text text-transparent">
                  без ожидания
                </span>
              </h1>
            </motion.div>
          )}

          {phase === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full mt-6 sm:mt-10"
            >
              <ChatDemo visible={true} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating orb button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <SiriOrb size={56} state="idle" onClick={handleOrbClick} />
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-4 sm:bottom-28 sm:right-6 z-50 max-w-xs sm:max-w-sm"
          >
            <div 
              className="relative p-4 rounded-2xl border border-cyan-500/20 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(15,23,42,0.95) 50%, rgba(6,182,212,0.1) 100%)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 0 40px rgba(6,182,212,0.15), 0 20px 40px -10px rgba(0,0,0,0.5)",
              }}
            >
              {/* Close button */}
              <button
                onClick={() => setShowToast(false)}
                className="absolute top-3 right-3 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Content */}
              <div className="flex gap-3 pr-6">
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, rgba(6,182,212,0.1) 100%)",
                    boxShadow: "0 0 20px rgba(6,182,212,0.2)",
                  }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white mb-1">
                    Демо виджета Nexik
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Так будет выглядеть AI-чат на вашем сайте. Клиенты смогут общаться с ботом 24/7.
                  </p>
                </div>
              </div>

              {/* Decorative glow */}
              <div 
                className="absolute -inset-px rounded-2xl pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(6,182,212,0.3) 0%, transparent 30%, transparent 70%, rgba(6,182,212,0.2) 100%)",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  padding: "1px",
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
