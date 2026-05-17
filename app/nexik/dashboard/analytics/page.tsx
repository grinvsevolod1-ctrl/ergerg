"use client"

import { useEffect, useState } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { BarChart3, Users, Bot, TrendingUp, MessageSquare, Clock, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsData {
  overview: {
    totalConversations: number
    totalMessages: number
    aiResponses: number
    operatorResponses: number
    avgResponseTime: number
    uniqueVisitors: number
  }
  trends: {
    conversationsChange: number
    messagesChange: number
  }
  dailyStats: Array<{
    date: string
    conversations: number
    messages: number
  }>
  popularTopics: Array<{
    topic: string
    count: number
    percent: number
  }>
}

export default function AnalyticsPage() {
  const { session } = useNexikAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    const loadAnalytics = async () => {
      if (!session?.org?.id) return
      
      setLoading(true)
      try {
        const res = await fetch(`/api/nexik/dashboard/analytics?period=${period}`)
        const result = await res.json()
        
        if (result.success) {
          setData(result.data)
        }
      } catch (err) {
        console.error('Failed to load analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadAnalytics()
  }, [session?.org?.id, period])

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(0)}%`
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-2xl bg-white/10" />
          <Skeleton className="h-80 rounded-2xl bg-white/10" />
        </div>
      </div>
    )
  }

  const stats = data ? [
    { 
      label: "Всего диалогов", 
      value: formatNumber(data.overview.totalConversations), 
      change: formatChange(data.trends.conversationsChange),
      positive: data.trends.conversationsChange >= 0,
      accent: "#00ffff" 
    },
    { 
      label: "AI ответов", 
      value: formatNumber(data.overview.aiResponses), 
      change: formatChange(data.trends.messagesChange),
      positive: data.trends.messagesChange >= 0,
      accent: "#00ff88" 
    },
    { 
      label: "Передано операторам", 
      value: formatNumber(data.overview.operatorResponses), 
      change: "-",
      positive: true,
      accent: "#ff00aa" 
    },
    { 
      label: "Уникальных посетителей", 
      value: formatNumber(data.overview.uniqueVisitors), 
      change: "-",
      positive: true,
      accent: "#ffaa00" 
    },
  ] : []

  const topics = data?.popularTopics || []

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Аналитика</h1>
          <p className="text-[#888] mt-1">
            Статистика использования AI-чата
          </p>
        </div>
        
        {/* Period selector */}
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p 
                  ? 'bg-[#00ffff] text-black' 
                  : 'bg-[#1a1a2e] text-white hover:bg-[#2a2a3e]'
              }`}
            >
              {p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : '90 дней'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-[#2a2a3e]"
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-50"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)` }}
            />
            <p className="text-sm text-[#888]">{stat.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-3xl font-bold" style={{ color: stat.accent }}>{stat.value}</p>
              {stat.change !== '-' && (
                <p className={`text-sm ${stat.positive ? "text-[#00ff88]" : "text-red-400"}`}>
                  {stat.change}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily chart */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-[#00ffff]" />
              <h2 className="text-lg font-semibold">Диалоги по дням</h2>
            </div>
            <p className="text-sm text-[#888] mt-1">
              {period === '7d' ? 'Последние 7 дней' : period === '30d' ? 'Последние 30 дней' : 'Последние 90 дней'}
            </p>
          </div>
          <div className="p-6">
            {data?.dailyStats && data.dailyStats.length > 0 ? (
              <div className="h-64 flex items-end gap-1">
                {data.dailyStats.slice(-14).map((day, i) => {
                  const maxConv = Math.max(...data.dailyStats.map(d => d.conversations), 1)
                  const height = (day.conversations / maxConv) * 100
                  return (
                    <div 
                      key={i} 
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div 
                        className="w-full rounded-t transition-all hover:opacity-80"
                        style={{ 
                          height: `${Math.max(height, 4)}%`,
                          background: 'linear-gradient(180deg, #00ffff 0%, #00ffff40 100%)',
                          boxShadow: '0 0 10px #00ffff30'
                        }}
                        title={`${day.date}: ${day.conversations} диалогов`}
                      />
                      {i % 2 === 0 && (
                        <span className="text-[10px] text-[#555]">
                          {new Date(day.date).getDate()}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div 
                className="h-64 rounded-xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 255, 255, 0.03) 0%, rgba(255, 0, 170, 0.03) 100%)",
                }}
              >
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-[#333] mx-auto mb-3" />
                  <p className="text-[#555]">Нет данных за выбранный период</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Popular topics */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#00ffff]" />
              <h2 className="text-lg font-semibold">Популярные темы</h2>
            </div>
            <p className="text-sm text-[#888] mt-1">О чём спрашивают чаще всего</p>
          </div>
          <div className="p-6">
            {topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((item, i) => {
                  const colors = ['#00ffff', '#00ff88', '#ff00aa', '#ffaa00', '#aa00ff']
                  const accent = colors[i % colors.length]
                  return (
                    <div key={item.topic}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{item.topic}</span>
                        <span className="text-sm text-[#888]">{item.count}</span>
                      </div>
                      <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${item.percent}%`,
                            background: accent,
                            boxShadow: `0 0 10px ${accent}50`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-[#333] mx-auto mb-3" />
                  <p className="text-[#555]">Недостаточно данных для анализа</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          { 
            icon: Users, 
            label: "Уникальных пользователей", 
            value: data ? formatNumber(data.overview.uniqueVisitors) : '0', 
            accent: "#00ffff" 
          },
          { 
            icon: MessageSquare, 
            label: "Всего сообщений", 
            value: data ? formatNumber(data.overview.totalMessages) : '0', 
            accent: "#00ff88" 
          },
          { 
            icon: Clock, 
            label: "Среднее время ответа", 
            value: data ? `${(data.overview.avgResponseTime / 1000).toFixed(1)}с` : '-', 
            accent: "#ff00aa" 
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm p-5"
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-xl"
                style={{ background: `${item.accent}15`, color: item.accent }}
              >
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: item.accent }}>{item.value}</p>
                <p className="text-sm text-[#888]">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
