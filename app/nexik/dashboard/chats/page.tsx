"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  MessageSquare, Search, Filter, RefreshCw, Send, Bot, User, 
  Clock, CheckCircle, AlertCircle, Loader2, ChevronRight, X,
  Globe, Smartphone
} from "lucide-react"

interface Conversation {
  id: string
  visitorId: string
  visitorName: string
  visitorEmail: string
  visitorPhone: string
  status: string
  messagesCount: number
  unreadCount: number
  lastMessage: string
  operatorName: string
  pageUrl: string
  pageTitle: string
  country: string
  city: string
  deviceType: string
  tags: string[]
  rating: number
  createdAt: string
  lastMessageAt: string
  resolvedAt: string
  source: 'widget' | 'telegram'
}

interface Message {
  id: string
  content: string
  senderType: 'visitor' | 'ai' | 'operator' | 'system'
  senderName: string
  createdAt: string
}

interface Stats {
  total: number
  active: number
  pending: number
  resolved: number
  today: number
  unreadMessages: number
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  
  // Selected conversation
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (sourceFilter !== 'all') params.set('source', sourceFilter)
      
      const res = await fetch(`/api/nexik/dashboard/conversations?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setConversations(data.conversations)
        setStats(data.stats)
      }
    } catch (e) {
      console.error("Failed to fetch conversations:", e)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, sourceFilter])
  
  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])
  
  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/nexik/dashboard/conversations/${conversationId}/messages`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages)
      }
    } catch (e) {
      console.error("Failed to fetch messages:", e)
    } finally {
      setLoadingMessages(false)
    }
  }
  
  const selectConversation = (conv: Conversation) => {
    setSelectedConversation(conv)
    fetchMessages(conv.id)
  }
  
  const sendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return
    
    setSendingReply(true)
    try {
      const res = await fetch(`/api/nexik/dashboard/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText })
      })
      
      if (res.ok) {
        setReplyText("")
        // Refresh messages
        fetchMessages(selectedConversation.id)
      }
    } catch (e) {
      console.error("Failed to send reply:", e)
    } finally {
      setSendingReply(false)
    }
  }
  
  const formatTime = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return "только что"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} д`
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'resolved': return 'bg-zinc-500'
      default: return 'bg-zinc-500'
    }
  }
  
  const getSourceIcon = (source: string) => {
    if (source === 'telegram') {
      return (
        <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
          <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
          </svg>
        </div>
      )
    }
    return (
      <div className="w-5 h-5 rounded bg-cyan-500/20 flex items-center justify-center">
        <Globe className="w-3 h-3 text-cyan-400" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Диалоги</h1>
          <p className="text-white/50 text-sm mt-1">
            {stats && `${stats.active} активных из ${stats.total} всего`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchConversations()}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-white/40 text-xs">Активные</p>
            <p className="text-xl font-semibold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-white/40 text-xs">Ожидают</p>
            <p className="text-xl font-semibold text-yellow-400">{stats.pending}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-white/40 text-xs">Решено</p>
            <p className="text-xl font-semibold text-white/70">{stats.resolved}</p>
          </div>
          <div className="bg-zinc-900 rounded-xl p-3">
            <p className="text-white/40 text-xs">Сегодня</p>
            <p className="text-xl font-semibold text-cyan-400">{stats.today}</p>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Поиск по имени, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${showFilters ? 'bg-cyan-500/20 text-cyan-400' : 'bg-zinc-900 text-white/70 hover:text-white'}`}
        >
          <Filter className="w-4 h-4" />
          Фильтры
        </button>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="flex gap-3 mb-4 p-3 bg-zinc-900 rounded-xl">
          <div>
            <label className="text-xs text-white/40 mb-1 block">Статус</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="all">Все</option>
              <option value="active">Активные</option>
              <option value="pending">Ожидают</option>
              <option value="resolved">Решены</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Источник</label>
            <select 
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white text-sm"
            >
              <option value="all">Все</option>
              <option value="widget">Виджет</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Conversations list */}
        <div className="w-96 flex flex-col bg-zinc-900 rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-white/20" />
                <p className="text-white/50">Нет диалогов</p>
                <p className="text-sm text-white/30 mt-1">
                  Диалоги появятся когда клиенты начнут общение
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${selectedConversation?.id === conv.id ? 'bg-white/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-sm font-medium text-white/70">
                            {(conv.visitorName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${getStatusColor(conv.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {conv.visitorName || 'Посетитель'}
                            </span>
                            {getSourceIcon(conv.source)}
                          </div>
                          <span className="text-xs text-white/40 whitespace-nowrap">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 truncate mt-0.5">
                          {conv.lastMessage || 'Нет сообщений'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-xs font-medium rounded">
                              {conv.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-white/30">
                            {conv.messagesCount} сообщ.
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat view */}
        <div className="flex-1 flex flex-col bg-zinc-900 rounded-xl overflow-hidden">
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-white/20" />
                <p className="text-white/50">Выберите диалог</p>
                <p className="text-sm text-white/30 mt-1">
                  Выберите диалог слева для просмотра истории сообщений
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {(selectedConversation.visitorName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {selectedConversation.visitorName || 'Посетитель'}
                      </span>
                      {getSourceIcon(selectedConversation.source)}
                    </div>
                    <p className="text-sm text-white/40">
                      {selectedConversation.visitorEmail || selectedConversation.visitorId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedConversation.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    selectedConversation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-zinc-700 text-white/60'
                  }`}>
                    {selectedConversation.status === 'active' ? 'Активен' :
                     selectedConversation.status === 'pending' ? 'Ожидает' : 'Решён'}
                  </div>
                  <button 
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 hover:bg-white/10 rounded-lg lg:hidden"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    Нет сообщений
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex ${msg.senderType === 'visitor' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] ${
                        msg.senderType === 'visitor' 
                          ? 'bg-zinc-800' 
                          : msg.senderType === 'ai'
                          ? 'bg-cyan-500/20'
                          : 'bg-blue-500/20'
                      } rounded-2xl px-4 py-2.5`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.senderType === 'ai' && <Bot className="w-3 h-3 text-cyan-400" />}
                          {msg.senderType === 'visitor' && <User className="w-3 h-3 text-white/40" />}
                          <span className="text-xs text-white/40">
                            {msg.senderType === 'ai' ? 'AI' : 
                             msg.senderType === 'visitor' ? 'Посетитель' : 
                             msg.senderName || 'Оператор'}
                          </span>
                          <span className="text-xs text-white/30">
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-white whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Написать ответ..."
                    className="flex-1 px-4 py-2.5 bg-zinc-800 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-4 py-2.5 bg-cyan-500 text-black rounded-xl font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {selectedConversation.source === 'telegram' && (
                  <p className="text-xs text-white/30 mt-2">
                    Ответ будет отправлен в Telegram
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
