"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Lightbulb, Code2, Rocket, Check, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  {
    id: 1,
    icon: <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Обсуждение",
    description: "Созваниваемся, обсуждаем задачу, собираем требования и определяем цели проекта",
    details: ["Бриф проекта", "Анализ конкурентов", "Определение целей", "Оценка сроков"],
    duration: "1-2 дня",
    color: "#00ffff",
  },
  {
    id: 2,
    icon: <Lightbulb className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Проектирование",
    description: "Создаём прототипы, проектируем архитектуру и готовим дизайн-макеты",
    details: ["Wireframes", "UI/UX дизайн", "Архитектура", "Согласование"],
    duration: "1-2 недели",
    color: "#ff00aa",
  },
  {
    id: 3,
    icon: <Code2 className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Разработка",
    description: "Пишем код, интегрируем API, тестируем функционал и оптимизируем производительность",
    details: ["Frontend", "Backend", "Интеграции", "Тестирование"],
    duration: "2-8 недель",
    color: "#00ff88",
  },
  {
    id: 4,
    icon: <Rocket className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Запуск",
    description: "Деплоим проект, настраиваем мониторинг и обеспечиваем плавный старт",
    details: ["Деплой", "SEO-настройка", "Аналитика", "Поддержка"],
    duration: "1-3 дня",
    color: "#ffaa00",
  },
]

function ProcessStep({
  step,
  index,
  isActive,
  isCompleted,
  onActivate,
  isMobile,
}: {
  step: (typeof steps)[0]
  index: number
  isActive: boolean
  isCompleted: boolean
  onActivate: () => void
  isMobile: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  // Mobile card layout
  if (isMobile) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative p-4 rounded-2xl border transition-all duration-500",
          isActive ? "border-border bg-card/50" : "border-border/30 bg-card/20",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
        style={{ transitionDelay: `${index * 100}ms` }}
        onClick={onActivate}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
              "border-2 transition-all duration-500"
            )}
            style={{
              borderColor: isActive || isCompleted ? step.color : "var(--border)",
              background: isActive ? `${step.color}15` : undefined,
              color: isActive || isCompleted ? step.color : "var(--muted-foreground)",
            }}
          >
            {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
            <div
              className={cn(
                "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold",
                "flex items-center justify-center"
              )}
              style={{
                background: isActive || isCompleted ? step.color : "var(--secondary)",
                color: isActive || isCompleted ? "black" : "var(--muted-foreground)",
              }}
            >
              {step.id}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${step.color}20`,
                  color: step.color,
                }}
              >
                {step.duration}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

            <div
              className={cn(
                "grid grid-cols-2 gap-1.5 mt-3 overflow-hidden transition-all duration-500",
                isActive ? "max-h-32 opacity-100" : "max-h-0 opacity-0"
              )}
            >
              {step.details.map((detail, i) => (
                <div
                  key={detail}
                  className="flex items-center gap-1.5 text-[11px]"
                  style={{
                    transitionDelay: `${i * 50}ms`,
                  }}
                >
                  <Check className="w-3 h-3 shrink-0" style={{ color: step.color }} />
                  <span className="text-foreground truncate">{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop timeline layout
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex gap-6 cursor-pointer group",
        "transition-all duration-500",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
      )}
      style={{ transitionDelay: `${index * 150}ms` }}
      onClick={onActivate}
    >
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "relative w-16 h-16 rounded-2xl flex items-center justify-center",
            "border-2 transition-all duration-500",
            isActive ? "scale-110" : "hover:scale-105",
            isCompleted && "bg-secondary/50"
          )}
          style={{
            borderColor: isActive || isCompleted ? step.color : "var(--border)",
            background: isActive ? `${step.color}15` : undefined,
            boxShadow: isActive ? `0 0 30px ${step.color}30` : undefined,
            color: isActive || isCompleted ? step.color : "var(--muted-foreground)",
          }}
        >
          {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
          
          <div
            className={cn(
              "absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold",
              "flex items-center justify-center transition-all duration-300"
            )}
            style={{
              background: isActive || isCompleted ? step.color : "var(--secondary)",
              color: isActive || isCompleted ? "black" : "var(--muted-foreground)",
            }}
          >
            {step.id}
          </div>
        </div>
        
        {index < steps.length - 1 && (
          <div className="relative w-0.5 h-32 mt-4">
            <div className="absolute inset-0 bg-border" />
            <div
              className="absolute top-0 left-0 w-full transition-all duration-700 ease-out"
              style={{
                height: isCompleted ? "100%" : "0%",
                background: `linear-gradient(to bottom, ${step.color}, ${steps[index + 1].color})`,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 pb-16">
        <div className="flex items-center gap-3 mb-2">
          <h3
            className={cn(
              "text-xl font-semibold transition-colors duration-300",
              isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            {step.title}
          </h3>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded-full"
            style={{
              background: `${step.color}20`,
              color: step.color,
            }}
          >
            {step.duration}
          </span>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 max-w-md">{step.description}</p>
        
        <div
          className={cn(
            "grid grid-cols-2 gap-2 overflow-hidden transition-all duration-500",
            isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {step.details.map((detail, i) => (
            <div
              key={detail}
              className={cn(
                "flex items-center gap-2 text-sm",
                "transform transition-all duration-300"
              )}
              style={{
                transitionDelay: `${i * 50}ms`,
                opacity: isActive ? 1 : 0,
                transform: isActive ? "translateX(0)" : "translateX(-10px)",
              }}
            >
              <Check className="w-4 h-4" style={{ color: step.color }} />
              <span className="text-foreground">{detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const checkMobile = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => setIsMobile(window.innerWidth < 768), 150)
    }
    setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", checkMobile)
    return () => { window.removeEventListener("resize", checkMobile); clearTimeout(timeout) }
  }, [])

  const handleActivate = (index: number) => {
    setActiveStep(index)
    const newCompleted = steps.slice(0, index).map((_, i) => i)
    setCompletedSteps(newCompleted)
  }

  useEffect(() => {
    if (isMobile) return // Don't auto-rotate on mobile
    
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        const next = (prev + 1) % steps.length
        setCompletedSteps(steps.slice(0, next).map((_, i) => i))
        return next
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [isMobile])

  return (
    <section id="process" className="py-20 md:py-28 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-48 md:w-72 lg:w-96 h-48 md:h-72 lg:h-96 bg-primary/3 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-48 md:w-72 lg:w-96 h-48 md:h-72 lg:h-96 bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative">
        <div className="flex flex-col lg:flex-row gap-10 md:gap-16 lg:gap-24">
          <div className="lg:w-1/3 lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
              <div className="w-10 md:w-12 h-0.5 bg-primary rounded-full" />
              <span className="text-primary font-mono text-xs md:text-sm tracking-wide">{"// 02. Процесс"}</span>
            </div>
            <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6 tracking-tight">
              Как мы
              <span className="block text-primary">работаем</span>
            </h2>
            <p className="text-muted-foreground text-[15px] md:text-base leading-relaxed mb-6 md:mb-8 max-w-md">
              Прозрачный процесс от первого звонка до запуска. Вы всегда в курсе статуса проекта.
            </p>
            
            <div className="hidden lg:flex items-center gap-2">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    index === activeStep ? "scale-125" : "hover:scale-110"
                  )}
                  style={{
                    background: index === activeStep || completedSteps.includes(index) 
                      ? step.color 
                      : "var(--border)",
                  }}
                  onClick={() => handleActivate(index)}
                />
              ))}
            </div>
          </div>

          <div className="lg:w-2/3">
            {isMobile === null ? (
              /* SSR-safe: render mobile cards by default (they work at both sizes) */
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <ProcessStep
                    key={step.id}
                    step={step}
                    index={index}
                    isActive={activeStep === index}
                    isCompleted={completedSteps.includes(index)}
                    onActivate={() => handleActivate(index)}
                    isMobile={true}
                  />
                ))}
              </div>
            ) : isMobile ? (
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <ProcessStep
                    key={step.id}
                    step={step}
                    index={index}
                    isActive={activeStep === index}
                    isCompleted={completedSteps.includes(index)}
                    onActivate={() => handleActivate(index)}
                    isMobile={true}
                  />
                ))}
              </div>
            ) : (
              steps.map((step, index) => (
                <ProcessStep
                  key={step.id}
                  step={step}
                  index={index}
                  isActive={activeStep === index}
                  isCompleted={completedSteps.includes(index)}
                  onActivate={() => handleActivate(index)}
                  isMobile={false}
                />
              ))
            )}
          </div>
        </div>

        <div className="mt-12 md:mt-20 p-6 md:p-10 rounded-2xl md:rounded-3xl bg-gradient-to-r from-primary/10 via-card to-accent/10 border border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 md:gap-8 text-center md:text-left">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">Готовы начать?</h3>
              <p className="text-[15px] md:text-base text-muted-foreground">Обсудим ваш проект бесплатно</p>
            </div>
            <a
              href="#contact"
              className={cn(
                "inline-flex items-center gap-2.5 px-7 py-3.5 md:px-8 md:py-4 rounded-full",
                "bg-primary text-primary-foreground font-semibold text-[15px] md:text-lg",
                "hover:bg-primary/90 transition-all duration-300",
                "group shadow-lg shadow-primary/25 hover:shadow-primary/35 w-full md:w-auto justify-center"
              )}
            >
              Начать проект
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
