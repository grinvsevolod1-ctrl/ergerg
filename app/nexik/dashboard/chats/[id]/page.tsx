"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { useNexikEvents } from "@/lib/nexik/hooks/useNexikEvents"
import { 
  ArrowLeft, 
  User, 
  Bot, 
  Send, 
  CheckCircle2,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Mail,
  Phone,
  Tag,
  MoreVertical,
  Archive,
  UserCheck,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  senderType: 'visitor' | 'ai' | 'operator' | 'system'
  senderId: string | null
  senderName: string | null
  content: string
  contentType: string
  aiModel: string | null
  aiResponseTimeMs: number | null
  createdAt: string
}

interface ConversationDetail {
  id: string
  visitorId: string
  visitorName: string | null
  visitorEmail: string | null
  visitorPhone: string | null
  status: 'active' | 'pending' | 'resolved' | 'archived'
  assignedOperatorId: string | null
  pageUrl: string | null
  pageTitle: string | null
  referrer: string | null
  country: string | null
  city: string | null
  deviceType: string | null
  browser: string | null
  os: string | null
  tags: string[]
  rating: number | null
  createdAt: string
  lastMessageAt: string | null
}

const statusConfig = {
  active: { label: "AI отвечает", color: "#00ffff" },
  pending: { label: "Ждёт оператора", color: "#ffaa00" },
  resolved: { label: "Завершён", color: "#00ff88" },
  archived: { label: "Архив", color: "#888" },
}

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useNexikAuth()
  const chatId = params.id as string
  
  const [conversation, setConversation] = useState<ConversationDetail | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const orgId = session?.org?.id || ''

  // Real-time messages
  const handleNewMessage = useCallback((data: { conversationId: string; message: unknown }) => {
    if (data.conversationId === chatId) {
      const msg = data.message as Message
      setMessages(prev => [...prev, msg])
    }
  }, [chatId])

  useNexikEvents({
    orgId,
    onMessage: handleNewMessage,
    enabled: !!orgId
  })

  const loadData = useCallback(async () => {
    if (!chatId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const [convRes, msgRes] = await Promise.all([
        fetch(`/api/nexik/dashboard/conversations/${chatId}`),
        fetch(`/api/nexik/dashboard/conversations/${chatId}/messages`)
      ])
      
      const convData = await convRes.json()
      const msgData = await msgRes.json()
      
      if (convData.success && msgData.success) {
        setConversation(convData.conversation)
        setMessages(msgData.messages)
      } else {
        setError(convData.error || msgData.error || 'Ошибка загрузки')
      }
    } catch {
      setError('Не удалось загрузить диалог')
    } finally {
      setLoading(false)
    }
  }, [chatId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return
    
    setSending(true)
    try {
      const res = await fetch(`/api/nexik/dashboard/conversations/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setMessages(prev => [...prev, data.message])
        setNewMessage("")
      } else {
        setError(data.error)
      }
    } catch {
      setError('Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/nexik/dashboard/conversations/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (res.ok) {
        setConversation(prev => prev ? { ...prev, status: status as ConversationDetail['status'] } : null)
      }
    } catch {
      // Silent fail
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  }

  if (loading) {
    return <ChatDetailSkeleton />
  }

  if (error || !conversation) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error || 'Диалог не найден'}</p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  const status = statusConfig[conversation.status]

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/nexik/dashboard/chats">
              <Button variant="ghost" size="icon" className="hover:bg-white/5">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center">
              <User className="w-5 h-5 text-[#888]" />
            </div>
            <div>
              <p className="font-medium">
                {conversation.visitorName || conversation.visitorEmail?.split('@')[0] || `Посетитель ${conversation.visitorId.slice(0, 6)}`}
              </p>
              <p className="text-xs text-[#888]">
                {conversation.city && `${conversation.city} • `}
                {formatDate(conversation.createdAt)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div 
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ 
                background: `${status.color}15`, 
                color: status.color,
                border: `1px solid ${status.color}30`
              }}
            >
              {status.label}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-white/5">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-[#1a1a2e]">
                <DropdownMenuItem onClick={() => updateStatus('resolved')} className="cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-[#00ff88]" />
                  Завершить
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateStatus('pending')} className="cursor-pointer">
                  <Clock className="w-4 h-4 mr-2 text-[#ffaa00]" />
                  Взять в работу
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1a1a2e]" />
                <DropdownMenuItem onClick={() => updateStatus('archived')} className="cursor-pointer">
                  <Archive className="w-4 h-4 mr-2 text-[#888]" />
                  В архив
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isVisitor = msg.senderType === 'visitor'
              const isAI = msg.senderType === 'ai'
              const isOperator = msg.senderType === 'operator'
              const showDate = idx === 0 || 
                formatDate(messages[idx - 1].createdAt) !== formatDate(msg.createdAt)
              
              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="text-center text-xs text-[#555] my-4">
                      {formatDate(msg.createdAt)}
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex gap-3",
                    isVisitor ? "justify-start" : "justify-end"
                  )}>
                    {isVisitor && (
                      <div className="w-8 h-8 rounded-full bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#888]" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2.5",
                      isVisitor && "bg-[#1a1a2e] text-white",
                      isAI && "bg-[#00ffff]/10 border border-[#00ffff]/20",
                      isOperator && "bg-[#ff00aa]/10 border border-[#ff00aa]/20"
                    )}>
                      {(isAI || isOperator) && (
                        <div className="flex items-center gap-1.5 mb-1">
                          {isAI ? (
                            <>
                              <Bot className="w-3 h-3 text-[#00ffff]" />
                              <span className="text-[10px] text-[#00ffff]">Nexik AI</span>
                              {msg.aiResponseTimeMs && (
                                <span className="text-[10px] text-[#555]">
                                  • {msg.aiResponseTimeMs}ms
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3 text-[#ff00aa]" />
                              <span className="text-[10px] text-[#ff00aa]">
                                {msg.senderName || 'Оператор'}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        isVisitor ? "text-[#555]" : "text-[#555]"
                      )}>
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                    
                    {(isAI || isOperator) && (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        isAI ? "bg-[#00ffff]/10" : "bg-[#ff00aa]/10"
                      )}>
                        {isAI ? (
                          <Bot className="w-4 h-4 text-[#00ffff]" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-[#ff00aa]" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t border-[#1a1a2e] bg-[#0a0a0f]/80">
            <div className="flex gap-2">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                className="min-h-[44px] max-h-32 bg-[#1a1a2e] border-[#2a2a3e] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
              />
              <Button 
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90 px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-[10px] text-[#555] mt-2">
              Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        </div>

        {/* Sidebar - Visitor Info */}
        <div className="hidden lg:block w-72 border-l border-[#1a1a2e] bg-[#0a0a0f]/50 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-4">О посетителе</h3>
            
            <div className="space-y-4">
              {conversation.visitorEmail && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-[#888]" />
                  <span className="text-sm truncate">{conversation.visitorEmail}</span>
                </div>
              )}
              
              {conversation.visitorPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#888]" />
                  <span className="text-sm">{conversation.visitorPhone}</span>
                </div>
              )}
              
              {(conversation.country || conversation.city) && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-[#888]" />
                  <span className="text-sm">
                    {[conversation.city, conversation.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {conversation.deviceType && (
                <div className="flex items-center gap-3">
                  {conversation.deviceType === 'mobile' ? (
                    <Smartphone className="w-4 h-4 text-[#888]" />
                  ) : (
                    <Monitor className="w-4 h-4 text-[#888]" />
                  )}
                  <span className="text-sm capitalize">
                    {conversation.deviceType}
                    {conversation.browser && ` • ${conversation.browser}`}
                  </span>
                </div>
              )}
              
              {conversation.pageUrl && (
                <div className="pt-4 border-t border-[#1a1a2e]">
                  <p className="text-xs text-[#888] mb-1">Страница</p>
                  <p className="text-sm truncate" title={conversation.pageUrl}>
                    {conversation.pageTitle || conversation.pageUrl}
                  </p>
                </div>
              )}
              
              {conversation.referrer && (
                <div>
                  <p className="text-xs text-[#888] mb-1">Откуда пришёл</p>
                  <p className="text-sm truncate" title={conversation.referrer}>
                    {conversation.referrer}
                  </p>
                </div>
              )}
              
              {conversation.tags.length > 0 && (
                <div className="pt-4 border-t border-[#1a1a2e]">
                  <p className="text-xs text-[#888] mb-2">Теги</p>
                  <div className="flex flex-wrap gap-1">
                    {conversation.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-0.5 rounded text-xs bg-[#1a1a2e] text-[#888]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatDetailSkeleton() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b border-[#1a1a2e]">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
          <div>
            <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
            <Skeleton className="h-3 w-24 bg-white/10" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn("flex gap-3", i % 2 === 0 && "justify-end")}>
            {i % 2 !== 0 && <Skeleton className="w-8 h-8 rounded-full bg-white/10" />}
            <Skeleton className="h-16 w-48 rounded-2xl bg-white/10" />
            {i % 2 === 0 && <Skeleton className="w-8 h-8 rounded-full bg-white/10" />}
          </div>
        ))}
      </div>
    </div>
  )
}
