"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useNexikEvents } from "@/lib/nexik/hooks/useNexikEvents"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { 
  MessageSquare, 
  Users, 
  BookOpen, 
  ArrowUpRight,
  Clock,
  TrendingUp,
  Calendar,
  Send,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalConversations: number
  todayConversations: number
  totalMessages: number
  leadsCollected: number
  appointmentsBooked: number
  avgResponseTime: string
  aiWorkingHours: number
}

interface RecentChat {
  id: string
  visitor: string
  lastMessage: string
  time: string
  status: "ai" | "waiting" | "resolved"
}

export default function NexikDashboardPage() {
  const { session, isLoading: authLoading } = useNexikAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])

  const orgId = session?.org?.id || ''

  // Handle new message from SSE
  const handleNewMessage = useCallback((data: { conversationId: string; message: unknown }) => {
    const msg = data.message as { content: string }
    setRecentChats(prev => {
      const existing = prev.find(c => c.id === data.conversationId)
      if (existing) {
        return prev.map(c => 
          c.id === data.conversationId 
            ? { ...c, lastMessage: msg.content, time: 'сейчас', status: 'waiting' as const }
            : c
        )
      }
      return prev
    })
    setStats(prev => prev ? { ...prev, todayConversations: prev.todayConversations + 1 } : prev)
  }, [])

  // Handle new conversation from SSE
  const handleNewConversation = useCallback((data: { conversationId: string; visitor: unknown }) => {
    const visitor = data.visitor as { name?: string }
    setRecentChats(prev => [{
      id: data.conversationId,
      visitor: visitor?.name || 'Новый посетитель',
      lastMessage: 'Начал диалог...',
      time: 'сейчас',
      status: 'ai' as const
    }, ...prev.slice(0, 9)])
    setStats(prev => prev ? { ...prev, totalConversations: prev.totalConversations + 1 } : prev)
  }, [])

  // Real-time events
  const { isConnected } = useNexikEvents({
    orgId,
    onMessage: handleNewMessage,
    onNewConversation: handleNewConversation,
    enabled: !!orgId
  })

  const loadStats = useCallback(async () => {
    if (!orgId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/nexik/dashboard/stats')
      const data = await res.json()
      
      if (data.success) {
        setStats(data.stats)
        setRecentChats(data.recentChats || [])
      } else {
        setError(data.error || 'Ошибка загрузки')
      }
    } catch {
      setError('Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (orgId) {
      loadStats()
    }
  }, [orgId, loadStats])

  // Show loading while auth is checking
  if (authLoading) {
    return <DashboardSkeleton />
  }

  const statCards = [
    {
      title: "Диалогов сегодня",
      value: stats?.todayConversations ?? 0,
      change: "+23%",
      icon: MessageSquare,
      accent: "#00ffff",
    },
    {
      title: "Собрано лидов",
      value: stats?.leadsCollected ?? 0,
      change: "+12%",
      icon: UserPlus,
      accent: "#00ff88",
    },
    {
      title: "Записей на встречу",
      value: stats?.appointmentsBooked ?? 0,
      change: "+5",
      icon: Calendar,
      accent: "#ff00aa",
    },
    {
      title: "Время ответа",
      value: stats?.avgResponseTime ?? "—",
      change: "мгновенно",
      icon: Clock,
      accent: "#ffaa00",
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {session?.member?.name ? `Привет, ${session.member.name.split(' ')[0]}!` : 'Добро пожаловать!'}
            </h1>
            <p className="text-sm sm:text-base text-[#888]">
              {session?.org?.name} — Nexik работает и обрабатывает заявки
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl border",
              isConnected 
                ? 'bg-[#00ff88]/10 border-[#00ff88]/20' 
                : 'bg-[#ffaa00]/10 border-[#ffaa00]/20'
            )}>
              <div className={cn(
                "w-2 h-2 rounded-full animate-pulse",
                isConnected ? 'bg-[#00ff88]' : 'bg-[#ffaa00]'
              )} />
              <span className={cn(
                "text-sm font-medium",
                isConnected ? 'text-[#00ff88]' : 'text-[#ffaa00]'
              )}>
                {isConnected ? 'Live' : 'Connecting...'}
              </span>
            </div>
            <Link href="/nexik/dashboard/chats">
              <Button className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90">
                <MessageSquare className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Открыть чаты</span>
                <span className="sm:hidden">Чаты</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadStats}
            className="text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Повторить
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((stat) => (
          <div 
            key={stat.title}
            className="group relative rounded-xl sm:rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300 hover:border-[#2a2a3e]"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-[#888] truncate">
                  {stat.title}
                </p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-2 bg-white/10" />
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2" style={{ color: stat.accent }}>
                    {stat.value}
                  </p>
                )}
                <p className="text-[10px] sm:text-xs text-[#00ff88] mt-1 flex items-center gap-1">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="truncate">{stat.change}</span>
                </p>
              </div>
              <div 
                className="p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 flex-shrink-0"
                style={{ background: `${stat.accent}15`, color: stat.accent }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Recent chats */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1a1a2e] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-[#00ffff]" />
              <h2 className="text-lg font-semibold">Последние диалоги</h2>
            </div>
            <Link href="/nexik/dashboard/chats" className="text-sm text-[#00ffff] hover:underline">
              Все чаты
            </Link>
          </div>
          
          {loading ? (
            <div className="divide-y divide-[#1a1a2e]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                    <Skeleton className="h-3 w-48 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentChats.length > 0 ? (
            <div className="divide-y divide-[#1a1a2e]">
              {recentChats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/nexik/dashboard/chats/${chat.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-[#888]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{chat.visitor}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-medium flex-shrink-0",
                        chat.status === "ai" && "bg-[#00ffff]/10 text-[#00ffff]",
                        chat.status === "waiting" && "bg-[#ffaa00]/10 text-[#ffaa00]",
                        chat.status === "resolved" && "bg-[#00ff88]/10 text-[#00ff88]",
                      )}>
                        {chat.status === "ai" && "AI отвечает"}
                        {chat.status === "waiting" && "Ждёт вас"}
                        {chat.status === "resolved" && "Завершён"}
                      </span>
                    </div>
                    <p className="text-sm text-[#888] truncate">{chat.lastMessage}</p>
                  </div>
                  <div className="text-xs text-[#555] flex-shrink-0 hidden sm:block">{chat.time}</div>
                  <ArrowUpRight className="w-4 h-4 text-[#555] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#888]">Пока нет диалогов</p>
              <p className="text-sm text-[#555]">Nexik начнёт отвечать как только появятся посетители</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* AI Performance */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <NetNextLogo size={20} />
              <h2 className="font-semibold">Nexik за неделю</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Отработано часов</span>
                {loading ? (
                  <Skeleton className="h-5 w-12 bg-white/10" />
                ) : (
                  <span className="font-bold text-[#00ffff]">{stats?.aiWorkingHours ?? 0}ч</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Всего сообщений</span>
                {loading ? (
                  <Skeleton className="h-5 w-12 bg-white/10" />
                ) : (
                  <span className="font-bold">{stats?.totalMessages ?? 0}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Всего диалогов</span>
                {loading ? (
                  <Skeleton className="h-5 w-12 bg-white/10" />
                ) : (
                  <span className="font-bold">{stats?.totalConversations ?? 0}</span>
                )}
              </div>
              
              <div className="pt-4 border-t border-[#1a1a2e]">
                <div className="flex items-center gap-2 text-[#00ff88]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">AI справляется отлично</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-4 sm:p-6">
            <h2 className="font-semibold mb-4">Быстрые действия</h2>
            
            <div className="space-y-2">
              <Link
                href="/nexik/dashboard/knowledge"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00ff88]/10 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-[#00ff88]" />
                </div>
                <span className="text-sm">Обновить базу знаний</span>
                <ArrowUpRight className="w-4 h-4 text-[#555] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                href="/nexik/dashboard/schedule"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ffaa00]/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#ffaa00]" />
                </div>
                <span className="text-sm">Настроить расписание</span>
                <ArrowUpRight className="w-4 h-4 text-[#555] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                href="/nexik/dashboard/widget"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#ff00aa]/10 flex items-center justify-center">
                  <Send className="w-4 h-4 text-[#ff00aa]" />
                </div>
                <span className="text-sm">Получить код виджета</span>
                <ArrowUpRight className="w-4 h-4 text-[#555] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 bg-white/10 mb-2" />
        <Skeleton className="h-5 w-48 bg-white/10" />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6">
            <Skeleton className="h-4 w-24 bg-white/10 mb-2" />
            <Skeleton className="h-8 w-16 bg-white/10" />
          </div>
        ))}
      </div>
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6">
          <Skeleton className="h-6 w-40 bg-white/10 mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-t border-[#1a1a2e] first:border-0">
              <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 bg-white/10 mb-2" />
                <Skeleton className="h-3 w-48 bg-white/10" />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6">
            <Skeleton className="h-6 w-32 bg-white/10 mb-4" />
            <Skeleton className="h-4 w-full bg-white/10 mb-2" />
            <Skeleton className="h-4 w-full bg-white/10 mb-2" />
            <Skeleton className="h-4 w-full bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  )
}
