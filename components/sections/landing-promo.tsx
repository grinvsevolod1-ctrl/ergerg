"use client"

/**
 * LandingPromo — промо-блок акции «Лендинг за 600 BYN».
 *
 * Размещается высоко в визуальной иерархии главной (сразу после hero), чтобы
 * оффер был виден на первом экране рядом со входом в чат (AI-орб).
 *
 * CTA переиспользует существующий вход в чат: проп `onOpenChat` вызывает
 * setIsChatOpen(true) на главной — новый поток не создаётся.
 */

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowRight, Check, Clock, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reachGoal, YM_GOALS } from "@/lib/analytics"

interface LandingPromoProps {
  /** Открывает существующий чат на главной (тот же поток, что и AI-орб). */
  onOpenChat: () => void
}

const INCLUDED = [
  "Дизайн под ключ и адаптив под все устройства",
  "Тексты, формы заявок и подключение аналитики",
  "Запуск за 5 дней и бесплатная консультация",
] as const

const HIGHLIGHTS = [
  { icon: Clock, label: "Запуск за 5 дней" },
  { icon: Zap, label: "Готов к рекламе" },
] as const

export function LandingPromo({ onOpenChat }: LandingPromoProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const handleCta = () => {
    // Переиспользуем цель «обсудить проект» — CTA ведёт в диалог.
    reachGoal(YM_GOALS.clickCtaDiscuss, { source: "promo_landing_600" })
    onOpenChat()
  }

  return (
    <section
      id="landing"
      aria-labelledby="promo-landing-title"
      className="relative scroll-mt-24 md:scroll-mt-16 px-4 sm:px-6 md:px-8 lg:px-20 pt-4 pb-12 md:pt-8 md:pb-20"
    >
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 28 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="container mx-auto max-w-5xl"
      >
        {/* Внешняя обёртка с анимированным градиентным кантом */}
        <div className="group relative rounded-3xl p-px overflow-hidden">
          {/* Бегущий блик по канту */}
          <div
            className="pointer-events-none absolute -inset-[40%] opacity-60"
            style={{
              background:
                "conic-gradient(from 0deg, transparent 0deg, var(--primary) 70deg, transparent 140deg, transparent 220deg, #ff6b35 290deg, transparent 360deg)",
              animation: "spin-slow 8s linear infinite",
            }}
          />
          <div
            className="pointer-events-none absolute inset-px rounded-[calc(1.5rem-1px)]"
            style={{ background: "var(--card)" }}
          />

          {/* Контент карточки */}
          <div className="relative rounded-[calc(1.5rem-1px)] bg-card/95 backdrop-blur-sm overflow-hidden">
            {/* Фоновые акценты */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-24 -left-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -right-10 w-72 h-72 bg-[#ff6b35]/10 rounded-full blur-3xl" />
              <div className="absolute inset-0 cyber-grid opacity-40" />
            </div>

            <div className="relative grid lg:grid-cols-[1.45fr_1fr] gap-8 lg:gap-10 p-6 sm:p-8 md:p-10">
              {/* ── Левая часть: оффер ── */}
              <div className="flex flex-col">
                {/* Бейдж акции */}
                <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-primary tracking-wide">
                    Акция месяца
                  </span>
                </div>

                <h2
                  id="promo-landing-title"
                  className="text-3xl sm:text-4xl md:text-[2.75rem] leading-[1.1] font-bold tracking-tight text-balance mb-4"
                >
                  <span className="text-foreground">Лендинг за </span>
                  <span className="text-primary">600&nbsp;BYN</span>
                </h2>

                <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground max-w-md mb-6 text-pretty">
                  Продающая страница под ключ, которая собирает заявки с первого дня.
                  Современный дизайн, адаптив и аналитика — всё включено, без скрытых
                  доплат и долгих согласований.
                </p>

                {/* Что входит */}
                <ul className="space-y-2.5 mb-7">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </span>
                      <span className="text-sm text-foreground/90 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button
                    size="lg"
                    onClick={handleCta}
                    className="group/cta h-12 sm:h-[52px] px-6 sm:px-7 text-[15px] sm:text-base font-medium w-full sm:w-auto shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                  >
                    Заказать в чате
                    <ArrowRight className="ml-2.5 w-4 h-4 group-hover/cta:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Ответим за пару минут — прямо в диалоге
                  </p>
                </div>
              </div>

              {/* ── Правая часть: цена ── */}
              <div className="relative flex items-center justify-center">
                {/* Пульсирующие кольца за ценой */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="w-56 h-56 rounded-full border border-primary/15 animate-ring-expand" />
                  <div className="absolute w-44 h-44 rounded-full border border-primary/10" />
                </div>

                <div className="relative w-full max-w-[280px] rounded-2xl bg-background/60 border border-border/60 p-6 sm:p-7 text-center backdrop-blur-sm">
                  <div className="text-sm text-muted-foreground mb-1">Стоимость под ключ</div>

                  {/* Старая цена */}
                  <div className="text-sm text-muted-foreground/70 line-through decoration-[#ff6b35]/70">
                    от 1200 BYN
                  </div>

                  {/* Новая цена */}
                  <div className="flex items-end justify-center gap-1.5 my-1">
                    <span className="text-5xl sm:text-6xl font-bold text-primary tracking-tight leading-none">
                      600
                    </span>
                    <span className="text-lg sm:text-xl font-semibold text-foreground/80 mb-1.5">
                      BYN
                    </span>
                  </div>

                  {/* Бейдж выгоды */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff6b35]/15 border border-[#ff6b35]/25 text-xs font-semibold text-[#ff6b35] mb-5">
                    Выгода 50%
                  </div>

                  {/* Преимущества */}
                  <div className="grid grid-cols-2 gap-2">
                    {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-card/60 border border-border/50"
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="text-[11px] leading-tight text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
