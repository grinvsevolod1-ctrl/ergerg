"use client"

import React, { useState, useRef, useEffect } from "react"
import { Code, Palette, Smartphone, Search, Server, ArrowUpRight, Check, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

const services = [
  {
    id: "ads",
    icon: <Megaphone className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Контекстная реклама",
    subtitle: "Яндекс Директ и Google Ads",
    description: "Настраиваем и ведём рекламные кампании с бюджетами от 10 тыс. до 1+ млн BYN. Более 10 крупных клиентов.",
    features: ["Яндекс Директ", "Google Ads", "Аналитика ROI", "A/B тесты"],
    accent: "#ff6b35",
    highlighted: true,
  },
  {
    id: "web",
    icon: <Code className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Веб-разработка",
    subtitle: "Сайты и приложения",
    description: "Создаём современные сайты и веб-приложения на React, Next.js, Vue. От лендингов до сложных SaaS-платформ.",
    features: ["React / Next.js", "TypeScript", "API интеграции", "CMS системы"],
    accent: "#00ffff",
  },
  {
    id: "design",
    icon: <Palette className="w-5 h-5 md:w-6 md:h-6" />,
    title: "UI/UX Дизайн",
    subtitle: "Интерфейсы и опыт",
    description: "Проектируем интерфейсы, которые нравятся пользователям. Figma, прототипы, дизайн-системы.",
    features: ["Figma", "Прототипирование", "Дизайн-системы", "Юзабилити"],
    accent: "#ff00aa",
  },
  {
    id: "mobile",
    icon: <Smartphone className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Мобильные приложения",
    subtitle: "iOS и Android",
    description: "Разрабатываем кроссплатформенные приложения на React Native и Flutter.",
    features: ["React Native", "Flutter", "iOS / Android", "Push-уведомления"],
    accent: "#00ff88",
  },
  {
    id: "seo",
    icon: <Search className="w-5 h-5 md:w-6 md:h-6" />,
    title: "SEO оптимизация",
    subtitle: "Продвижение",
    description: "Выводим сайты в топ поисковой выдачи. Техническая оптимизация, контент-стратегия.",
    features: ["Аудит сайта", "Контент-стратегия", "Линкбилдинг", "Аналитика"],
    accent: "#ffaa00",
  },
  {
    id: "backend",
    icon: <Server className="w-5 h-5 md:w-6 md:h-6" />,
    title: "Backend разработка",
    subtitle: "Серверные решения",
    description: "Создаём надёжные серверные решения. Node.js, Python, базы данных, облачные сервисы.",
    features: ["Node.js / Python", "PostgreSQL", "AWS / Vercel", "Microservices"],
    accent: "#aa00ff",
  },

]

function ServiceCard({
  service,
  isActive,
  onToggle,
  index,
}: {
  service: (typeof services)[0]
  isActive: boolean
  onToggle: () => void
  index: number
}) {
  const isHighlighted = 'highlighted' in service && service.highlighted
  
  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card/80 cursor-pointer overflow-hidden",
        "transition-[border-color,box-shadow] duration-300",
        isHighlighted && "ring-1 ring-[#ff6b35]/30",
        isActive
          ? "border-border shadow-lg"
          : "border-border/50 hover:border-border/80"
      )}
      style={{
        animationDelay: `${index * 80}ms`,
        boxShadow: isActive ? `0 8px 40px ${service.accent}12` : isHighlighted ? `0 4px 20px ${service.accent}10` : undefined,
      }}
      onClick={onToggle}
    >
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10">
          <span className="px-2 py-0.5 text-[9px] md:text-[10px] font-semibold rounded-full bg-[#ff6b35] text-white uppercase tracking-wider">
            10+ клиентов
          </span>
        </div>
      )}
      
      {/* Top accent line */}
      <div
        className="h-0.5 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${service.accent}, transparent)`,
          opacity: isActive || isHighlighted ? 1 : 0,
        }}
      />

      <div className="relative z-10 p-4 md:p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4 md:mb-5">
          <div
            className="w-11 h-11 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-colors duration-300"
            style={{
              background: isActive ? `${service.accent}18` : "var(--secondary)",
              color: isActive ? service.accent : "var(--muted-foreground)",
            }}
          >
            {service.icon}
          </div>
          <ArrowUpRight
            className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground opacity-40 transition-opacity duration-200 group-hover:opacity-100"
            style={{ color: isActive ? service.accent : undefined }}
          />
        </div>

        {/* Title */}
        <div className="mb-3 md:mb-4">
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground mb-0.5 md:mb-1">{service.subtitle}</p>
          <h3 className="text-base md:text-xl font-semibold text-foreground">{service.title}</h3>
        </div>

        {/* Description -- always visible, clamped */}
        <p className="text-muted-foreground text-xs md:text-sm mb-4 md:mb-5 leading-relaxed line-clamp-3">
          {service.description}
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {service.features.map((feature) => (
            <span
              key={feature}
              className="inline-flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs rounded-lg bg-secondary/60 text-muted-foreground"
            >
              <Check className="w-2.5 h-2.5 md:w-3 md:h-3 flex-shrink-0" style={{ color: service.accent }} />
              {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ServicesSection() {
  const [activeService, setActiveService] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    setActiveService(prev => prev === id ? null : id)
  }

  return (
    <section id="services" className="min-h-screen py-20 md:py-28 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 md:-left-40 w-40 md:w-72 lg:w-80 h-40 md:h-72 lg:h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 md:-right-40 w-40 md:w-72 lg:w-80 h-40 md:h-72 lg:h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2.5 md:gap-3 mb-4 md:mb-5">
              <div className="w-10 md:w-12 h-0.5 bg-primary rounded-full" />
              <span className="text-primary font-mono text-xs md:text-sm tracking-wide">{"// 01. Услуги"}</span>
            </div>
            <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-balance tracking-tight">
              Полный цикл
              <span className="block text-primary">разработки</span>
            </h2>
            <p className="text-muted-foreground text-[15px] md:text-lg leading-relaxed max-w-xl">
              От идеи до запуска и поддержки. Работаем с современным стеком технологий и следим за трендами индустрии.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              isActive={activeService === service.id}
              onToggle={() => handleToggle(service.id)}
            />
          ))}
        </div>

        <div className="mt-12 md:mt-20 text-center">
          <p className="text-muted-foreground text-[15px] md:text-base mb-4 md:mb-5">Не нашли нужную услугу?</p>
          <a
            href="#contact"
            className={cn(
              "inline-flex items-center gap-2.5 px-6 py-3 md:px-8 md:py-4 rounded-full",
              "bg-primary text-primary-foreground font-semibold text-[15px] md:text-base",
              "hover:bg-primary/90 transition-all duration-300",
              "shadow-lg shadow-primary/20 hover:shadow-primary/30",
              "group"
            )}
          >
            Обсудить проект
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  )
}
