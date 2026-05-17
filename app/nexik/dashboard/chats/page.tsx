"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { useNexikEvents } from "@/lib/nexik/hooks/useNexikEvents"
import { 
  MessageSquare, 
  User, 
  Bot, 
  Clock, 
  Search,
  Filter,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Archive,
  Inbox,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Conversation {
  id: string
  visitorId: string
  visitorName: string | null
  visitorEmail: string | null
  status: 'active' | 'pending' | 'resolved' | 'archived'
  messagesCount: number
  unreadCount: number
  lastMessage: string | null
  operatorName: string | null
  country: string | null
  city: string | null
  deviceType: string | null
  createdAt: string
  lastMessageAt: string | null
}

interface Stats {
  total: number
  active: number
  pending: number
  resolved: number
  today: number
  unreadMessages: number
}

const statusConfig = {
  active: { label: "AI отвечает", color: "#00ffff", icon: Bot },
  pending: { label: "Ждёт оператора", color: "#ffaa00", icon: Clock },
  resolved: { label: "Завершён", color: "#00ff88", icon: CheckCircle2 },
  archived: { label: "Архив", color: "#888", icon: Archive },
}

export default function ChatsPage() {
  const { session } = useNexikAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const orgId = session?.org?.id || ''

  // Real-time updates
  const handleNewConversation = useCallback(() => {
    // Refresh list when new conversation starts
    loadConversations()
  }, [])

  const handleNewMessage = useCallback((data: { conversationId: string }) => {
    // Update conversation in list
    setConversations(prev => prev.map(conv => 
      conv.id === data.conversationId 
        ? { ...conv, unreadCount: conv.unreadCount + 1, lastMessageAt: new Date().toISOString() }
        : conv
    ))
  }, [])

  useNexikEvents({
    orgId,
    onNewConversation: handleNewConversation,
    onMessage: handleNewMessage,
    enabled: !!orgId
  })

  const loadConversations = useCallback(async () => {
    if (!orgId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      
      const res = await fetch(`/api/nexik/dashboard/conversations?${params}`)
      const data = await res.json()
      
      if (data.success) {
        setConversations(data.conversations)
        setStats(data.stats)
        setTotalPages(data.pagination.totalPages)
      } else {
        setError(data.error || 'Ошибка загрузки')
      }
    } catch {
      setError('Не удалось загрузить диалоги')
    } finally {
      setLoading(false)
    }
  }, [orgId, page, statusFilter, search])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 1) setPage(1)
      else loadConversations()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return '—'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч`
    return `${Math.floor(diffMins / 1440)} дн`
  }

  const statCards = [
    { icon: Inbox, label: "Всего", value: stats?.total ?? 0, accent: "#888" },
    { icon: Bot, label: "Активных", value: stats?.active ?? 0, accent: "#00ffff" },
    { icon: Clock, label: "Ждут оператора", value: stats?.pending ?? 0, accent: "#ffaa00" },
    { icon: CheckCircle2, label: "Решено", value: stats?.resolved ?? 0, accent: "#00ff88" },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">Диалоги</h1>
        <p className="text-sm sm:text-base text-[#888]">
          История общения с посетителями вашего сайта
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ background: `${stat.accent}15`, color: stat.accent }}
              >
                <stat.icon className="w-4 h-4" />
              </div>
              <div>
                {loading ? (
                  <Skeleton className="h-6 w-8 bg-white/10" />
                ) : (
                  <p className="text-xl font-bold" style={{ color: stat.accent }}>{stat.value}</p>
                )}
                <p className="text-xs text-[#888]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888]" />
          <Input
            placeholder="Поиск по имени, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#0a0a0f] border-[#1a1a2e] focus:border-[#00ffff]/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 bg-[#0a0a0f] border-[#1a1a2e]">
            <Filter className="w-4 h-4 mr-2 text-[#888]" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent className="bg-[#0a0a0f] border-[#1a1a2e]">
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="active">AI отвечает</SelectItem>
            <SelectItem value="pending">Ждут оператора</SelectItem>
            <SelectItem value="resolved">Завершённые</SelectItem>
            <SelectItem value="archived">Архив</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          variant="outline" 
          onClick={loadConversations}
          className="border-[#1a1a2e] hover:bg-white/5"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            const url = `/api/nexik/dashboard/export?format=csv&status=${statusFilter !== 'all' ? statusFilter : ''}`
            window.open(url, '_blank')
          }}
          className="border-[#1a1a2e] hover:bg-white/5 gap-2"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Экспорт</span>
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-400">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadConversations}
            className="ml-auto text-red-400"
          >
            Повторить
          </Button>
        </div>
      )}

      {/* Conversations List */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#1a1a2e]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                  <Skeleton className="h-3 w-48 bg-white/10" />
                </div>
                <Skeleton className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
            ))}
          </div>
        ) : conversations.length > 0 ? (
          <>
            <div className="divide-y divide-[#1a1a2e]">
              {conversations.map((conv) => {
                const status = statusConfig[conv.status]
                const StatusIcon = status.icon
                
                return (
                  <Link
                    key={conv.id}
                    href={`/nexik/dashboard/chats/${conv.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#888]" />
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ff00aa] flex items-center justify-center text-[10px] font-bold">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {conv.visitorName || conv.visitorEmail?.split('@')[0] || `Посетитель ${conv.visitorId.slice(0, 6)}`}
                        </p>
                        {conv.city && (
                          <span className="text-xs text-[#555] hidden sm:inline">
                            {conv.city}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#888] truncate">
                        {conv.lastMessage || 'Нет сообщений'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-[#555]">{formatTimeAgo(conv.lastMessageAt || conv.createdAt)}</p>
                        <p className="text-xs text-[#555]">{conv.messagesCount} сообщ.</p>
                      </div>
                      
                      <div 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ 
                          background: `${status.color}15`, 
                          color: status.color,
                          border: `1px solid ${status.color}30`
                        }}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">{status.label}</span>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-[#555] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#1a1a2e] flex items-center justify-between">
                <p className="text-sm text-[#888]">
                  Страница {page} из {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-[#1a1a2e]"
                  >
                    Назад
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-[#1a1a2e]"
                  >
                    Далее
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-[#888] mb-2">
              {search || statusFilter !== 'all' ? 'Диалоги не найдены' : 'Пока нет диалогов'}
            </p>
            <p className="text-sm text-[#555]">
              {search || statusFilter !== 'all' 
                ? 'Попробуйте изменить фильтры'
                : 'Nexik начнёт общаться с посетителями после установки виджета'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
