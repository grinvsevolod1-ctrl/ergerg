"use client"

import { useState, useEffect, useRef } from "react"
import { 
  Loader2, Send, Bot, User, Sparkles, CheckCircle, 
  Building2, FileText, Users, Clock, HelpCircle, RefreshCw
} from "lucide-react"

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

const QUICK_TOPICS = [
  { icon: Building2, label: "О компании", prompt: "Расскажу о своей компании" },
  { icon: FileText, label: "Услуги", prompt: "Хочу рассказать о наших услугах" },
  { icon: Users, label: "Клиенты", prompt: "Расскажу о наших клиентах" },
  { icon: Clock, label: "Режим работы", prompt: "Вот наш график работы" },
  { icon: HelpCircle, label: "FAQ", prompt: "Добавлю частые вопросы" },
]

export default function TrainPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState("")
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
      
      // Add welcome message if no messages
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
        
        // Refresh profile to see learned facts
        const profileRes = await fetch("/api/nexik/dashboard/business-profile")
        const profileData = await profileRes.json()
        if (profileData.profile) {
          setProfile(profileData.profile)
        }
      }
    } catch (e) {
      console.error("Failed to send message:", e)
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
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)]">
      {/* Chat section */}
      <div className="flex-1 flex flex-col bg-zinc-900 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold">Обучение AI-ассистента</h2>
              <p className="text-sm text-white/40">Расскажите о вашем бизнесе</p>
            </div>
          </div>
        </div>
        
        {/* Quick topics */}
        {messages.length <= 1 && (
          <div className="p-4 border-b border-white/5">
            <p className="text-sm text-white/40 mb-3">Быстрые темы:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(topic.prompt)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  <topic.icon className="w-4 h-4 text-cyan-400" />
                  {topic.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-cyan-500/20' : 'bg-zinc-800'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <Bot className="w-4 h-4 text-white/60" />
                  )}
                </div>
                <div className={`px-4 py-3 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-cyan-500/20 rounded-br-md' 
                    : 'bg-zinc-800 rounded-bl-md'
                }`}>
                  <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {sending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white/60" />
                </div>
                <div className="px-4 py-3 bg-zinc-800 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Расскажите о вашем бизнесе..."
              rows={1}
              className="flex-1 px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              className="px-4 py-3 bg-cyan-500 text-black rounded-xl font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Profile sidebar */}
      <div className="w-80 space-y-4 overflow-y-auto">
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Профиль бизнеса
          </h3>
          
          {profile ? (
            <div className="space-y-3 text-sm">
              {profile.business_name && (
                <div>
                  <p className="text-white/40">Название</p>
                  <p className="text-white">{profile.business_name}</p>
                </div>
              )}
              {profile.industry && (
                <div>
                  <p className="text-white/40">Отрасль</p>
                  <p className="text-white">{profile.industry}</p>
                </div>
              )}
              {profile.short_description && (
                <div>
                  <p className="text-white/40">Описание</p>
                  <p className="text-white">{profile.short_description}</p>
                </div>
              )}
              {profile.services?.length > 0 && (
                <div>
                  <p className="text-white/40">Услуги</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.services.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {!profile.business_name && !profile.industry && !profile.short_description && (
                <p className="text-white/40 text-center py-4">
                  Расскажите о бизнесе в чате, и информация появится здесь
                </p>
              )}
            </div>
          ) : (
            <p className="text-white/40 text-sm text-center py-4">
              Профиль ещё не заполнен
            </p>
          )}
        </div>
        
        {/* Learned facts */}
        {profile?.ai_learned_facts && profile.ai_learned_facts.length > 0 && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Изученные факты ({profile.ai_learned_facts.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {profile.ai_learned_facts.slice(-10).reverse().map((fact, i) => (
                <div key={i} className="text-sm p-2 bg-zinc-800 rounded-lg">
                  <p className="text-white">{fact.fact}</p>
                  <p className="text-xs text-white/30 mt-1">{fact.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tips */}
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="font-semibold mb-3">Советы</h3>
          <ul className="space-y-2 text-sm text-white/60">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">1.</span>
              Расскажите чем занимается ваш бизнес
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">2.</span>
              Опишите ваши услуги и продукты
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">3.</span>
              Добавьте частые вопросы клиентов
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">4.</span>
              Укажите контакты и график работы
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
