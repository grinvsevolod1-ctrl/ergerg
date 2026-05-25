"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Bot,
  Send,
  Activity,
  ChevronRight,
  Sparkles,
  GraduationCap
} from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

interface Stats {
  totalChats: number
  activeToday: number
  avgResponseTime: string
  resolvedToday: number
  aiResponses: number
  humanResponses: number
  satisfactionRate: number
  telegramChats: number
}

interface RecentChat {
  id: string
  visitorName: string
  lastMessage: string
  source: 'widget' | 'telegram'
  timestamp: string
  status: 'active' | 'resolved' | 'pending'
}

// Animated counter component
function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  
  useEffect(() => {
    let startTime: number
    const startValue = displayValue
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)
      
      setDisplayValue(Math.floor(startValue + (value - startValue) * progress))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  return <span>{displayValue.toLocaleString()}</span>
}

// Sparkline chart component
function Sparkline({ data, color = "#22d3ee", height = 40 }: { data: number[]; color?: string; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')
  
  const areaPoints = `0,${height} ${points} 100,${height}`
  
  return (
    <svg className="w-full" height={height} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#sparkline-gradient-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

// Stat card with glassmorphism
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  trendValue,
  color = "cyan",
  sparklineData,
  delay = 0
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  trend?: 'up' | 'down'
  trendValue?: string
  color?: 'cyan' | 'green' | 'purple' | 'orange'
  sparklineData?: number[]
  delay?: number
}) {
  const colorClasses = {
    cyan: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      glow: "shadow-cyan-500/10"
    },
    green: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/10"
    },
    purple: {
      icon: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      glow: "shadow-purple-500/10"
    },
    orange: {
      icon: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      glow: "shadow-orange-500/10"
    }
  }
  
  const colors = colorClasses[color]
  const sparklineColor = color === 'cyan' ? '#22d3ee' : color === 'green' ? '#34d399' : color === 'purple' ? '#a78bfa' : '#fb923c'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl border ${colors.border} p-5`}
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        backdropFilter: "blur(10px)",
      }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        
        <p className="text-2xl font-bold text-white mb-1">
          {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
        </p>
        <p className="text-sm text-white/50">{label}</p>
        
        {sparklineData && (
          <div className="mt-4 -mx-1">
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Quick action card
function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  color,
  delay = 0
}: {
  href: string
  icon: React.ElementType
  title: string
  description: string
  color: 'cyan' | 'purple' | 'green' | 'orange'
  delay?: number
}) {
  const colorClasses = {
    cyan: {
      icon: "text-cyan-400 group-hover:text-cyan-300",
      bg: "bg-cyan-500/10 group-hover:bg-cyan-500/20",
      border: "border-cyan-500/20 group-hover:border-cyan-500/40",
    },
    purple: {
      icon: "text-purple-400 group-hover:text-purple-300",
      bg: "bg-purple-500/10 group-hover:bg-purple-500/20",
      border: "border-purple-500/20 group-hover:border-purple-500/40",
    },
    green: {
      icon: "text-emerald-400 group-hover:text-emerald-300",
      bg: "bg-emerald-500/10 group-hover:bg-emerald-500/20",
      border: "border-emerald-500/20 group-hover:border-emerald-500/40",
    },
    orange: {
      icon: "text-orange-400 group-hover:text-orange-300",
      bg: "bg-orange-500/10 group-hover:bg-orange-500/20",
      border: "border-orange-500/20 group-hover:border-orange-500/40",
    }
  }
  
  const colors = colorClasses[color]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link 
        href={href} 
        className={`group flex items-center gap-4 p-5 rounded-2xl border ${colors.border} transition-all duration-300`}
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        }}
      >
        <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center transition-all duration-300`}>
          <Icon className={`w-6 h-6 ${colors.icon} transition-colors`} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">{title}</h3>
          <p className="text-sm text-white/50">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  )
}

// Recent chat item
function RecentChatItem({ chat, delay = 0 }: { chat: RecentChat; delay?: number }) {
  const statusColors = {
    active: "bg-emerald-500",
    pending: "bg-yellow-500",
    resolved: "bg-white/30"
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Link 
        href={`/nexik/dashboard/chats?id=${chat.id}`}
        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {chat.visitorName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[chat.status]} border-2 border-zinc-900`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-white truncate">{chat.visitorName}</p>
            {chat.source === 'telegram' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400">TG</span>
            )}
          </div>
          <p className="text-sm text-white/50 truncate">{chat.lastMessage}</p>
        </div>
        <span className="text-xs text-white/30">{chat.timestamp}</span>
      </Link>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalChats: 0,
    activeToday: 0,
    avgResponseTime: "-",
    resolvedToday: 0,
    aiResponses: 0,
    humanResponses: 0,
    satisfactionRate: 0,
    telegramChats: 0
  })
  const [recentChats, setRecentChats] = useState<RecentChat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, chatsRes] = await Promise.all([
          fetch("/api/nexik/dashboard/stats"),
          fetch("/api/nexik/dashboard/conversations?limit=5")
        ])
        
        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats({
            totalChats: data.stats?.totalChats || 0,
            activeToday: data.stats?.activeToday || 0,
            avgResponseTime: data.stats?.avgResponseTime || "< 1s",
            resolvedToday: data.stats?.resolvedToday || 0,
            aiResponses: data.stats?.aiResponses || 0,
            humanResponses: data.stats?.humanResponses || 0,
            satisfactionRate: data.stats?.satisfactionRate || 98,
            telegramChats: data.stats?.telegramChats || 0
          })
        }
        
        if (chatsRes.ok) {
          const data = await chatsRes.json()
          setRecentChats(data.conversations?.slice(0, 5).map((c: { id: string; visitorName: string; lastMessage: string; source: string; lastMessageAt: string; status: string }) => ({
            id: c.id,
            visitorName: c.visitorName || "Посетитель",
            lastMessage: c.lastMessage || "Нет сообщений",
            source: c.source || 'widget',
            timestamp: formatTime(c.lastMessageAt),
            status: c.status || 'active'
          })) || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function formatTime(dateStr: string) {
    if (!dateStr) return "Сейчас"
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return "Сейчас"
    if (diffMins < 60) return `${diffMins} мин`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ч`
    return `${Math.floor(diffMins / 1440)} д`
  }

  // Mock sparkline data
  const chatSparkline = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45]
  const responseSparkline = [95, 92, 98, 94, 97, 99, 96, 98, 97, 99, 98, 99]

  return (
    <div className="space-y-8">
      {/* Header with orb */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-white/50 mt-1">Добро пожаловать в Nexik</p>
        </div>
        <div className="hidden sm:block">
          <SiriOrb size={56} state={loading ? "thinking" : "idle"} />
        </div>
      </motion.div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={MessageSquare} 
          label="Всего диалогов" 
          value={stats.totalChats}
          trend="up"
          trendValue="+12%"
          color="cyan"
          sparklineData={chatSparkline}
          delay={0.1}
        />
        <StatCard 
          icon={Users} 
          label="Активных сегодня" 
          value={stats.activeToday}
          color="green"
          delay={0.15}
        />
        <StatCard 
          icon={Clock} 
          label="Среднее время ответа" 
          value={stats.avgResponseTime}
          trend="down"
          trendValue="-0.3s"
          color="purple"
          delay={0.2}
        />
        <StatCard 
          icon={Activity} 
          label="Удовлетворённость" 
          value={`${stats.satisfactionRate}%`}
          trend="up"
          trendValue="+2%"
          color="orange"
          sparklineData={responseSparkline}
          delay={0.25}
        />
      </div>

      {/* AI Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/10 p-6"
        style={{
          background: "linear-gradient(145deg, rgba(34,211,238,0.05) 0%, rgba(168,85,247,0.05) 100%)",
        }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">AI-ассистент</h2>
            <p className="text-sm text-white/50">Статистика автоматических ответов</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-cyan-400">
              <AnimatedNumber value={stats.aiResponses} />
            </p>
            <p className="text-xs text-white/50 mt-1">AI ответов</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-purple-400">
              <AnimatedNumber value={stats.humanResponses} />
            </p>
            <p className="text-xs text-white/50 mt-1">Ответов оператора</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-emerald-400">
              <AnimatedNumber value={stats.resolvedToday} />
            </p>
            <p className="text-xs text-white/50 mt-1">Решено сегодня</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-orange-400">
              <AnimatedNumber value={stats.telegramChats} />
            </p>
            <p className="text-xs text-white/50 mt-1">Telegram чатов</p>
          </div>
        </div>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Chats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="font-semibold text-white">Последние диалоги</h2>
            </div>
            <Link 
              href="/nexik/dashboard/chats"
              className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Все диалоги
            </Link>
          </div>
          
          <div className="divide-y divide-white/5">
            {loading ? (
              <div className="p-8 text-center text-white/30">Загрузка...</div>
            ) : recentChats.length > 0 ? (
              recentChats.map((chat, index) => (
                <RecentChatItem key={chat.id} chat={chat} delay={0.4 + index * 0.05} />
              ))
            ) : (
              <div className="p-8 text-center text-white/30">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет активных диалогов</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-semibold text-white px-1"
          >
            Быстрые действия
          </motion.h2>
          
          <QuickActionCard
            href="/nexik/dashboard/chats"
            icon={MessageSquare}
            title="Диалоги"
            description="Просмотр и управление чатами"
            color="cyan"
            delay={0.45}
          />
          
          <QuickActionCard
            href="/nexik/dashboard/train"
            icon={GraduationCap}
            title="Обучение AI"
            description="Расскажите боту о вашем бизнесе"
            color="purple"
            delay={0.5}
          />
          
          <QuickActionCard
            href="/nexik/dashboard/settings"
            icon={Zap}
            title="Настройки"
            description="Telegram, виджет, интеграции"
            color="green"
            delay={0.55}
          />
          
          <QuickActionCard
            href="/nexik/dashboard/settings?tab=widget"
            icon={Send}
            title="Код виджета"
            description="Установка на ваш сайт"
            color="orange"
            delay={0.6}
          />
        </div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="rounded-2xl border border-cyan-500/20 p-6"
        style={{
          background: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
        }}
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Совет дня</h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Обучите AI-ассистента информации о вашем бизнесе через раздел 
              <Link href="/nexik/dashboard/train" className="text-cyan-400 hover:text-cyan-300 mx-1">Обучение AI</Link>
              — это поможет боту давать более точные и релевантные ответы вашим клиентам.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
