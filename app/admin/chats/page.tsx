"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  MessageSquare, 
  Search, 
  Filter,
  RefreshCw,
  Bot,
  Globe,
  Send as TelegramIcon,
  ChevronRight,
  Clock,
  User,
  Headphones,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"

interface ChatSession {
  id: string
  user_type: 'website' | 'telegram'
  telegram_username?: string
  telegram_name?: string
  operator_connected: boolean
  created_at: string
  last_activity: string
  message_count: number
  last_message?: string
  unread_count: number
}

interface ChatStats {
  totalSessions: number
  activeSessions: number
  totalMessages: number
  todaySessions: number
  operatorConnectedSessions: number
}

export default function ChatsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [stats, setStats] = useState<ChatStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    userType: 'all',
    operatorConnected: 'all',
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filters.userType !== 'all') {
        params.set('userType', filters.userType)
      }
      if (filters.operatorConnected !== 'all') {
        params.set('operatorConnected', filters.operatorConnected)
      }
      if (filters.search) {
        params.set('search', filters.search)
      }

      const response = await fetch(`/api/admin/chats?${params}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chats?stats=true', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    fetchStats()
  }, [fetchSessions, fetchStats])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions()
      fetchStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchSessions, fetchStats])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'сейчас'
    if (minutes < 60) return `${minutes}м`
    if (hours < 24) return `${hours}ч`
    if (days < 7) return `${days}д`
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const getSessionName = (session: ChatSession) => {
    if (session.telegram_name) return session.telegram_name
    if (session.telegram_username) return `@${session.telegram_username}`
    return `Посетитель #${session.id.slice(0, 6)}`
  }

  const clearFilters = () => {
    setFilters({ userType: 'all', operatorConnected: 'all', search: '' })
    setPage(1)
  }

  const hasActiveFilters = filters.userType !== 'all' || filters.operatorConnected !== 'all' || filters.search

  return (
    <div className="space-y-8">
      <PageHeader
        title="Чаты"
        description="История диалогов с клиентами"
        onRefresh={() => { fetchSessions(); fetchStats() }}
        loading={loading}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Всего чатов"
            value={stats.totalSessions}
            icon={MessageSquare}
            color="primary"
          />
          <StatsCard
            title="Активных"
            value={stats.activeSessions}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Сообщений"
            value={stats.totalMessages}
            icon={MessageSquare}
            color="blue"
          />
          <StatsCard
            title="Сегодня"
            value={stats.todaySessions}
            icon={User}
            color="purple"
          />
          <StatsCard
            title="С оператором"
            value={stats.operatorConnectedSessions}
            icon={Headphones}
            color="orange"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Поиск по имени или ID..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && fetchSessions()}
              className="w-full bg-[#111] border border-[#222] rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-[#555] focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "border-[#222] bg-transparent",
                showFilters && "bg-[#222] border-[#333]"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 bg-cyan-400 rounded-full" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="text-[#888] hover:text-white"
              >
                <X className="w-4 h-4 mr-2" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#222]">
            <div>
              <label className="text-xs text-[#888] uppercase tracking-wider block mb-2">Источник</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'website', label: 'Сайт', icon: Globe },
                  { value: 'telegram', label: 'Telegram', icon: TelegramIcon },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilters(f => ({ ...f, userType: option.value })); setPage(1) }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                      filters.userType === option.value
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                    )}
                  >
                    {option.icon && <option.icon className="w-4 h-4" />}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-[#888] uppercase tracking-wider block mb-2">Статус</label>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'Все' },
                  { value: 'true', label: 'С оператором' },
                  { value: 'false', label: 'Только бот' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setFilters(f => ({ ...f, operatorConnected: option.value })); setPage(1) }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-colors",
                      filters.operatorConnected === option.value
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
        {loading && sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-[#888]">Загрузка чатов...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#555]" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Нет чатов</p>
            <p className="text-sm text-[#888]">
              {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Чаты появятся когда пользователи начнут общение'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/admin/chats/${session.id}`}
                className="flex items-center gap-4 p-5 hover:bg-[#111]/50 transition-colors group"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    session.user_type === 'telegram' 
                      ? "bg-blue-500/20 group-hover:bg-blue-500/30" 
                      : "bg-cyan-500/20 group-hover:bg-cyan-500/30"
                  )}>
                    {session.user_type === 'telegram' ? (
                      <TelegramIcon className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Globe className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  {session.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold text-white flex items-center justify-center">
                      {session.unread_count > 9 ? '9+' : session.unread_count}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-white truncate group-hover:text-cyan-400 transition-colors">
                      {getSessionName(session)}
                    </span>
                    {session.operator_connected ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400">
                        <Headphones className="w-3 h-3" />
                        Оператор
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#222] border border-[#333] rounded-lg text-xs text-[#888]">
                        <Bot className="w-3 h-3" />
                        Бот
                      </span>
                    )}
                  </div>
                  {session.last_message && (
                    <p className="text-sm text-[#888] truncate">
                      {session.last_message}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-[#555] tabular-nums">
                    {formatTime(session.last_activity)}
                  </span>
                  <span className="text-xs text-[#555]">
                    {session.message_count} сообщ.
                  </span>
                </div>

                <ChevronRight className="w-5 h-5 text-[#333] group-hover:text-[#555] transition-colors" />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#1a1a1a]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[#888] hover:text-white"
            >
              Назад
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === pageNum
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-[#888] hover:text-white hover:bg-[#222]"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[#888] hover:text-white"
            >
              Далее
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
