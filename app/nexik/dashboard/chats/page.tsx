"use client"

import { MessageSquare, User, Bot, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

const chats = [
  {
    id: "1",
    lastMessage: "Сколько стоит разработка сайта?",
    messages: 5,
    status: "ai",
    time: "2 мин назад",
  },
  {
    id: "2",
    lastMessage: "Хочу заказать интернет-магазин",
    messages: 12,
    status: "operator",
    time: "15 мин назад",
  },
  {
    id: "3",
    lastMessage: "Спасибо за информацию!",
    messages: 8,
    status: "closed",
    time: "1 час назад",
  },
  {
    id: "4",
    lastMessage: "Какие технологии вы используете?",
    messages: 3,
    status: "ai",
    time: "2 часа назад",
  },
]

export default function ChatsPage() {
  const stats = [
    { icon: MessageSquare, label: "Активных чатов", value: "4", accent: "#00ff88" },
    { icon: Bot, label: "Решено AI", value: "89%", accent: "#00ffff" },
    { icon: Clock, label: "Среднее время ответа", value: "<1 сек", accent: "#ff00aa" },
  ]

  const statusConfig = {
    ai: { label: "AI", color: "#00ffff", bg: "rgba(0, 255, 255, 0.1)", border: "rgba(0, 255, 255, 0.2)" },
    operator: { label: "Оператор", color: "#ff00aa", bg: "rgba(255, 0, 170, 0.1)", border: "rgba(255, 0, 170, 0.2)" },
    closed: { label: "Завершён", color: "#888", bg: "rgba(136, 136, 136, 0.1)", border: "rgba(136, 136, 136, 0.2)" },
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-0.5 bg-primary" />
          <span className="text-primary font-mono text-sm">{"// Диалоги"}</span>
        </div>
        <h1 className="text-3xl font-bold">Чаты</h1>
        <p className="text-muted-foreground mt-1">
          История диалогов с посетителями
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5"
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2.5 rounded-xl"
                style={{ background: `${stat.accent}15`, color: stat.accent }}
              >
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: stat.accent }}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chats List */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Последние чаты</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Нажмите на чат, чтобы посмотреть историю
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-3">
            {chats.map((chat) => {
              const status = statusConfig[chat.status as keyof typeof statusConfig]
              return (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border hover:border-border/80 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                        {chat.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {chat.messages} сообщений
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span className="text-sm text-muted-foreground">{chat.time}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      color: status.color,
                      background: status.bg,
                      border: `1px solid ${status.border}`,
                    }}
                  >
                    {status.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
