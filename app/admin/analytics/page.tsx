"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  BarChart3, 
  TrendingUp,
  Users,
  MessageSquare,
  Monitor,
  Smartphone,
  Tablet,
  ArrowUpRight,
  Target,
  Globe,
  Eye,
  MousePointer,
  Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"

interface AnalyticsData {
  generator: {
    totalGenerations: number
    completedGenerations: number
    failedGenerations: number
    orderClicks: number
    avgVariantsViewed: number
    topNiches: { niche: string; count: number }[]
  }
  chartData: { date: string; leads: number; chats: number; generations: number }[]
  rates: {
    conversion: string
    completion: string
  }
  devices: { device: string; count: number }[]
  sources: { source: string; count: number }[]
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/analytics?days=${period}`, {
        credentials: 'include',
      })

      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const chartMax = data?.chartData 
    ? Math.max(...data.chartData.flatMap(d => [d.leads, d.chats, d.generations]), 1)
    : 1

  const totalLeads = data?.chartData.reduce((sum, d) => sum + d.leads, 0) || 0
  const totalChats = data?.chartData.reduce((sum, d) => sum + d.chats, 0) || 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Аналитика"
          description="Статистика генератора и активности"
          onRefresh={fetchData}
          loading={loading}
        />

        {/* Period Selector */}
        <div className="flex gap-2 p-1.5 bg-[#111] rounded-xl border border-[#1a1a1a]">
          {[
            { value: 7, label: '7 дней' },
            { value: 30, label: '30 дней' },
            { value: 90, label: '90 дней' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                period === option.value
                  ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-[#888] hover:text-white"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-3" />
          <p className="text-[#888]">Загрузка данных...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Генераций"
              value={data.generator.totalGenerations}
              icon={BarChart3}
              color="primary"
              trend={data.rates.completion ? { value: parseFloat(data.rates.completion), isPositive: true } : undefined}
              subtitle={`${data.rates.completion}% завершено`}
            />
            <StatsCard
              title="Кликов на заказ"
              value={data.generator.orderClicks}
              icon={MousePointer}
              color="green"
              trend={data.rates.conversion ? { value: parseFloat(data.rates.conversion), isPositive: true } : undefined}
              subtitle={`${data.rates.conversion}% конверсия`}
            />
            <StatsCard
              title="Лидов"
              value={totalLeads}
              icon={Users}
              color="blue"
              subtitle={`За ${period} дней`}
            />
            <StatsCard
              title="Чатов"
              value={totalChats}
              icon={MessageSquare}
              color="purple"
              subtitle={`За ${period} дней`}
            />
          </div>

          {/* Main Chart */}
          <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Динамика за период</h3>
                <p className="text-sm text-[#888]">Генерации, лиды и чаты</p>
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" />
                  <span className="text-xs text-[#888]">Генерации</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-[#888]">Лиды</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-violet-500" />
                  <span className="text-xs text-[#888]">Чаты</span>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="flex items-end gap-1 h-48">
              {data.chartData.slice(-14).map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex gap-0.5 items-end h-40">
                    <div 
                      className="flex-1 bg-gradient-to-t from-cyan-500 to-teal-500 rounded-t-sm transition-all hover:opacity-80"
                      style={{ height: `${Math.max((d.generations / chartMax) * 100, d.generations > 0 ? 4 : 0)}%` }}
                      title={`${d.generations} генераций`}
                    />
                    <div 
                      className="flex-1 bg-blue-500 rounded-t-sm transition-all hover:opacity-80"
                      style={{ height: `${Math.max((d.leads / chartMax) * 100, d.leads > 0 ? 4 : 0)}%` }}
                      title={`${d.leads} лидов`}
                    />
                    <div 
                      className="flex-1 bg-violet-500 rounded-t-sm transition-all hover:opacity-80"
                      style={{ height: `${Math.max((d.chats / chartMax) * 100, d.chats > 0 ? 4 : 0)}%` }}
                      title={`${d.chats} чатов`}
                    />
                  </div>
                  <span className="text-[10px] text-[#555] whitespace-nowrap">
                    {formatDate(d.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Niches */}
            <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Популярные ниши</h3>
              </div>
              <div className="space-y-4">
                {data.generator.topNiches.length === 0 ? (
                  <p className="text-sm text-[#555]">Нет данных</p>
                ) : (
                  data.generator.topNiches.slice(0, 5).map((niche, i) => {
                    const maxCount = data.generator.topNiches[0]?.count || 1
                    const percentage = (niche.count / maxCount) * 100

                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white truncate flex-1 mr-3">
                            {niche.niche || 'Не указано'}
                          </span>
                          <span className="text-sm text-cyan-400 font-medium tabular-nums">
                            {niche.count}
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Monitor className="w-5 h-5 text-violet-400" />
                <h3 className="font-semibold text-white">Устройства</h3>
              </div>
              <div className="space-y-4">
                {data.devices.length === 0 ? (
                  <p className="text-sm text-[#555]">Нет данных</p>
                ) : (
                  data.devices.map((d, i) => {
                    const Icon = getDeviceIcon(d.device)
                    const total = data.devices.reduce((sum, x) => sum + x.count, 0)
                    const percent = total > 0 ? ((d.count / total) * 100).toFixed(0) : '0'
                    
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-white capitalize">{d.device}</span>
                            <span className="text-[#888] tabular-nums">{percent}%</span>
                          </div>
                          <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Sources */}
            <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Globe className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-white">Источники трафика</h3>
              </div>
              <div className="space-y-3">
                {data.sources.length === 0 ? (
                  <p className="text-sm text-[#555]">Нет данных</p>
                ) : (
                  data.sources.slice(0, 5).map((s, i) => {
                    const total = data.sources.reduce((sum, x) => sum + x.count, 0)
                    const percent = total > 0 ? ((s.count / total) * 100).toFixed(0) : '0'
                    
                    return (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3 bg-[#111] border border-[#1a1a1a] rounded-xl hover:border-[#333] transition-colors"
                      >
                        <span className="text-sm text-white">{s.source || 'Прямой'}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-[#888] tabular-nums">{s.count}</span>
                          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                            {percent}%
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Статистика генератора</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="text-2xl font-bold text-white">{data.generator.completedGenerations}</div>
                  <div className="text-xs text-[#888]">Завершённых</div>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="text-2xl font-bold text-red-400">{data.generator.failedGenerations}</div>
                  <div className="text-xs text-[#888]">Незавершённых</div>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="text-2xl font-bold text-cyan-400">{data.generator.avgVariantsViewed.toFixed(1)}</div>
                  <div className="text-xs text-[#888]">Вариантов просмотрено</div>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4">
                  <div className="text-2xl font-bold text-emerald-400">{data.rates.conversion}%</div>
                  <div className="text-xs text-[#888]">Конверсия в клик</div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="font-semibold text-white mb-4">Воронка конверсии</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-full">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white">Генерации</span>
                      <span className="text-[#888]">{data.generator.totalGenerations}</span>
                    </div>
                    <div className="h-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white">Завершённые</span>
                      <span className="text-[#888]">{data.generator.completedGenerations}</span>
                    </div>
                    <div 
                      className="h-3 bg-blue-500 rounded-full"
                      style={{ 
                        width: `${data.generator.totalGenerations > 0 
                          ? (data.generator.completedGenerations / data.generator.totalGenerations) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white">Клики на заказ</span>
                      <span className="text-[#888]">{data.generator.orderClicks}</span>
                    </div>
                    <div 
                      className="h-3 bg-emerald-500 rounded-full"
                      style={{ 
                        width: `${data.generator.totalGenerations > 0 
                          ? (data.generator.orderClicks / data.generator.totalGenerations) * 100 
                          : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-[#888]">
          <BarChart3 className="w-12 h-12 mb-3 opacity-50" />
          <p>Не удалось загрузить данные</p>
        </div>
      )}
    </div>
  )
}
