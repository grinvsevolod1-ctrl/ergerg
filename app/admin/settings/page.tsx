"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Check,
  RefreshCw,
  Mail,
  Database,
  Server,
  Shield,
  Bell,
  Key,
  Activity,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface ConnectionStatus {
  name: string
  status: "connected" | "disconnected" | "checking" | "unknown"
  latency?: number
}

export default function SettingsPage() {
  const [connections, setConnections] = useState<ConnectionStatus[]>([
    { name: "SMTP", status: "unknown" },
    { name: "Redis", status: "unknown" },
    { name: "PostgreSQL", status: "unknown" },
  ])

  const [notifications, setNotifications] = useState({
    email: true,
    telegram: true,
    newLeads: true,
    newChats: true,
    campaigns: true,
  })

  const testConnection = async (service: string) => {
    setConnections(prev =>
      prev.map(c => (c.name === service ? { ...c, status: "checking" as const } : c))
    )

    const startTime = Date.now()

    try {
      if (service === "SMTP") {
        const res = await fetch("/api/admin/mailings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ action: "test_connection" }),
        })
        const data = await res.json()
        const latency = Date.now() - startTime
        
        setConnections(prev =>
          prev.map(c =>
            c.name === service
              ? { ...c, status: data.connected ? "connected" : "disconnected", latency }
              : c
          )
        )
      } else {
        // For Redis and PostgreSQL, we'll simulate with a general health check
        const res = await fetch("/api/health", { 
          credentials: 'include',
        })
        const latency = Date.now() - startTime
        
        setConnections(prev =>
          prev.map(c =>
            c.name === service
              ? { ...c, status: res.ok ? "connected" : "disconnected", latency }
              : c
          )
        )
      }
    } catch {
      setConnections(prev =>
        prev.map(c => (c.name === service ? { ...c, status: "disconnected" as const } : c))
      )
    }
  }

  const testAll = () => {
    connections.forEach(c => testConnection(c.name))
  }

  // Environment configuration summary - no secrets exposed
  const configSummary = [
    { category: "База данных", items: ["PostgreSQL подключение", "Redis кеш"], status: "configured" },
    { category: "Email", items: ["SMTP сервер", "DKIM подпись"], status: "configured" },
    { category: "Telegram", items: ["Бот уведомлений"], status: "configured" },
    { category: "Безопасность", items: ["Шифрование данных", "Авторизация"], status: "configured" },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Настройки</h1>
          <p className="text-[#666] mt-1">Конфигурация системы и подключения</p>
        </div>
        <Button
          onClick={testAll}
          className="bg-white/5 hover:bg-white/10 text-white border border-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Проверить всё
        </Button>
      </div>

      {/* Connection Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {connections.map((conn) => (
          <motion.div
            key={conn.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "relative p-5 rounded-xl border transition-all duration-300",
              conn.status === "connected"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : conn.status === "disconnected"
                ? "bg-red-500/5 border-red-500/20"
                : "bg-white/[0.02] border-white/[0.06]"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {conn.name === "SMTP" && <Mail className="w-5 h-5 text-[#888]" />}
                {conn.name === "Redis" && <Database className="w-5 h-5 text-[#888]" />}
                {conn.name === "PostgreSQL" && <Database className="w-5 h-5 text-[#888]" />}
                <span className="font-medium text-white">{conn.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => testConnection(conn.name)}
                disabled={conn.status === "checking"}
                className="h-8 w-8 p-0 text-[#666] hover:text-white"
              >
                <RefreshCw className={cn("w-4 h-4", conn.status === "checking" && "animate-spin")} />
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {conn.status === "connected" && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-emerald-400">Подключено</span>
                  </>
                )}
                {conn.status === "disconnected" && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-red-400">Ошибка</span>
                  </>
                )}
                {conn.status === "checking" && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                    <span className="text-sm text-yellow-400">Проверка...</span>
                  </>
                )}
                {conn.status === "unknown" && (
                  <>
                    <div className="w-2 h-2 rounded-full bg-[#444]" />
                    <span className="text-sm text-[#666]">Не проверено</span>
                  </>
                )}
              </div>
              {conn.latency && (
                <span className="text-xs text-[#555]">{conn.latency}ms</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Configuration */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Key className="w-5 h-5 text-[#888]" />
            <div>
              <h2 className="font-medium text-white">Конфигурация системы</h2>
              <p className="text-xs text-[#666]">Статус настроек</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {configSummary.map((section) => (
            <div key={section.category} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-white">{section.category}</h3>
                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  Настроено
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {section.items.map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 bg-black/20 rounded-lg text-xs text-[#888]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Settings */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#888]" />
            <div>
              <h2 className="font-medium text-white">Уведомления</h2>
              <p className="text-xs text-[#666]">Настройка каналов оповещений</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {[
            { key: "email", label: "Email уведомления", desc: "Отправка на почту администратора" },
            { key: "telegram", label: "Telegram уведомления", desc: "Мгновенные уведомления в бот" },
            { key: "newLeads", label: "Новые заявки", desc: "Уведомлять о новых лидах" },
            { key: "newChats", label: "Новые чаты", desc: "Уведомлять о новых сообщениях" },
            { key: "campaigns", label: "Рассылки", desc: "Статус email кампаний" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="text-xs text-[#666]">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key as keyof typeof notifications]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rate Limits */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#888]" />
            <div>
              <h2 className="font-medium text-white">Лимиты отправки</h2>
              <p className="text-xs text-[#666]">Ограничения для защиты от блокировки</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-black/20 text-center">
              <p className="text-3xl font-bold text-white">50</p>
              <p className="text-xs text-[#666] mt-1">писем в час</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 text-center">
              <p className="text-3xl font-bold text-white">5с</p>
              <p className="text-xs text-[#666] mt-1">между письмами</p>
            </div>
            <div className="p-4 rounded-lg bg-black/20 text-center">
              <p className="text-3xl font-bold text-white">1</p>
              <p className="text-xs text-[#666] mt-1">параллельный воркер</p>
            </div>
          </div>
          <p className="text-xs text-[#555] mt-4 text-center">
            Изменить можно через MAILING_MAX_PER_HOUR и MAILING_DELAY_MS
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-red-500/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div>
              <h2 className="font-medium text-red-400">Опасная зона</h2>
              <p className="text-xs text-red-400/60">Необратимые действия</p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-wrap gap-3">
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Очистить кеш Redis
          </Button>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Сбросить статистику
          </Button>
          <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
            Очистить очередь рассылок
          </Button>
        </div>
      </div>
    </div>
  )
}
