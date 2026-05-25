"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Loader2, Send, Bot, User, Sparkles, CheckCircle, 
  Building2, FileText, Users, Clock, HelpCircle, Brain,
  Lightbulb, Target, Zap
} from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface BusinessProfile {
  business_name: string
  business_type: string
  industry: string
  short_description: string
  services: string[]
  products: string[]
  target_audience: string
  brand_voice: string
  contact_email: string
  contact_phone: string
  faq: Array<{ question: string; answer: string }>
  ai_learned_facts: Array<{ fact: string; category: string; timestamp: string }>
  onboarding_completed: boolean
}

// Лимиты для сообщений (должны соответствовать бэкенду)
const MAX_MESSAGE_LENGTH = 10000
const WARNING_THRESHOLD = 8000

const QUICK_TOPICS = [
  { icon: Building2, label: "О компании", prompt: "Расскажу о своей компании", color: "cyan" },
  { icon: FileText, label: "Услуги", prompt: "Хочу рассказать о наших услугах", color: "purple" },
  { icon: Users, label: "Клиенты", prompt: "Расскажу о наших клиентах", color: "green" },
  { icon: Clock, label: "Режим работы", prompt: "Вот наш график работы", color: "orange" },
  { icon: HelpCircle, label: "FAQ", prompt: "Добавлю частые вопросы", color: "pink" },
]

export default function TrainPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    loadData()
  }, [])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
  
  const loadData = async () => {
    try {
      const [profileRes, messagesRes] = await Promise.all([
        fetch("/api/nexik/dashboard/business-profile"),
        fetch("/api/nexik/dashboard/business-profile/train")
      ])
      
      const profileData = await profileRes.json()
      const messagesData = await messagesRes.json()
      
      if (profileData.profile) {
        setProfile(profileData.profile)
      }
      
      if (messagesData.success && messagesData.messages) {
        setMessages(messagesData.messages)
      }
      
      if (!messagesData.messages?.length) {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'Привет! Я помогу настроить вашего AI-ассистента. Расскажите о вашем бизнесе - чем вы занимаетесь, какие услуги предоставляете? Чем больше я узнаю, тем лучше смогу помогать вашим клиентам.',
          createdAt: new Date().toISOString()
        }])
      }
    } catch (e) {
      console.error("Failed to load data:", e)
    } finally {
      setLoading(false)
    }
  }
  
  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || sending) return
    
    // Проверка длины на клиенте
    if (messageText.length > MAX_MESSAGE_LENGTH) {
      setError(`Сообщение слишком длинное (${messageText.length} символов). Максимум ${MAX_MESSAGE_LENGTH}. Разбейте на несколько сообщений.`)
      return
    }
    
    setError(null)
    
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setSending(true)
    
    try {
      const res = await fetch("/api/nexik/dashboard/business-profile/train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText })
      })
      
      const data = await res.json()
      
      if (data.success) {
        const aiMessage: Message = {
          id: `ai_${Date.now()}`,
          role: 'assistant',
          content: data.response,
          createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, aiMessage])
        
        const profileRes = await fetch("/api/nexik/dashboard/business-profile")
        const profileData = await profileRes.json()
        if (profileData.profile) {
          setProfile(profileData.profile)
        }
      } else {
        // Показываем ошибку от сервера
        setError(data.error || 'Не удалось отправить сообщение')
        // Удаляем сообщение пользователя из истории при ошибке
        setMessages(prev => prev.filter(m => m.id !== userMessage.id))
      }
    } catch (e) {
      console.error("Failed to send message:", e)
      setError('Ошибка соединения. Попробуйте еще раз.')
      setMessages(prev => prev.filter(m => m.id !== userMessage.id))
    } finally {
      setSending(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  
  const factsCount = profile?.ai_learned_facts?.length || 0
  const completionScore = Math.min(100, factsCount * 10 + (profile?.business_name ? 10 : 0) + (profile?.services?.length ? 20 : 0))
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <SiriOrb size={64} state="thinking" />
          <p className="text-white/50 text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-120px)]">
      {/* Chat section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          <div className="flex items-center gap-4">
            <SiriOrb size={48} state={sending ? "thinking" : "idle"} />
            <div>
              <h2 className="font-semibold text-white text-lg">Обучение AI-ассистента</h2>
              <p className="text-sm text-white/40">Расскажите о вашем бизнесе</p>
            </div>
          </div>
        </div>
        
        {/* Quick topics */}
        <AnimatePresence>
          {messages.length <= 1 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 border-b border-white/5"
            >
              <p className="text-sm text-white/40 mb-3">Быстрые темы:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPICS.map((topic, i) => {
                  const colorClasses: Record<string, string> = {
                    cyan: "border-cyan-500/20 hover:bg-cyan-500/10 hover:border-cyan-500/40 text-cyan-400",
                    purple: "border-purple-500/20 hover:bg-purple-500/10 hover:border-purple-500/40 text-purple-400",
                    green: "border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-emerald-400",
                    orange: "border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40 text-orange-400",
                    pink: "border-pink-500/20 hover:bg-pink-500/10 hover:border-pink-500/40 text-pink-400",
                  }
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => sendMessage(topic.prompt)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-white/5 text-sm transition-all ${colorClasses[topic.color]}`}
                    >
                      <topic.icon className="w-4 h-4" />
                      {topic.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, index) => (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30' 
                    : 'bg-white/5 border border-white/10'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-white/60" />
                  )}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 rounded-br-sm' 
                    : 'bg-white/5 border border-white/10 rounded-bl-sm'
                }`}>
                  <p className="text-white/90 whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {sending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white/60" />
                </div>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-2xl rounded-bl-sm">
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
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-white/10"
          style={{ background: "rgba(255,255,255,0.02)" }}
        >
          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  if (error) setError(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Расскажите о вашем бизнесе..."
                rows={1}
                className={`w-full px-4 py-3 rounded-xl border bg-black/20 text-white placeholder:text-white/30 focus:outline-none resize-none transition-colors ${
                  input.length > MAX_MESSAGE_LENGTH 
                    ? 'border-red-500/50 focus:border-red-500' 
                    : input.length > WARNING_THRESHOLD 
                      ? 'border-orange-500/50 focus:border-orange-500' 
                      : 'border-white/10 focus:border-cyan-500/50'
                }`}
              />
              {/* Character counter */}
              {input.length > WARNING_THRESHOLD && (
                <div className={`absolute right-3 bottom-1 text-xs ${
                  input.length > MAX_MESSAGE_LENGTH ? 'text-red-400' : 'text-orange-400'
                }`}>
                  {input.length} / {MAX_MESSAGE_LENGTH}
                </div>
              )}
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim() || input.length > MAX_MESSAGE_LENGTH}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black rounded-xl font-medium hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Profile sidebar */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full lg:w-80 space-y-4 overflow-y-auto"
      >
        {/* Completion score */}
        <div className="rounded-2xl border border-white/10 p-5"
          style={{ background: "linear-gradient(145deg, rgba(34,211,238,0.05) 0%, rgba(168,85,247,0.05) 100%)" }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Уровень обучения</h3>
              <p className="text-xs text-white/40">{factsCount} фактов изучено</p>
            </div>
          </div>
          <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionScore}%` }}
              transition={{ duration: 1, delay: 0.3 }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
            />
          </div>
          <p className="text-right text-sm text-white/50 mt-2">{completionScore}%</p>
        </div>
        
        {/* Business profile */}
        <div className="rounded-2xl border border-white/10 p-5"
          style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white">Профиль бизнеса</h3>
          </div>
          
          {profile ? (
            <div className="space-y-4 text-sm">
              {profile.business_name && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Название</p>
                  <p className="text-white font-medium">{profile.business_name}</p>
                </div>
              )}
              {profile.industry && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Отрасль</p>
                  <p className="text-white">{profile.industry}</p>
                </div>
              )}
              {profile.short_description && (
                <div>
                  <p className="text-white/40 text-xs mb-1">Описание</p>
                  <p className="text-white/80 leading-relaxed">{profile.short_description}</p>
                </div>
              )}
              {profile.services?.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-2">Услуги</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.services.map((s, i) => (
                      <span key={i} className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-lg text-xs border border-cyan-500/20">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {!profile.business_name && !profile.industry && !profile.short_description && (
                <div className="text-center py-6">
                  <Target className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-white/40 text-sm">
                    Расскажите о бизнесе в чате
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Target className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/40 text-sm">Профиль ещё не заполнен</p>
            </div>
          )}
        </div>
        
        {/* Learned facts */}
        {factsCount > 0 && (
          <div className="rounded-2xl border border-white/10 p-5"
            style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="font-semibold text-white">Изученные факты</h3>
              <span className="ml-auto text-xs text-white/40">{factsCount}</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {profile?.ai_learned_facts?.slice(-5).reverse().map((fact, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-sm p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <p className="text-white/80">{fact.fact}</p>
                  <p className="text-[10px] text-white/30 mt-1">{fact.category}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tips */}
        <div className="rounded-2xl border border-cyan-500/20 p-5"
          style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.05) 0%, rgba(34,211,238,0.02) 100%)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Советы</h3>
          </div>
          <ul className="space-y-2 text-xs text-white/60">
            <li className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Расскажите чем занимается ваш бизнес</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Опишите ваши услуги и продукты</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Добавьте частые вопросы клиентов</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
              <span>Укажите контакты и график работы</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  )
}
