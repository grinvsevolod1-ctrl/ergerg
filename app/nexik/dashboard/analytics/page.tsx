"use client"

import { BarChart3, Users, Bot, TrendingUp } from "lucide-react"

export default function AnalyticsPage() {
  const stats = [
    { label: "Всего диалогов", value: "1,247", change: "+12%", positive: true, accent: "#00ffff" },
    { label: "AI ответов", value: "4,832", change: "+24%", positive: true, accent: "#00ff88" },
    { label: "Передано операторам", value: "156", change: "-8%", positive: true, accent: "#ff00aa" },
    { label: "Довольных клиентов", value: "94%", change: "+2%", positive: true, accent: "#ffaa00" },
  ]

  const topics = [
    { topic: "Стоимость услуг", count: 234, percent: 28, accent: "#00ffff" },
    { topic: "Сроки разработки", count: 189, percent: 23, accent: "#00ff88" },
    { topic: "Технологии", count: 156, percent: 19, accent: "#ff00aa" },
    { topic: "Портфолио", count: 134, percent: 16, accent: "#ffaa00" },
    { topic: "Контакты", count: 112, percent: 14, accent: "#aa00ff" },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-0.5 bg-primary" />
          <span className="text-primary font-mono text-sm">{"// Статистика"}</span>
        </div>
        <h1 className="text-3xl font-bold">Аналитика</h1>
        <p className="text-muted-foreground mt-1">
          Статистика использования AI-чата
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 transition-all duration-300 hover:border-border/80"
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-50"
              style={{ background: `linear-gradient(90deg, transparent, ${stat.accent}, transparent)` }}
            />
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <div className="flex items-end gap-2 mt-2">
              <p className="text-3xl font-bold" style={{ color: stat.accent }}>{stat.value}</p>
              <p className={`text-sm ${stat.positive ? "text-[#00ff88]" : "text-red-400"}`}>
                {stat.change}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Chart placeholder */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Диалоги по дням</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Последние 30 дней</p>
          </div>
          <div className="p-6">
            <div 
              className="h-64 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(0, 255, 255, 0.03) 0%, rgba(255, 0, 170, 0.03) 100%)",
              }}
            >
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">График в разработке</p>
              </div>
            </div>
          </div>
        </div>

        {/* Popular topics */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Популярные темы</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">О чём спрашивают чаще всего</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topics.map((item) => (
                <div key={item.topic}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.topic}</span>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percent}%`,
                        background: item.accent,
                        boxShadow: `0 0 10px ${item.accent}50`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Уникальных пользователей", value: "892", accent: "#00ffff" },
          { icon: Bot, label: "Средняя длина диалога", value: "4.2 сообщ.", accent: "#00ff88" },
          { icon: TrendingUp, label: "Конверсия в заявку", value: "12.4%", accent: "#ff00aa" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5"
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
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
