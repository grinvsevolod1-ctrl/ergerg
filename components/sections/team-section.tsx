"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  X,
  ArrowRight,
  Code2,
  Palette,
  BarChart3,
  Megaphone,
  Shield,
  Headphones,
  Users,
} from "lucide-react"

/* ── Department leads ── */
const departments = [
  {
    id: "dev",
    name: "Артём К.",
    role: "Руководитель разработки",
    department: "Разработка",
    teamSize: 14,
    icon: Code2,
    color: "#00e5ff",
    initials: "АК",
    description:
      "Отвечает за техническую архитектуру и весь цикл разработки. Под руководством Артёма -- фронтенд, бэкенд и мобильная команды.",
    stack: ["React", "Next.js", "Node.js", "PostgreSQL", "React Native"],
    experience: "8 лет",
  },
  {
    id: "design",
    name: "Марина Л.",
    role: "Арт-директор",
    department: "Дизайн",
    teamSize: 8,
    icon: Palette,
    color: "#ff4da6",
    initials: "МЛ",
    description:
      "Формирует визуальный стиль всех проектов. Команда Марины создаёт UI/UX, брендинг и motion-дизайн.",
    stack: ["Figma", "After Effects", "Framer", "Illustrator"],
    experience: "7 лет",
  },
  {
    id: "pm",
    name: "Дмитрий В.",
    role: "Head of PM",
    department: "Менеджмент",
    teamSize: 6,
    icon: BarChart3,
    color: "#fbbf24",
    initials: "ДВ",
    description:
      "Управляет проектами от первого звонка до запуска. Гарантирует соблюдение сроков, бюджета и качества.",
    stack: ["Agile", "Jira", "Notion", "Клиентские коммуникации"],
    experience: "9 лет",
  },
  {
    id: "marketing",
    name: "Алина С.",
    role: "Руководитель маркетинга",
    department: "Маркетинг",
    teamSize: 5,
    icon: Megaphone,
    color: "#a78bfa",
    initials: "АС",
    description:
      "Стратегия продвижения, SEO, контент и performance-маркетинг. Помогает клиентам расти после запуска.",
    stack: ["SEO", "Google Ads", "Аналитика", "Контент-стратегия"],
    experience: "6 лет",
  },
  {
    id: "qa",
    name: "Игорь П.",
    role: "QA Lead",
    department: "Тестирование",
    teamSize: 4,
    icon: Shield,
    color: "#34d399",
    initials: "ИП",
    description:
      "Ноль багов в продакшене -- девиз команды. Автотесты, нагрузочное тестирование, code review.",
    stack: ["Playwright", "Jest", "CI/CD", "Нагрузочные тесты"],
    experience: "5 лет",
  },
  {
    id: "support",
    name: "Ольга Р.",
    role: "Руководитель поддержки",
    department: "Поддержка",
    teamSize: 3,
    icon: Headphones,
    color: "#38bdf8",
    initials: "ОР",
    description:
      "Техподдержка и сопровождение после запуска. Мониторинг, обновления, оперативное решение вопросов.",
    stack: ["Мониторинг", "SLA", "Обновления", "Консультации"],
    experience: "4 года",
  },
]

const totalPeople = departments.reduce((s, d) => s + d.teamSize, 0)

/* ── Main section ── */
export function TeamSection() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [popoverPos, setPopoverPos] = useState<{
    top: number
    left: number
    side: "right" | "left" | "bottom"
  } | null>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const selectedMember = departments.find((d) => d.id === selectedId) || null

  const calcPosition = useCallback((id: string) => {
    const card = cardRefs.current.get(id)
    if (!card) return null
    const rect = card.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const popW = Math.min(340, vw - 32)
    const popH = 320

    // Desktop: try right, then left
    if (vw >= 768) {
      const rightSpace = vw - rect.right
      if (rightSpace >= popW + 20) {
        return {
          top: Math.max(16, Math.min(rect.top, vh - popH - 16)),
          left: rect.right + 12,
          side: "right" as const,
        }
      }
      if (rect.left >= popW + 20) {
        return {
          top: Math.max(16, Math.min(rect.top, vh - popH - 16)),
          left: rect.left - popW - 12,
          side: "left" as const,
        }
      }
    }
    // Fallback: bottom centered
    return {
      top: rect.bottom + 12,
      left: Math.max(16, rect.left + rect.width / 2 - popW / 2),
      side: "bottom" as const,
    }
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      if (selectedId === id) {
        setSelectedId(null)
        setPopoverPos(null)
        return
      }
      const pos = calcPosition(id)
      setSelectedId(id)
      setPopoverPos(pos)
    },
    [selectedId, calcPosition]
  )

  // Close on click outside
  useEffect(() => {
    if (!selectedId) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      const card = cardRefs.current.get(selectedId)
      if (card?.contains(target)) return
      setSelectedId(null)
      setPopoverPos(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [selectedId])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null)
        setPopoverPos(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!selectedId) return
    const recalc = () => {
      const pos = calcPosition(selectedId)
      setPopoverPos(pos)
    }
    window.addEventListener("scroll", recalc, true)
    window.addEventListener("resize", recalc)
    return () => {
      window.removeEventListener("scroll", recalc, true)
      window.removeEventListener("resize", recalc)
    }
  }, [selectedId, calcPosition])

  const handleScrollToContact = () => {
    const el = document.getElementById("contact")
    if (el) el.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section id="team" className="py-20 md:py-28 lg:py-32 overflow-visible">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16 lg:mb-20">
          <span className="text-primary font-mono text-xs md:text-sm mb-4 block tracking-wider">
            {"// Команда"}
          </span>
          <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-balance text-foreground tracking-tight">
            <span className="text-primary">{totalPeople}</span> специалистов.{" "}
            <span className="text-primary">6</span> направлений.
          </h2>
          <p className="text-muted-foreground text-[15px] md:text-lg leading-relaxed max-w-lg mx-auto">
            У каждого направления свой лид и своя зона ответственности.
            Нажмите на карточку, чтобы узнать больше.
          </p>
        </div>

        {/* Department grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 max-w-4xl mx-auto">
          {departments.map((dept) => {
            const Icon = dept.icon
            const isActive = selectedId === dept.id
            return (
              <button
                key={dept.id}
                ref={(el) => {
                  if (el) cardRefs.current.set(dept.id, el)
                }}
                onClick={() => handleSelect(dept.id)}
                className={cn(
                  "group relative text-left rounded-2xl border transition-all duration-300 cursor-pointer",
                  "p-4 md:p-5",
                  isActive
                    ? "bg-card shadow-xl scale-[1.03] z-20"
                    : "bg-card/50 hover:bg-card/80 hover:shadow-lg active:scale-[0.97]"
                )}
                style={{
                  borderColor: isActive ? `${dept.color}50` : undefined,
                  boxShadow: isActive
                    ? `0 8px 32px ${dept.color}15, 0 0 0 1px ${dept.color}20`
                    : undefined,
                }}
              >
                {/* Subtle glow */}
                {isActive && (
                  <div
                    className="absolute inset-0 rounded-2xl opacity-[0.06] pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at center, ${dept.color}, transparent 70%)` }}
                  />
                )}

                <div className="relative z-10">
                  {/* Icon + count badge */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className={cn(
                        "w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        isActive ? "scale-110 shadow-lg" : "group-hover:scale-105"
                      )}
                      style={{
                        background: `${dept.color}15`,
                        color: dept.color,
                        boxShadow: isActive ? `0 4px 16px ${dept.color}20` : undefined,
                      }}
                    >
                      <Icon className="w-5 h-5 md:w-5.5 md:h-5.5" />
                    </div>
                    <div
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-medium"
                      style={{
                        background: `${dept.color}10`,
                        color: dept.color,
                        border: `1px solid ${dept.color}18`,
                      }}
                    >
                      <Users className="w-3 h-3" />
                      {dept.teamSize}
                    </div>
                  </div>

                  {/* Name + role */}
                  <h3 className="text-sm md:text-[15px] font-bold text-foreground mb-0.5 leading-tight">
                    {dept.name}
                  </h3>
                  <p className="text-[11px] md:text-xs text-muted-foreground mb-2.5 leading-snug">
                    {dept.role}
                  </p>

                  {/* Department label */}
                  <div
                    className="inline-flex items-center gap-1.5 text-[10px] md:text-[11px] font-mono font-semibold uppercase tracking-wider"
                    style={{ color: `${dept.color}` }}
                  >
                    <div className="w-1 h-1 rounded-full" style={{ background: dept.color }} />
                    {dept.department}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Floating popover */}
        {selectedMember && popoverPos && (
          <div
            ref={popoverRef}
            className="fixed z-[60] animate-in fade-in zoom-in-95 duration-200"
            style={{
              top: popoverPos.top,
              left: popoverPos.left,
              width: Math.min(340, typeof window !== "undefined" ? window.innerWidth - 32 : 340),
            }}
          >
            <div
              className="rounded-2xl border bg-card shadow-2xl shadow-black/30 overflow-hidden"
              style={{ borderColor: `${selectedMember.color}25` }}
            >
              {/* Color strip */}
              <div className="h-1" style={{ background: selectedMember.color }} />

              <div className="p-5">
                {/* Close */}
                <button
                  onClick={() => {
                    setSelectedId(null)
                    setPopoverPos(null)
                  }}
                  className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Avatar + Name */}
                <div className="flex items-center gap-3.5 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${selectedMember.color}30, ${selectedMember.color}08)`,
                      color: selectedMember.color,
                      boxShadow: `0 4px 20px ${selectedMember.color}15`,
                    }}
                  >
                    {selectedMember.initials}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground text-base">{selectedMember.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedMember.role}</p>
                    <p
                      className="text-[11px] font-medium mt-0.5"
                      style={{ color: selectedMember.color }}
                    >
                      {selectedMember.department}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
                  {selectedMember.description}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" style={{ color: selectedMember.color }} />
                    <span className="font-medium text-foreground">{selectedMember.teamSize}</span>
                    <span>в команде</span>
                  </div>
                  <div className="w-px h-4 bg-border" />
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{selectedMember.experience}</span>
                    {" "}опыта
                  </div>
                </div>

                {/* Stack */}
                <div className="flex flex-wrap gap-1.5">
                  {selectedMember.stack.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 text-[11px] rounded-lg font-medium"
                      style={{
                        background: `${selectedMember.color}10`,
                        color: selectedMember.color,
                        border: `1px solid ${selectedMember.color}15`,
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overlay for mobile when popover is open */}
        {selectedId && popoverPos && (
          <div
            className="fixed inset-0 z-[59] bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => {
              setSelectedId(null)
              setPopoverPos(null)
            }}
          />
        )}

        {/* Join CTA */}
        <div className="mt-14 md:mt-20 max-w-2xl mx-auto">
          <div className="relative p-6 md:p-8 rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg md:text-xl font-bold mb-1 text-foreground">
                  Хотите в команду?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Мы всегда ищем сильных специалистов. Напишите нам -- расскажем о текущих позициях.
                </p>
              </div>
              <button
                onClick={handleScrollToContact}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.97] transition-all flex-shrink-0"
              >
                Откликнуться
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
