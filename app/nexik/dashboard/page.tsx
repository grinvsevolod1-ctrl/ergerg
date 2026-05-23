"use client"

import { useEffect, useState } from "react"
import { 
  MessageSquare, 
  Users, 
  TrendingUp,
  Instagram,
  Plus
} from "lucide-react"
import Link from "next/link"

interface Stats {
  totalChats: number
  activeToday: number
  avgResponseTime: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    activeToday: 0,
    avgResponseTime: "0s"
  })
  const [integrations, setIntegrations] = useState<string[]>([])

  useEffect(() => {
    // TODO: Load real stats from API
    setStats({
      totalChats: 0,
      activeToday: 0,
      avgResponseTime: "-"
    })
  }, [])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-white/50 mt-1">Обзор вашего AI-ассистента</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          icon={MessageSquare}
          label="Всего диалогов"
          value={stats.totalChats}
        />
        <StatCard 
          icon={Users}
          label="Активных сегодня"
          value={stats.activeToday}
        />
        <StatCard 
          icon={TrendingUp}
          label="Среднее время ответа"
          value={stats.avgResponseTime}
        />
      </div>

      {/* Integrations */}
      <div className="bg-zinc-900 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Интеграции</h2>
        </div>

        {integrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Instagram className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50 mb-4">Нет подключенных интеграций</p>
            <Link
              href="/nexik/connect/instagram"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Подключить Instagram
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div 
                key={integration}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
              >
                <Instagram className="w-5 h-5" />
                <span>{integration}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/nexik/dashboard/chats"
          className="flex items-center gap-4 p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-blue-400 transition-colors">Диалоги</h3>
            <p className="text-sm text-white/50">Просмотр всех чатов</p>
          </div>
        </Link>

        <Link
          href="/nexik/dashboard/settings"
          className="flex items-center gap-4 p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-purple-400 transition-colors">Настройки</h3>
            <p className="text-sm text-white/50">Настройка AI-ассистента</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType
  label: string
  value: string | number 
}) {
  return (
    <div className="bg-zinc-900 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white/70" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-white/50">{label}</p>
    </div>
  )
}
