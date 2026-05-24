"use client"

import { useEffect, useState } from "react"
import { MessageSquare, Users, TrendingUp } from "lucide-react"
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
    avgResponseTime: "-"
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/nexik/dashboard/stats")
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Dashboard</h1>
        <p className="text-white/50 mt-1">Обзор вашего AI-ассистента</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={MessageSquare} label="Всего диалогов" value={loading ? "..." : stats.totalChats} />
        <StatCard icon={Users} label="Активных сегодня" value={loading ? "..." : stats.activeToday} />
        <StatCard icon={TrendingUp} label="Среднее время ответа" value={loading ? "..." : stats.avgResponseTime} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/nexik/dashboard/chats" className="flex items-center gap-4 p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold group-hover:text-blue-400 transition-colors">Диалоги</h3>
            <p className="text-sm text-white/50">Просмотр всех чатов</p>
          </div>
        </Link>

        <Link href="/nexik/dashboard/settings" className="flex items-center gap-4 p-6 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-colors group">
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

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
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
