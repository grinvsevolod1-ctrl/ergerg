"use client"

import { useState } from "react"
import { 
  Clock, 
  User, 
  Check,
  Sun,
  Moon,
  Calendar
} from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const weekDays = [
  { id: "mon", label: "Пн", full: "Понедельник" },
  { id: "tue", label: "Вт", full: "Вторник" },
  { id: "wed", label: "Ср", full: "Среда" },
  { id: "thu", label: "Чт", full: "Четверг" },
  { id: "fri", label: "Пт", full: "Пятница" },
  { id: "sat", label: "Сб", full: "Суббота" },
  { id: "sun", label: "Вс", full: "Воскресенье" },
]

type ScheduleMode = "ai_only" | "shared" | "custom"

interface DaySchedule {
  enabled: boolean
  aiStart: string
  aiEnd: string
}

export default function SchedulePage() {
  const [mode, setMode] = useState<ScheduleMode>("ai_only")
  const [workHours, setWorkHours] = useState({ start: "09:00", end: "18:00" })
  const [customSchedule, setCustomSchedule] = useState<Record<string, DaySchedule>>(
    Object.fromEntries(weekDays.map(day => [
      day.id,
      { enabled: true, aiStart: "18:00", aiEnd: "09:00" }
    ]))
  )
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Расписание работы</h1>
        <p className="text-[#888]">
          Настрой когда отвечает Nexik, а когда ты
        </p>
      </div>

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

        {/* Shared */}
        <button
          onClick={() => setMode("shared")}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            mode === "shared"
              ? "border-[#ff00aa]/50 bg-[#ff00aa]/5"
              : "border-[#1a1a2e] bg-[#0a0a0f]/80 hover:border-[#2a2a3e]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#ff00aa]/10 flex items-center justify-center">
              <User className="w-6 h-6 text-[#ff00aa]" />
            </div>
            {mode === "shared" && (
              <div className="w-6 h-6 rounded-full bg-[#ff00aa] flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <h3 className="font-semibold mb-1">Совместная работа</h3>
          <p className="text-sm text-[#888]">
            Ты в рабочее время, Nexik — в остальное
          </p>
        </button>

        {/* Custom */}
        <button
          onClick={() => setMode("custom")}
          className={cn(
            "p-6 rounded-2xl border text-left transition-all duration-300",
            mode === "custom"
              ? "border-[#ffaa00]/50 bg-[#ffaa00]/5"
              : "border-[#1a1a2e] bg-[#0a0a0f]/80 hover:border-[#2a2a3e]"
          )}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#ffaa00]/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#ffaa00]" />
            </div>
            {mode === "custom" && (
              <div className="w-6 h-6 rounded-full bg-[#ffaa00] flex items-center justify-center">
                <Check className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <h3 className="font-semibold mb-1">Своё расписание</h3>
          <p className="text-sm text-[#888]">
            Настрой по дням недели
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
              <div className="flex items-center gap-6 text-sm">
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

      {mode === "shared" && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
          <h3 className="font-semibold mb-4">Твоё рабочее время</h3>
          <p className="text-sm text-[#888] mb-6">
            В это время ты будешь получать уведомления и сможешь отвечать сам. 
            В остальное время — Nexik.
          </p>
          
          <div className="flex items-center gap-6 mb-6">
            <div>
              <label className="text-xs text-[#888] block mb-2">Начало</label>
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#ffaa00]" />
                <input
                  type="time"
                  value={workHours.start}
                  onChange={(e) => setWorkHours(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#ff00aa]/50"
                />
              </div>
            </div>
            <div className="text-[#555]">—</div>
            <div>
              <label className="text-xs text-[#888] block mb-2">Конец</label>
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-[#aa00ff]" />
                <input
                  type="time"
                  value={workHours.end}
                  onChange={(e) => setWorkHours(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-[#1a1a2e] border border-[#2a2a3e] rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#ff00aa]/50"
                />
              </div>
            </div>
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
                Nexik
              </div>
              <div 
                className="bg-[#ff00aa]/20 flex items-center justify-center text-[10px] text-[#ff00aa]"
                style={{ width: `${((parseInt(workHours.end) - parseInt(workHours.start)) / 24) * 100}%` }}
              >
                Ты
              </div>
              <div 
                className="bg-[#00ffff]/20 flex items-center justify-center text-[10px] text-[#00ffff] flex-1"
              >
                Nexik
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

      {mode === "custom" && (
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
          <h3 className="font-semibold mb-4">Расписание по дням</h3>
          <p className="text-sm text-[#888] mb-6">
            Настрой время работы Nexik для каждого дня недели
          </p>

          <div className="space-y-3">
            {weekDays.map((day) => (
              <div
                key={day.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                  customSchedule[day.id].enabled
                    ? "border-[#2a2a3e] bg-[#1a1a2e]/50"
                    : "border-[#1a1a2e] opacity-50"
                )}
              >
                <button
                  onClick={() => setCustomSchedule(prev => ({
                    ...prev,
                    [day.id]: { ...prev[day.id], enabled: !prev[day.id].enabled }
                  }))}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center font-medium transition-colors",
                    customSchedule[day.id].enabled
                      ? "bg-[#00ffff] text-black"
                      : "bg-[#1a1a2e] text-[#555]"
                  )}
                >
                  {day.label}
                </button>
                
                <span className="w-28 text-sm">{day.full}</span>
                
                {customSchedule[day.id].enabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#888]">Nexik с</span>
                      <input
                        type="time"
                        value={customSchedule[day.id].aiStart}
                        onChange={(e) => setCustomSchedule(prev => ({
                          ...prev,
                          [day.id]: { ...prev[day.id], aiStart: e.target.value }
                        }))}
                        className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#00ffff]/50"
                      />
                    </div>
                    <span className="text-[#555]">до</span>
                    <input
                      type="time"
                      value={customSchedule[day.id].aiEnd}
                      onChange={(e) => setCustomSchedule(prev => ({
                        ...prev,
                        [day.id]: { ...prev[day.id], aiEnd: e.target.value }
                      }))}
                      className="bg-[#0a0a0f] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#00ffff]/50"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <Button 
        onClick={handleSave}
        className={cn(
          "px-8",
          saved 
            ? "bg-[#00ff88] text-black hover:bg-[#00ff88]" 
            : "bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
        )}
      >
        {saved ? (
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
