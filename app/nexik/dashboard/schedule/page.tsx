"use client"

import { useEffect, useState, useCallback } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { 
  Clock, 
  User, 
  Check,
  Sun,
  Moon,
  Calendar,
  Loader2,
  AlertTriangle
} from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const weekDays = [
  { id: "mon", label: "Пн", full: "Понедельник" },
  { id: "tue", label: "Вт", full: "Вторник" },
  { id: "wed", label: "Ср", full: "Среда" },
  { id: "thu", label: "Чт", full: "Четверг" },
  { id: "fri", label: "Пт", full: "Пятница" },
  { id: "sat", label: "Сб", full: "Суббота" },
  { id: "sun", label: "Вс", full: "Воскресенье" },
]

type ScheduleMode = "ai_only" | "operator_only" | "hybrid"

interface DaySchedule {
  enabled: boolean
  aiStart: string
  aiEnd: string
}

interface ScheduleData {
  mode: ScheduleMode
  workHours: { start: string; end: string }
  workDays: string[]
  timezone: string
  customSchedule?: Record<string, DaySchedule>
}

export default function SchedulePage() {
  const { session } = useNexikAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [mode, setMode] = useState<ScheduleMode>("ai_only")
  const [workHours, setWorkHours] = useState({ start: "09:00", end: "18:00" })
  const [workDays, setWorkDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"])
  const [timezone, setTimezone] = useState("Europe/Moscow")
  const [customSchedule, setCustomSchedule] = useState<Record<string, DaySchedule>>(
    Object.fromEntries(weekDays.map(day => [
      day.id,
      { enabled: true, aiStart: "18:00", aiEnd: "09:00" }
    ]))
  )

  const loadSchedule = useCallback(async () => {
    try {
      const res = await fetch('/api/nexik/dashboard/schedule')
      const data = await res.json()
      
      if (data.success && data.schedule) {
        const s = data.schedule
        setMode(s.mode || 'ai_only')
        setWorkHours(s.workHours || { start: "09:00", end: "18:00" })
        setWorkDays(s.workDays || ["mon", "tue", "wed", "thu", "fri"])
        setTimezone(s.timezone || "Europe/Moscow")
        if (s.customSchedule) {
          setCustomSchedule(s.customSchedule)
        }
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const res = await fetch('/api/nexik/dashboard/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          workHours,
          workDays,
          timezone,
          customSchedule: mode === 'hybrid' ? customSchedule : undefined
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError(data.error || 'Не удалось сохранить')
      }
    } catch (err) {
      console.error('Failed to save schedule:', err)
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const toggleWorkDay = (dayId: string) => {
    if (workDays.includes(dayId)) {
      setWorkDays(workDays.filter(d => d !== dayId))
    } else {
      setWorkDays([...workDays, dayId])
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
        <Skeleton className="h-8 w-64 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-48 bg-white/10 mb-8" />
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl bg-white/10" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl bg-white/10" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Расписание работы</h1>
        <p className="text-[#888]">
          Настрой когда отвечает Nexik, а когда ты
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Mode selection */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* AI Only */}
        <button
          onClick={() => setMode("ai_only")}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            mode === "ai_only"
              ? "border-[#00ffff]/50 bg-[#00ffff]/5"
              : "border-[#1a1a2e] bg-[#0a0a0f]/80 hover:border-[#2a2a3e]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#00ffff]/10 flex items-center justify-center">
              <NetNextLogo size={24} />
            </div>
            {mode === "ai_only" && (
              <div className="w-6 h-6 rounded-full bg-[#00ffff] flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <h3 className="font-semibold mb-1">Nexik 24/7</h3>
          <p className="text-sm text-[#888]">
            AI отвечает всегда, уведомляет тебя о важном
          </p>
        </button>

        {/* Operator Only */}
        <button
          onClick={() => setMode("operator_only")}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            mode === "operator_only"
              ? "border-[#ff00aa]/50 bg-[#ff00aa]/5"
              : "border-[#1a1a2e] bg-[#0a0a0f]/80 hover:border-[#2a2a3e]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#ff00aa]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#ff00aa]" />
            </div>
            {mode === "operator_only" && (
              <div className="w-6 h-6 rounded-full bg-[#ff00aa] flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <h3 className="font-semibold mb-1">Только оператор</h3>
          <p className="text-sm text-[#888]">
            AI выключен, все сообщения идут оператору
          </p>
        </button>

        {/* Hybrid */}
        <button
          onClick={() => setMode("hybrid")}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            mode === "hybrid"
              ? "border-[#ffaa00]/50 bg-[#ffaa00]/5"
              : "border-[#1a1a2e] bg-[#0a0a0f]/80 hover:border-[#2a2a3e]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffaa00]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#ffaa00]" />
            </div>
            {mode === "hybrid" && (
              <div className="w-6 h-6 rounded-full bg-[#ffaa00] flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <h3 className="font-semibold mb-1">Гибридный режим</h3>
          <p className="text-sm text-[#888]">
            Оператор в рабочее время, Nexik в остальное
          </p>
        </button>
      </div>

      {/* Settings based on mode */}
      {mode === "ai_only" && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#00ffff]/10 flex items-center justify-center flex-shrink-0">
              <NetNextLogo size={24} />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Nexik работает круглосуточно</h3>
              <p className="text-[#888] mb-4">
                AI будет отвечать на все сообщения 24/7. Ты будешь получать уведомления о важных диалогах 
                и сможешь подключиться в любой момент.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
                <div className="flex items-center gap-2 text-[#00ff88]">
                  <Check className="w-4 h-4" />
                  <span>Мгновенные ответы</span>
                </div>
                <div className="flex items-center gap-2 text-[#00ff88]">
                  <Check className="w-4 h-4" />
                  <span>Никаких пропущенных заявок</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "operator_only" && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#ff00aa]/10 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-[#ff00aa]" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Режим оператора</h3>
              <p className="text-[#888] mb-4">
                Все сообщения будут направлены операторам. AI-ассистент отключен.
                Не забудь настроить уведомления в Telegram.
              </p>
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Клиенты могут ждать ответа дольше</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === "hybrid" && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
          <h3 className="font-semibold mb-4">Рабочее время оператора</h3>
          <p className="text-sm text-[#888] mb-6">
            В это время сообщения идут оператору. В остальное время отвечает Nexik AI.
          </p>
          
          {/* Work days */}
          <div className="mb-6">
            <label className="text-xs text-[#888] block mb-3">Рабочие дни</label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <button
                  key={day.id}
                  onClick={() => toggleWorkDay(day.id)}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors",
                    workDays.includes(day.id)
                      ? "bg-[#00ffff] text-black"
                      : "bg-[#1a1a2e] text-[#555] hover:bg-[#2a2a3e]"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Work hours */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
            <div>
              <label className="text-xs text-[#888] block mb-2">Начало</label>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#ffaa00]" />
                <input
                  type="time"
                  value={workHours.start}
                  onChange={(e) => setWorkHours(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00ffff]/50"
                />
              </div>
            </div>
            <div className="text-[#555] hidden sm:block">—</div>
            <div>
              <label className="text-xs text-[#888] block mb-2">Конец</label>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#aa00ff]" />
                <input
                  type="time"
                  value={workHours.end}
                  onChange={(e) => setWorkHours(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00ffff]/50"
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="mb-6">
            <label className="text-xs text-[#888] block mb-2">Часовой пояс</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#00ffff]/50"
            >
              <option value="Europe/Moscow">Москва (UTC+3)</option>
              <option value="Europe/Kiev">Киев (UTC+2)</option>
              <option value="Europe/Minsk">Минск (UTC+3)</option>
              <option value="Asia/Almaty">Алматы (UTC+6)</option>
              <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
              <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
            </select>
          </div>

          {/* Visual timeline */}
          <div className="bg-[#1a1a2e] rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs text-[#888] mb-2">
              <Clock className="w-3 h-3" />
              <span>Визуализация дня</span>
            </div>
            <div className="h-8 rounded-lg overflow-hidden flex">
              <div 
                className="bg-[#00ffff]/20 flex items-center justify-center text-[10px] text-[#00ffff]"
                style={{ width: `${(parseInt(workHours.start) / 24) * 100}%` }}
              >
                AI
              </div>
              <div 
                className="bg-[#ff00aa]/20 flex items-center justify-center text-[10px] text-[#ff00aa]"
                style={{ width: `${((parseInt(workHours.end) - parseInt(workHours.start)) / 24) * 100}%` }}
              >
                Оператор
              </div>
              <div 
                className="bg-[#00ffff]/20 flex items-center justify-center text-[10px] text-[#00ffff] flex-1"
              >
                AI
              </div>
            </div>
            <div className="flex justify-between text-[10px] text-[#555] mt-1">
              <span>00:00</span>
              <span>{workHours.start}</span>
              <span>{workHours.end}</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <Button 
        onClick={handleSave}
        disabled={saving}
        className={cn(
          "px-8",
          saved 
            ? "bg-[#00ff88] text-black hover:bg-[#00ff88]" 
            : "bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
        )}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : saved ? (
          <>
            <Check className="w-4 h-4 mr-2" />
            Сохранено!
          </>
        ) : (
          "Сохранить расписание"
        )}
      </Button>
    </div>
  )
}
