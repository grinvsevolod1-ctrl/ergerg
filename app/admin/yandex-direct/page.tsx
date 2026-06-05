"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Megaphone,
  Play,
  Pause,
  Archive,
  ArchiveRestore,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TestTube,
  Wallet,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Campaign {
  Id: number
  Name: string
  State: string
  Status: string
  StatusClarification?: string
  Type?: string
  StartDate?: string
  EndDate?: string
  DailyBudget?: { Amount: number; Mode: string }
}

interface ConfigStatus {
  configured: boolean
  mode: "sandbox" | "production"
  apiUrl: string
  hasClientLogin: boolean
}

interface LogEntry {
  id: string
  action: string
  campaign_id: string | null
  campaign_name: string | null
  success: boolean
  error_message: string | null
  created_at: string
}

const stateConfig: Record<string, { label: string; cls: string; dot: string }> = {
  ON: { label: "Активна", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  OFF: { label: "Остановлена", cls: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30", dot: "bg-zinc-400" },
  SUSPENDED: { label: "Приостановлена", cls: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  ENDED: { label: "Завершена", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  CONVERTED: { label: "Сконвертирована", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
  ARCHIVED: { label: "В архиве", cls: "bg-zinc-700/30 text-zinc-400 border-zinc-600/30", dot: "bg-zinc-500" },
  UNKNOWN: { label: "Неизвестно", cls: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30", dot: "bg-zinc-500" },
}

const statusLabels: Record<string, string> = {
  ACCEPTED: "Принята",
  DRAFT: "Черновик",
  MODERATION: "На модерации",
  REJECTED: "Отклонена",
  UNKNOWN: "—",
}

function formatBudget(b?: { Amount: number }) {
  if (!b || !b.Amount) return "—"
  return `${(b.Amount / 1_000_000).toLocaleString("ru-RU")} ₽/день`
}

const actionLabels: Record<string, string> = {
  create: "Создание",
  update: "Изменение",
  suspend: "Приостановка",
  resume: "Запуск",
  archive: "Архивация",
  unarchive: "Разархивация",
  delete: "Удаление",
}

export default function YandexDirectPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [config, setConfig] = useState<ConfigStatus | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/yandex-direct", { credentials: "include" })
      if (res.status === 401) {
        toast.error("Сессия истекла. Войдите снова.")
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setConfig(data.config ?? null)
      setCampaigns(Array.isArray(data.campaigns) ? data.campaigns : [])
      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setApiError(data.error ?? null)
    } catch (err) {
      console.error("Error fetching Yandex Direct data:", err)
      toast.error("Не удалось загрузить данные Yandex Direct")
      setApiError("Ошибка соединения с сервером")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const runAction = async (
    id: number,
    action: "suspend" | "resume" | "archive" | "unarchive" | "delete"
  ) => {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/yandex-direct/${id}`, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: action === "delete" ? undefined : JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success(`${actionLabels[action]} выполнено`)
      await fetchData()
    } catch (err) {
      console.error(`Error running ${action}:`, err)
      toast.error(err instanceof Error ? err.message : "Действие не выполнено")
    } finally {
      setBusyId(null)
    }
  }

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.State === "ON").length,
    suspended: campaigns.filter((c) => c.State === "SUSPENDED" || c.State === "OFF").length,
    archived: campaigns.filter((c) => c.State === "ARCHIVED").length,
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Яндекс Директ"
        description="Управление рекламными кампаниями"
        onRefresh={fetchData}
        loading={loading}
        actions={
          <Button
            onClick={() => setShowCreate(true)}
            disabled={!config?.configured}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Создать кампанию
          </Button>
        }
      />

      {/* Connection banner */}
      {config && (
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4",
            config.configured
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-amber-500/5 border-amber-500/20"
          )}
        >
          <div className="flex items-center gap-3">
            {config.configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
            <div>
              <p className="text-sm font-medium text-white">
                {config.configured ? "Yandex Direct подключён" : "Yandex Direct не настроен"}
              </p>
              <p className="text-xs text-[#888]">
                {config.configured
                  ? "Токен задан на сервере"
                  : "Задайте переменную окружения YANDEX_DIRECT_TOKEN на VPS"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border",
                config.mode === "sandbox"
                  ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30"
              )}
            >
              <TestTube className="w-3.5 h-3.5" />
              {config.mode === "sandbox" ? "Песочница (тест)" : "Боевой режим"}
            </span>
            {config.hasClientLogin && (
              <span className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-[#111] border-[#222] text-[#888]">
                Агентский доступ
              </span>
            )}
          </div>
        </div>
      )}

      {/* API error (non-fatal) */}
      {apiError && config?.configured && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-300">{apiError}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Всего кампаний" value={stats.total} icon={Megaphone} color="primary" />
        <StatsCard title="Активных" value={stats.active} icon={Play} color="green" />
        <StatsCard title="Остановлено" value={stats.suspended} icon={Pause} color="yellow" />
        <StatsCard title="В архиве" value={stats.archived} icon={Archive} color="blue" />
      </div>

      {/* Campaigns table */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
        {loading && campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-[#888]">Загрузка кампаний...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-[#555]" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Нет кампаний</p>
            <p className="text-sm text-[#888]">
              {config?.configured
                ? "Создайте первую кампанию или обновите список"
                : "Подключите Yandex Direct, чтобы управлять кампаниями"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Кампания</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Состояние</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Модерация</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Бюджет</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {campaigns.map((c) => {
                  const st = stateConfig[c.State] ?? stateConfig.UNKNOWN
                  const isBusy = busyId === c.Id
                  const isArchived = c.State === "ARCHIVED"
                  const isRunning = c.State === "ON"
                  return (
                    <tr key={c.Id} className="hover:bg-[#111]/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-medium text-white">{c.Name}</div>
                        <div className="text-xs text-[#555]">
                          ID: {c.Id}{c.StartDate ? ` · с ${c.StartDate}` : ""}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border", st.cls)}>
                          <span className={cn("w-2 h-2 rounded-full", st.dot)} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-[#aaa]">{statusLabels[c.Status] ?? c.Status}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Wallet className="w-3.5 h-3.5 text-[#555]" />
                          {formatBudget(c.DailyBudget)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {isBusy ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 mr-2" />
                          ) : (
                            <>
                              {!isArchived && (isRunning ? (
                                <ActionBtn title="Приостановить" onClick={() => runAction(c.Id, "suspend")}>
                                  <Pause className="w-4 h-4" />
                                </ActionBtn>
                              ) : (
                                <ActionBtn title="Запустить" onClick={() => runAction(c.Id, "resume")} accent="green">
                                  <Play className="w-4 h-4" />
                                </ActionBtn>
                              ))}
                              {isArchived ? (
                                <ActionBtn title="Разархивировать" onClick={() => runAction(c.Id, "unarchive")}>
                                  <ArchiveRestore className="w-4 h-4" />
                                </ActionBtn>
                              ) : (
                                <ActionBtn title="В архив" onClick={() => runAction(c.Id, "archive")}>
                                  <Archive className="w-4 h-4" />
                                </ActionBtn>
                              )}
                              <ActionBtn title="Удалить" onClick={() => setConfirmDeleteId(c.Id)} accent="red">
                                <Trash2 className="w-4 h-4" />
                              </ActionBtn>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent activity log */}
      {logs.length > 0 && (
        <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-[#1a1a1a]">
            <Activity className="w-5 h-5 text-[#888]" />
            <div>
              <h2 className="font-medium text-white">Журнал действий</h2>
              <p className="text-xs text-[#666]">Последние операции с кампаниями</p>
            </div>
          </div>
          <div className="divide-y divide-[#1a1a1a]">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  {log.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">
                      {actionLabels[log.action] ?? log.action}
                      {log.campaign_name ? ` · ${log.campaign_name}` : log.campaign_id ? ` · ID ${log.campaign_id}` : ""}
                    </p>
                    {log.error_message && (
                      <p className="text-xs text-red-400/80 truncate">{log.error_message}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-[#555] shrink-0 ml-3">
                  {new Date(log.created_at).toLocaleString("ru-RU", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchData()
          }}
        />
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить кампанию?</AlertDialogTitle>
            <AlertDialogDescription>
              Кампания будет удалена в Яндекс Директе безвозвратно. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId !== null) runAction(confirmDeleteId, "delete")
                setConfirmDeleteId(null)
              }}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ActionBtn({
  children,
  title,
  onClick,
  accent,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  accent?: "green" | "red"
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-xl transition-colors text-[#888]",
        accent === "green" && "hover:text-emerald-400 hover:bg-emerald-500/10",
        accent === "red" && "hover:text-red-400 hover:bg-red-500/10",
        !accent && "hover:text-white hover:bg-[#1a1a1a]"
      )}
    >
      {children}
    </button>
  )
}

function CreateCampaignModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [name, setName] = useState("")
  const [startDate, setStartDate] = useState(today)
  const [budget, setBudget] = useState("")
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Укажите название кампании")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/admin/yandex-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          startDate,
          dailyBudgetAmount: budget ? Number(budget) : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      toast.success("Кампания создана")
      onCreated()
    } catch (err) {
      console.error("Error creating campaign:", err)
      toast.error(err instanceof Error ? err.message : "Не удалось создать кампанию")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <h2 className="text-lg font-semibold text-white">Новая кампания</h2>
          <button onClick={onClose} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
              Название
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Поиск — Услуги"
              autoFocus
              className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder:text-[#444] focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                Дата старта
              </label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                Бюджет/день, ₽
              </label>
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="необяз."
                className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3 text-white placeholder:text-[#444] focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-[#555]">
            Создаётся текстовая кампания с показами в сети, отключёнными по умолчанию, чтобы избежать
            случайных расходов. Стратегии и объявления можно донастроить в интерфейсе Яндекс Директа.
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[#1a1a1a] bg-[#111]">
          <Button variant="ghost" onClick={onClose} disabled={saving} className="text-[#888] hover:text-white">
            Отмена
          </Button>
          <Button
            onClick={submit}
            disabled={saving}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Создание...
              </span>
            ) : (
              "Создать"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
