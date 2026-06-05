"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  MessageSquare,
  UserCheck,
  ArrowUpRight,
  ArrowRight,
  Activity,
  Clock,
  Target
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { StatsCard } from "@/components/admin/stats-card"
import { PageHeader } from "@/components/admin/page-header"

interface DashboardData {
  stats: {
    totalChats: number
    totalLeads: number
    totalEmails: number
    conversionRate: number
    todayChats: number
    todayLeads: number
    weekChats: number
    weekLeads: number
  }
  recentActivity: {
    type: 'chat' | 'lead' | 'email'
    title: string
    description: string
    time: string
    status?: string
  }[]
  campaigns: {
    id: string
    name: string
    status: string
    sent_count: number
    total_recipients: number
    opened_count: number
  }[]
  queueStats: {
    waiting: number
    active: number
    completed: number
    failed: number
  } | null
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    try {
      const [mailingsRes, chatsRes, leadsRes] = await Promise.all([
        fetch("/api/admin/mailings", { credentials: 'include' }),
        fetch("/api/admin/chats?stats=true", { credentials: 'include' }),
        fetch("/api/admin/leads?stats=true", { credentials: 'include' }),
      ])

      const [mailings, chats, leads] = await Promise.all([
        mailingsRes.ok ? mailingsRes.json() : { campaigns: [], queueStats: null },
        chatsRes.ok ? chatsRes.json() : { totalSessions: 0, todaySessions: 0 },
        leadsRes.ok ? leadsRes.json() : { total: 0, todayCount: 0 },
      ])

      const totalEmails = mailings.campaigns?.reduce((sum: number, c: { sent_count: number }) => sum + c.sent_count, 0) || 0

      setData({
        stats: {
          totalChats: chats.totalSessions || 0,
          totalLeads: leads.total || 0,
          totalEmails,
          conversionRate: chats.totalSessions > 0 
            ? Math.round((leads.total / chats.totalSessions) * 100) 
            : 0,
          todayChats: chats.todaySessions || 0,
          todayLeads: leads.todayCount || 0,
          weekChats: chats.totalSessions || 0,
          weekLeads: leads.weekCount || 0,
        },
        recentActivity: [],
        campaigns: mailings.campaigns || [],
        queueStats: mailings.queueStats,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      if (!silent) toast.error('Не удалось загрузить данные дашборда')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Обзор системы и ключевые метрики"
        onRefresh={() => fetchData()}
        loading={loading}
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Всего чатов"
          value={data?.stats.totalChats || 0}
          icon={MessageSquare}
          color="primary"
          trend={data?.stats.todayChats ? { value: data.stats.todayChats, isPositive: true } : undefined}
          subtitle={`+${data?.stats.todayChats || 0} сегодня`}
        />
        <StatsCard
          title="Всего лидов"
          value={data?.stats.totalLeads || 0}
          icon={UserCheck}
          color="green"
          trend={data?.stats.todayLeads ? { value: data.stats.todayLeads, isPositive: true } : undefined}
          subtitle={`+${data?.stats.todayLeads || 0} сегодня`}
        />
        <StatsCard
          title="Писем отправлено"
          value={data?.stats.totalEmails || 0}
          icon={Send}
          color="blue"
        />
        <StatsCard
          title="Конверсия"
          value={`${data?.stats.conversionRate || 0}%`}
          icon={Target}
          color="purple"
          subtitle="Чаты → Лиды"
        />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Email Queue Status */}
        <div className="lg:col-span-2 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">Очередь рассылок</h2>
              <p className="text-xs sm:text-sm text-[#888]">Статус обработки писем</p>
            </div>
            <Link href="/admin/mailings">
              <Button variant="ghost" size="sm" className="text-[#888] hover:text-white">
                Управление
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {data?.queueStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-[#888] uppercase tracking-wider">Ожидание</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-amber-400">{data.queueStats.waiting}</div>
              </div>
              <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-[10px] sm:text-xs text-[#888] uppercase tracking-wider">Активные</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-blue-400">{data.queueStats.active}</div>
              </div>
              <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400 rounded-full" />
                  <span className="text-[10px] sm:text-xs text-[#888] uppercase tracking-wider">Готово</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-emerald-400">{data.queueStats.completed}</div>
              </div>
              <div className="bg-[#111] rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#1a1a1a]">
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full" />
                  <span className="text-[10px] sm:text-xs text-[#888] uppercase tracking-wider">Ошибки</span>
                </div>
                <div className="text-lg sm:text-2xl font-bold text-red-400">{data.queueStats.failed}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-[#888]">
              <Activity className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Очередь не активна</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Быстрые действия</h2>
          <div className="space-y-3">
            <Link href="/admin/mailings" className="block">
              <div className="flex items-center gap-4 p-4 bg-[#111] hover:bg-[#151515] border border-[#1a1a1a] rounded-xl transition-all group">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                    Создать рассылку
                  </div>
                  <div className="text-xs text-[#888]">Новая email кампания</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#555] group-hover:text-cyan-400 transition-colors" />
              </div>
            </Link>
            
            <Link href="/admin/chats" className="block">
              <div className="flex items-center gap-4 p-4 bg-[#111] hover:bg-[#151515] border border-[#1a1a1a] rounded-xl transition-all group">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white group-hover:text-emerald-400 transition-colors">
                    Открыть чаты
                  </div>
                  <div className="text-xs text-[#888]">
                    {data?.stats.todayChats || 0} новых сегодня
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#555] group-hover:text-emerald-400 transition-colors" />
              </div>
            </Link>
            
            <Link href="/admin/leads" className="block">
              <div className="flex items-center gap-4 p-4 bg-[#111] hover:bg-[#151515] border border-[#1a1a1a] rounded-xl transition-all group">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-violet-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-white group-hover:text-violet-400 transition-colors">
                    Новые лиды
                  </div>
                  <div className="text-xs text-[#888]">
                    {data?.stats.todayLeads || 0} ожидают обработки
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#555] group-hover:text-violet-400 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-lg font-semibold text-white">Последние рассылки</h2>
            <p className="text-sm text-[#888]">Статус email кампаний</p>
          </div>
          <Link href="/admin/mailings">
            <Button variant="ghost" size="sm" className="text-[#888] hover:text-white">
              Все рассылки
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {!data?.campaigns || data.campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#888]">
            <Mail className="w-10 h-10 mb-3 opacity-50" />
            <p className="font-medium text-white">Нет рассылок</p>
            <p className="text-sm">Создайте первую рассылку для начала работы</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[#888] text-xs uppercase tracking-wider border-b border-[#1a1a1a]">
                  <th className="px-6 py-4 font-semibold">Кампания</th>
                  <th className="px-6 py-4 font-semibold">Статус</th>
                  <th className="px-6 py-4 font-semibold">Прогресс</th>
                  <th className="px-6 py-4 font-semibold">Открытия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {data.campaigns.slice(0, 5).map((campaign) => {
                  const progress = campaign.total_recipients > 0
                    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
                    : 0

                  return (
                    <tr key={campaign.id} className="hover:bg-[#111] transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{campaign.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <CampaignStatus status={campaign.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-[#888] tabular-nums">
                            {campaign.sent_count}/{campaign.total_recipients}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-white">{campaign.opened_count}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function CampaignStatus({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: typeof CheckCircle }> = {
    draft: { label: "Черновик", className: "text-[#888] bg-[#222]", icon: Clock },
    scheduled: { label: "Запланировано", className: "text-blue-400 bg-blue-500/10", icon: Clock },
    sending: { label: "Отправка", className: "text-amber-400 bg-amber-500/10", icon: Send },
    paused: { label: "Пауза", className: "text-orange-400 bg-orange-500/10", icon: Clock },
    completed: { label: "Завершено", className: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle },
    failed: { label: "Ошибка", className: "text-red-400 bg-red-500/10", icon: XCircle },
  }

  const { label, className, icon: Icon } = config[status] || config.draft

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      className
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}
