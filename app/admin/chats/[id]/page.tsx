"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  Send, 
  RefreshCw, 
  User, 
  Bot, 
  Headphones,
  Globe,
  Clock,
  MoreVertical,
  Link as LinkIcon,
  PhoneOff,
  Phone,
  MessageSquare,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'bot' | 'operator'
  message: string
  delivered: boolean
  created_at: string
}

interface ChatSession {
  id: string
  user_type: 'website' | 'telegram'
  telegram_chat_id?: number
  telegram_username?: string
  telegram_name?: string
  operator_connected: boolean
  operator_connected_at?: string
  created_at: string
  last_activity: string
  metadata: Record<string, unknown>
}

const QUICK_REPLIES = [
  { label: "Привет!", text: "Здравствуйте! Чем могу помочь?" },
  { label: "Цены", text: "Стоимость зависит от сложности проекта. Базовый сайт от 50 000₽, интернет-магазин от 150 000₽. Хотите обсудить детали?" },
  { label: "Сроки", text: "Обычные сроки: Landing Page — 5-7 дней, корпоративный сайт — 2-3 недели, интернет-магазин — от 1 месяца." },
  { label: "Контакты", text: "Вы можете связаться с нами: hello@netnext.site или +375 (29) 14-14-555" },
]

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<ChatSession | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchChat = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/chats/${sessionId}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
        setMessages(data.messages)
      } else if (response.status === 404) {
        router.push('/admin/chats')
      }
    } catch (error) {
      console.error('Error fetching chat:', error)
    } finally {
      setLoading(false)
    }
  }, [sessionId, router])

  useEffect(() => {
    fetchChat()
  }, [fetchChat])

  useEffect(() => {
    const interval = setInterval(fetchChat, 5000)
    return () => clearInterval(interval)
  }, [fetchChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (text?: string) => {
    const messageText = text || message.trim()
    if (!messageText || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/admin/chats/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageText }),
      })

      if (response.ok) {
        setMessage("")
        setShowQuickReplies(false)
        await fetchChat()
        inputRef.current?.focus()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleAction = async (action: string) => {
    try {
      await fetch(`/api/admin/chats/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      })
      await fetchChat()
    } catch (error) {
      console.error('Error performing action:', error)
    }
    setShowMenu(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера'
    }
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const getSessionName = () => {
    if (!session) return 'Загрузка...'
    if (session.telegram_name) return session.telegram_name
    if (session.telegram_username) return `@${session.telegram_username}`
    return `Посетитель #${session.id.slice(0, 6)}`
  }

  const getSenderIcon = (senderType: string) => {
    switch (senderType) {
      case 'user': return <User className="w-4 h-4" />
      case 'bot': return <Bot className="w-4 h-4" />
      case 'operator': return <Headphones className="w-4 h-4" />
      default: return <User className="w-4 h-4" />
    }
  }

  const getSenderName = (senderType: string) => {
    switch (senderType) {
      case 'user': return 'Клиент'
      case 'bot': return 'AI Бот'
      case 'operator': return 'Вы'
      default: return 'Неизвестно'
    }
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(msg)
    return groups
  }, {} as Record<string, ChatMessage[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
          <p className="text-[#888]">Загрузка чата...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
        <MessageSquare className="w-12 h-12 text-[#555] mb-4" />
        <p className="text-lg font-medium text-white mb-2">Чат не найден</p>
        <p className="text-[#888] mb-4">Возможно, он был удалён</p>
        <Link href="/admin/chats">
          <Button variant="outline" className="border-[#333]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            К списку чатов
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/chats"
            className="p-2.5 hover:bg-[#111] rounded-xl transition-colors border border-transparent hover:border-[#222]"
          >
            <ArrowLeft className="w-5 h-5 text-[#888]" />
          </Link>
          
          <div className="flex items-center gap-4">
            <div className={cn(
              "relative w-12 h-12 rounded-xl flex items-center justify-center",
              session.user_type === 'telegram' ? "bg-blue-500/20" : "bg-cyan-500/20"
            )}>
              {session.user_type === 'telegram' ? (
                <Send className="w-5 h-5 text-blue-400" />
              ) : (
                <Globe className="w-5 h-5 text-cyan-400" />
              )}
              <span className={cn(
                "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#000]",
                session.operator_connected ? "bg-emerald-400" : "bg-[#555]"
              )} />
            </div>
            
            <div>
              <h1 className="font-semibold text-white text-lg">{getSessionName()}</h1>
              <div className="flex items-center gap-3 text-sm text-[#888]">
                <span className={cn(
                  "flex items-center gap-1.5",
                  session.user_type === 'telegram' ? "text-blue-400" : "text-cyan-400"
                )}>
                  {session.user_type === 'telegram' ? 'Telegram' : 'Сайт'}
                </span>
                <span className="text-[#333]">•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDate(session.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Operator Status Badge */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-colors",
            session.operator_connected 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-[#111] border-[#222] text-[#888]"
          )}>
            {session.operator_connected ? (
              <>
                <Headphones className="w-4 h-4" />
                Оператор активен
              </>
            ) : (
              <>
                <Bot className="w-4 h-4" />
                Автоответы
              </>
            )}
          </div>

          {/* Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="w-10 h-10 text-[#888] hover:text-white hover:bg-[#111]"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-20 py-2 overflow-hidden">
                  {session.operator_connected ? (
                    <button
                      onClick={() => handleAction('disconnect')}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Отключить оператора
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAction('connect')}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Подключиться к чату
                    </button>
                  )}
                  <div className="h-px bg-[#222] my-2" />
                  <button
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Привязать к лиду
                  </button>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left text-[#888] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть в Telegram
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#555]" />
            </div>
            <p className="text-white font-medium mb-1">Нет сообщений</p>
            <p className="text-sm text-[#888]">Начните диалог первым</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date}>
                {/* Date Separator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                  <span className="text-xs font-medium text-[#555] px-3 py-1 bg-[#111] rounded-full">
                    {formatDate(msgs[0].created_at)}
                  </span>
                  <div className="flex-1 h-px bg-[#1a1a1a]" />
                </div>

                {/* Messages */}
                <div className="space-y-4">
                  {msgs.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.sender_type === 'operator' && "flex-row-reverse"
                      )}
                    >
                      {/* Avatar */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                        msg.sender_type === 'user' && "bg-cyan-500/20 text-cyan-400",
                        msg.sender_type === 'bot' && "bg-violet-500/20 text-violet-400",
                        msg.sender_type === 'operator' && "bg-emerald-500/20 text-emerald-400"
                      )}>
                        {getSenderIcon(msg.sender_type)}
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-3",
                        msg.sender_type === 'user' && "bg-[#111] border border-[#1a1a1a]",
                        msg.sender_type === 'bot' && "bg-[#111] border border-violet-500/20",
                        msg.sender_type === 'operator' && "bg-gradient-to-br from-cyan-500 to-teal-500"
                      )}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={cn(
                            "text-xs font-medium",
                            msg.sender_type === 'operator' ? "text-white/90" : "text-[#888]"
                          )}>
                            {getSenderName(msg.sender_type)}
                          </span>
                          <span className={cn(
                            "text-xs",
                            msg.sender_type === 'operator' ? "text-white/60" : "text-[#555]"
                          )}>
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                        <p className={cn(
                          "text-sm whitespace-pre-wrap leading-relaxed",
                          msg.sender_type === 'operator' ? "text-white" : "text-white"
                        )}>
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="pt-4 border-t border-[#1a1a1a]">
        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="mb-3 p-3 bg-[#111] rounded-xl border border-[#1a1a1a]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-[#888]">Быстрые ответы</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_REPLIES.map((reply, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(reply.text)}
                  disabled={sending}
                  className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#222] rounded-lg text-sm text-white transition-colors disabled:opacity-50"
                >
                  {reply.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Quick Replies Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickReplies(!showQuickReplies)}
            className={cn(
              "h-12 w-12 rounded-xl",
              showQuickReplies ? "bg-amber-500/10 text-amber-400" : "text-[#888] hover:text-white"
            )}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* Input */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написать сообщение..."
              rows={1}
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder:text-[#555] focus:outline-none focus:border-cyan-500/50 resize-none transition-colors"
              style={{ minHeight: '52px', maxHeight: '150px' }}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={() => sendMessage()}
            disabled={!message.trim() || sending}
            className="h-12 w-12 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50"
          >
            {sending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        <p className="text-xs text-[#555] mt-2 ml-16">
          Enter для отправки • Shift+Enter для новой строки
        </p>
      </div>
    </div>
  )
}
