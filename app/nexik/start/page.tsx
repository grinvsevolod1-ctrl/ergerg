"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Send, ArrowRight, Check, Loader2, Globe, Copy, X, Sparkles, MessageCircle, ExternalLink, Rocket, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { SiriOrb } from "@/components/nexik/siri-orb"

type Step = "chat" | "website" | "offer" | "netnext-chat" | "register" | "done"

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

export default function NexikStartPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("chat")
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Привет! Расскажи о своем бизнесе в одном предложении." }
  ])
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

  const sendMessage = useCallback(() => {
    if (!input.trim() || isTyping || isThinking) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setBusinessDesc(input)
    setInput("")
    
    // Показываем "думает" на 1.5-2.5 секунды
    setIsThinking(true)
    
    const thinkingTime = 1500 + Math.random() * 1000
    setTimeout(() => {
      setIsThinking(false)
      setIsTyping(true)
      
      // Затем печатает ответ
      setTimeout(() => {
        const response = getResponse(userMsg.content)
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response + "\n\nУ тебя есть сайт? (можешь пропустить)"
        }])
        setIsTyping(false)
        setStep("website")
      }, 800)
    }, thinkingTime)
  }, [input, isTyping, isThinking])

  const handleWebsiteSubmit = useCallback(async () => {
    if (!websiteUrl.trim()) {
      setStep("offer")
      return
    }

    setIsAnalyzing(true)
    await new Promise(r => setTimeout(r, 1500))
    setIsAnalyzing(false)
    setStep("register")
  }, [websiteUrl])

  const skipWebsite = useCallback(() => {
    setStep("offer")
  }, [])

  // Открыть чат с NetNext AI
  const openNetnextChat = useCallback(() => {
    setNetnextMessages([{
      id: "1",
      role: "assistant",
      content: `Привет! Я Siri - AI-ассистент NetNext Studio.

Рад, что ты заинтересовался! Расскажу немного о нас:

**NetNext** - это молодая, но амбициозная веб-студия. Мы делаем современные сайты быстро и качественно.

**Специальное предложение для тебя:**
Сайт с полной интеграцией Nexik AI всего за **300 рублей** и **24 часа работы**!

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

  // Отправка сообщения в чат NetNext
  const sendNetnextMessage = useCallback(async (content?: string) => {
    const messageText = content || netnextInput.trim()
    if (!messageText || netnextTyping) return

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: messageText }
    setNetnextMessages(prev => [...prev, userMsg])
    if (!content) setNetnextInput("")
    setNetnextTyping(true)

    // Симуляция ответа AI
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 500))

    const lower = messageText.toLowerCase()
    let response: Message

    if (lower.includes("подробн") || lower.includes("детал") || lower.includes("расскаж")) {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `С удовольствием расскажу подробнее!

**Что мы делаем:**
- Landing pages для бизнеса
- Корпоративные сайты
- Интернет-магазины
- Веб-приложения

**Почему именно мы:**
1. Быстро - стандартный сайт за 1-3 дня
2. Качественно - современный код и дизайн
3. Доступно - цены от 300 рублей
4. С поддержкой - не бросаем после сдачи

**Про Nexik:**
Это наш AI-продукт, который мы интегрируем бесплатно во все наши проекты. Он будет отвечать твоим клиентам 24/7!

Готов обсудить твой проект?`,
        buttons: [
          { label: "Да, давай обсудим", action: "discuss" },
          { label: "Хочу заказать", action: "order" }
        ]
      }
    } else if (lower.includes("пример") || lower.includes("портфолио") || lower.includes("работ")) {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Вот несколько наших работ:

**netnext.site** - наш собственный сайт с интегрированным Nexik
**nexik.org** - платформа AI-ассистента

Мы молодая студия, поэтому пока работаем над портфолио. Но это отличная возможность для тебя - получить качественный сайт по минимальной цене!

Хочешь стать одним из первых клиентов?`,
        buttons: [
          { label: "Да, хочу заказать!", action: "order" },
          { label: "Расскажи про цены", action: "prices" }
        ]
      }
    } else if (lower.includes("цен") || lower.includes("стоим") || lower.includes("скольк")) {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `**Наши цены:**

🚀 **Стартовый пакет - 300₽**
- Одностраничный сайт (лендинг)
- Адаптивный дизайн
- Nexik AI интеграция
- Срок: 24 часа

💼 **Бизнес пакет - от 1000₽**
- Многостраничный сайт
- Уникальный дизайн
- SEO-оптимизация
- Nexik AI + настройка базы знаний
- Срок: 2-3 дня

🏢 **Корпоративный - от 3000₽**
- Полноценный корпоративный сайт
- CMS для управления контентом
- Интеграции с CRM
- Полная настройка Nexik
- Срок: 5-7 дней

Какой вариант тебе интересен?`,
        buttons: [
          { label: "Стартовый за 300₽", action: "order" },
          { label: "Бизнес пакет", action: "order" },
          { label: "Нужна консультация", action: "discuss" }
        ]
      }
    } else if (lower.includes("заказ") || lower.includes("хочу") || lower.includes("готов") || lower.includes("давай")) {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Отлично! Давай оформим заявку.

Мне нужно узнать:
1. **Твоё имя** - как к тебе обращаться?
2. **Телефон или Telegram** - для связи
3. **Что за бизнес** - чтобы понять задачу

${businessDesc ? `\nЯ уже знаю, что у тебя: "${businessDesc}"` : ""}

Напиши свои контакты, и наш менеджер свяжется с тобой в течение часа!`,
        buttons: []
      }
    } else if (lower.includes("обсуд") || lower.includes("консульт") || lower.includes("вопрос")) {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Конечно, давай обсудим!

Расскажи подробнее:
- Какой тип сайта тебе нужен?
- Есть ли референсы (примеры, которые нравятся)?
- Какой бюджет и сроки?

Или просто задай любой вопрос - отвечу!`,
        buttons: []
      }
    } else if (lower.match(/(\+7|8|7)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/) || 
               lower.includes("@") || 
               lower.match(/\d{10,}/)) {
      // Похоже на контакты - сохраняем лид
      const contactInfo = messageText
      
      // Отправляем заявку
      try {
        await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: businessDesc || "Nexik Start - заявка",
            phone: contactInfo.match(/[\d\+\-\(\)\s]+/)?.[0] || contactInfo,
            email: contactInfo.match(/[\w\.-]+@[\w\.-]+/)?.[0] || "не указан",
            description: `Заявка из Nexik Start.\nБизнес: ${businessDesc}\nКонтакт: ${contactInfo}`,
            niche: businessDesc,
            source: "nexik_start",
            consentGiven: true
          })
        })
        setLeadSubmitted(true)
      } catch (e) {
        console.error("Lead submit error:", e)
      }

      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Супер! Записал твои контакты.

✅ **Заявка принята!**

Наш менеджер свяжется с тобой в ближайшее время (обычно в течение часа в рабочее время).

А пока ты можешь:
- Создать аккаунт в Nexik и попробовать AI-ассистента
- Посмотреть наш сайт netnext.site
- Написать нам в Telegram: @netnext_support

Спасибо за доверие! 🙏`,
        buttons: [
          { label: "Создать аккаунт Nexik", action: "register" },
          { label: "Открыть netnext.site", action: "netnext" }
        ]
      }
    } else {
      response = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Понял тебя! 

Если хочешь заказать сайт - просто напиши свои контакты (телефон или telegram), и мы свяжемся.

Или могу рассказать подробнее о наших услугах и ценах.

Что тебе интересно?`,
        buttons: [
          { label: "Расскажи о ценах", action: "prices" },
          { label: "Хочу заказать", action: "order" }
        ]
      }
    }

    setNetnextMessages(prev => [...prev, response])
    setNetnextTyping(false)
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
                  disabled={isTyping || isThinking}
                  className="w-full px-4 sm:px-5 py-3.5 sm:py-4 pr-14 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isTyping || isThinking}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-cyan-500 text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "website" && (
            <motion.div
              key="website"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mb-6">
                <Globe className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Есть сайт?</h2>
              <p className="text-zinc-400 mb-8 max-w-sm">Я проанализирую его и сразу пойму специфику твоего бизнеса</p>
              <div className="w-full max-w-md space-y-4">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleWebsiteSubmit()}
                    placeholder="https://example.com"
                    className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <button
                  onClick={handleWebsiteSubmit}
                  disabled={isAnalyzing}
                  className="w-full py-4 bg-white text-black font-medium rounded-2xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Анализирую...</> : <><ArrowRight className="w-5 h-5" /> Продолжить</>}
                </button>
                <button onClick={skipWebsite} className="w-full py-3 text-zinc-400 hover:text-white transition-colors text-sm">
                  Пропустить, нет сайта
                </button>
              </div>
            </motion.div>
          )}

          {step === "offer" && (
            <motion.div
              key="offer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
                <Rocket className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Нет сайта? Не проблема!</h2>
              <p className="text-zinc-400 mb-8 max-w-md">
                Ты можешь заказать сайт с уже интегрированным Nexik AI у моего создателя - <span className="text-white font-medium">NetNext Studio</span>
              </p>
              
              <div className="w-full max-w-md space-y-3">
                {/* Кнопка чата с NetNext */}
                <button
                  onClick={openNetnextChat}
                  className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-violet-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  Расскажи подробнее
                </button>

                {/* Кнопка заказа напрямую */}
                <button
                  onClick={goToContactForm}
                  className="w-full py-4 bg-white/10 text-white font-medium rounded-2xl hover:bg-white/15 transition-colors flex items-center justify-center gap-3 border border-white/10"
                >
                  <ExternalLink className="w-5 h-5" />
                  Заказать у создателя
                </button>

                {/* Разделитель */}
                <div className="flex items-center gap-4 py-2">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-zinc-500">или</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Кнопка "другая сфера" - неактивная */}
                <div className="relative group">
                  <button
                    disabled
                    className="w-full py-4 bg-white/5 text-zinc-500 font-medium rounded-2xl cursor-not-allowed flex items-center justify-center gap-3 border border-white/5"
                  >
                    <Lock className="w-4 h-4" />
                    Хочу использовать в другой сфере
                  </button>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-800 text-xs text-zinc-300 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    В разработке
                  </div>
                </div>

                {/* Кнопка продолжить без сайта */}
                <button 
                  onClick={() => setStep("register")} 
                  className="w-full py-3 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  У меня уже есть сайт, продолжить
                </button>
              </div>
            </motion.div>
          )}

          {step === "netnext-chat" && (
            <motion.div
              key="netnext-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* Header чата */}
              <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium">Siri - NetNext AI</div>
                  <div className="text-xs text-zinc-500">Онлайн</div>
                </div>
                <button 
                  onClick={() => setStep("offer")} 
                  className="ml-auto p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Сообщения */}
              <div ref={netnextChatRef} className="flex-1 space-y-4 mb-4 overflow-y-auto">
                {netnextMessages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}
                  >
                    <div className="flex items-end gap-2">
                      {msg.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-line",
                        msg.role === "user"
                          ? "bg-violet-500 text-white rounded-br-sm"
                          : "bg-white/5 border border-white/10 rounded-bl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </div>
                    {/* Кнопки */}
                    {msg.buttons && msg.buttons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-10">
                        {msg.buttons.map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleNetnextButton(btn.action)}
                            className="px-3 py-1.5 text-xs bg-violet-500/20 text-violet-300 rounded-full hover:bg-violet-500/30 transition-colors border border-violet-500/30"
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
                {netnextTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex gap-1 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Поле ввода */}
              <div className="relative">
                <input
                  type="text"
                  value={netnextInput}
                  onChange={(e) => setNetnextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendNetnextMessage()}
                  placeholder="Напиши сообщение..."
                  className="w-full px-4 py-3.5 pr-14 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <button
                  onClick={() => sendNetnextMessage()}
                  disabled={!netnextInput.trim() || netnextTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-violet-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
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
        <SiriOrb size={48} color={step === "netnext-chat" ? "#8b5cf6" : "#00ffff"} state={isTyping || isAnalyzing || isCreating || isThinking || netnextTyping ? "thinking" : "idle"} onClick={handleOrbClick} />
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
                  <p className="text-sm font-medium text-white mb-1">Демо виджета Nexik</p>
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
