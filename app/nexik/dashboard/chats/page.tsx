"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, Search, Filter, RefreshCw, Send, Bot, User, 
  Clock, CheckCircle, Loader2, X, Globe, ArrowLeft
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

// Stat pill component
function StatPill({ label, value, color }: { label: string; value: number; color: 'green' | 'yellow' | 'zinc' | 'cyan' }) {
  const colorClasses = {
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    zinc: "bg-white/5 text-white/60 border-white/10",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  }
  
  return (
    <div className={`px-4 py-3 rounded-xl border ${colorClasses[color]}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  )
}

export default function ChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Selected conversation
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const fetchConversations = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
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
      setRefreshing(false)
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
    
    if (diff < 60000) return "сейчас"
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} д`
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500'
      case 'pending': return 'bg-yellow-500'
      case 'resolved': return 'bg-white/30'
      default: return 'bg-white/30'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          <p className="text-white/50 text-sm">Загрузка диалогов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Диалоги</h1>
          <p className="text-white/50 text-sm mt-1">
            {stats && `${stats.active} активных из ${stats.total} всего`}
          </p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchConversations(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline text-sm">Обновить</span>
        </motion.button>
      </motion.div>
      
      {/* Stats */}
      {stats && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
        >
          <StatPill label="Активные" value={stats.active} color="green" />
          <StatPill label="Ожидают" value={stats.pending} color="yellow" />
          <StatPill label="Решено" value={stats.resolved} color="zinc" />
          <StatPill label="Сегодня" value={stats.today} color="cyan" />
        </motion.div>
      )}

      {/* Search & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-2 mb-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Поиск по имени, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
            style={{ background: "rgba(255,255,255,0.03)" }}
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
            showFilters 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
          style={{ background: showFilters ? undefined : "rgba(255,255,255,0.03)" }}
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline text-sm">Фильтры</span>
        </button>
      </motion.div>
      
      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex gap-4 p-4 rounded-xl border border-white/10"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Статус</label>
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">Все</option>
                  <option value="active">Активные</option>
                  <option value="pending">Ожидают</option>
                  <option value="resolved">Решены</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Источник</label>
                <select 
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="all">Все</option>
                  <option value="widget">Виджет</option>
                  <option value="telegram">Telegram</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex gap-4 flex-1 min-h-0"
      >
        {/* Conversations list */}
        <div className={`${selectedConversation ? 'hidden lg:flex' : 'flex'} w-full lg:w-[400px] flex-col rounded-2xl border border-white/10 overflow-hidden`}
          style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
        >
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/50 font-medium">Нет диалогов</p>
                <p className="text-sm text-white/30 mt-1">
                  Диалоги появятся когда клиенты начнут общение
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {conversations.map((conv, index) => (
                  <motion.button
                    key={conv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 text-left transition-all ${
                      selectedConversation?.id === conv.id 
                        ? 'bg-cyan-500/10' 
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                          <span className="text-sm font-medium text-white">
                            {(conv.visitorName || 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${getStatusColor(conv.status)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white truncate">
                              {conv.visitorName || 'Посетитель'}
                            </span>
                            {conv.source === 'telegram' && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">TG</span>
                            )}
                          </div>
                          <span className="text-xs text-white/40 whitespace-nowrap">
                            {formatTime(conv.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-white/50 truncate mt-0.5">
                          {conv.lastMessage || 'Нет сообщений'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {conv.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-cyan-500 text-black text-[10px] font-bold rounded">
                              {conv.unreadCount}
                            </span>
                          )}
                          <span className="text-[10px] text-white/30">
                            {conv.messagesCount} сообщ.
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat view */}
        <div className={`${selectedConversation ? 'flex' : 'hidden lg:flex'} flex-1 flex-col rounded-2xl border border-white/10 overflow-hidden`}
          style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)" }}
        >
          {!selectedConversation ? (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-10 h-10 text-white/20" />
                </div>
                <p className="text-white/50 font-medium">Выберите диалог</p>
                <p className="text-sm text-white/30 mt-1">
                  Выберите диалог слева для просмотра истории
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden p-2 -ml-2 hover:bg-white/10 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                    <span className="text-sm font-medium">
                      {(selectedConversation.visitorName || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {selectedConversation.visitorName || 'Посетитель'}
                      </span>
                      {selectedConversation.source === 'telegram' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">TG</span>
                      )}
                    </div>
                    <p className="text-xs text-white/40">
                      {selectedConversation.visitorEmail || selectedConversation.visitorId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    selectedConversation.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                    selectedConversation.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {selectedConversation.status === 'active' ? 'Активен' :
                     selectedConversation.status === 'pending' ? 'Ожидает' : 'Решён'}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    Нет сообщений
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className={`flex ${msg.senderType === 'visitor' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                        msg.senderType === 'visitor' 
                          ? 'bg-white/5 border border-white/10 rounded-bl-sm' 
                          : msg.senderType === 'ai'
                          ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 border border-cyan-500/20 rounded-br-sm'
                          : 'bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/20 rounded-br-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.senderType === 'ai' && <Bot className="w-3.5 h-3.5 text-cyan-400" />}
                          {msg.senderType === 'visitor' && <User className="w-3.5 h-3.5 text-white/40" />}
                          {msg.senderType === 'operator' && <CheckCircle className="w-3.5 h-3.5 text-purple-400" />}
                          <span className="text-xs text-white/50">
                            {msg.senderType === 'ai' ? 'Nexik AI' : 
                             msg.senderType === 'visitor' ? 'Посетитель' : 
                             msg.senderName || 'Оператор'}
                          </span>
                          <span className="text-[10px] text-white/30">
                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-white/90 whitespace-pre-wrap text-[15px] leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-white/10"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendReply()}
                    placeholder="Написать ответ..."
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sendingReply || !replyText.trim()}
                    className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-cyan-400 text-black rounded-xl font-medium hover:from-cyan-400 hover:to-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {selectedConversation.source === 'telegram' && (
                  <p className="text-[11px] text-white/30 mt-2 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    Ответ будет отправлен в Telegram
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
