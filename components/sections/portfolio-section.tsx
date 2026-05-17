"use client"

import { useRef, useEffect, useState } from "react"
import { TrendingUp, Users, Target, Award, CheckCircle, ArrowRight, Building2, Lightbulb } from "lucide-react"
import { VelocityIcon, NetworkIcon } from "@/components/icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const stats = [
  {
    icon: Building2,
    value: "10+",
    label: "Крупных клиентов",
    description: "с рекламными бюджетами от 100 тыс. Br",
    color: "#ff6b35",
  },
  {
    icon: TrendingUp,
    value: "50+",
    label: "Проектов",
    description: "успешно реализованных за 5 лет работы",
    color: "#00ffff",
  },
  {
    icon: Target,
    value: "10М+ Br",
    label: "Рекламных бюджетов",
    description: "под нашим управлением в Яндекс Директ и Google Ads",
    color: "#00ff88",
  },
  {
    icon: Users,
    value: "100%",
    label: "Довольных клиентов",
    description: "возвращаются или рекомендуют нас",
    color: "#a78bfa",
  },
]

const achievements = [
  "Сертифицированные специалисты Яндекс Директ и Google Ads",
  "Работаем с бюджетами от 5 000 до 1+ млн Br в месяц",
  "Средний рост конверсии клиентов — 40% за первые 3 месяца",
  "Полная прозрачность: доступ к аккаунтам и ежедневная отчётность",
  "Глубокая аналитика и A/B тестирование всех кампаний",
  "Опыт в 15+ нишах: от e-commerce до B2B услуг",
]

const industries = [
  "E-commerce",
  "Недвижимость", 
  "Автодилеры",
  "Медицина",
  "Образование",
  "B2B услуги",
  "Финансы",
  "Туризм",
]

export function PortfolioSection() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.05 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="portfolio"
      className="py-20 sm:py-24 md:py-32 lg:py-36 relative overflow-hidden"
    >
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative z-10 max-w-7xl">
        {/* Header */}
        <div className={cn(
          "text-center mb-12 md:mb-16 lg:mb-20 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 tracking-wide">
            <Award className="w-3.5 h-3.5" />
            Опыт и достижения
          </span>
          <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-5 text-balance tracking-tight">
            Результаты говорят{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">за нас</span>
          </h2>
          <p className="text-muted-foreground text-[15px] md:text-lg max-w-xl lg:max-w-2xl mx-auto leading-relaxed">
            Мы не можем показать проекты из-за NDA с клиентами, но цифры и достижения 
            расскажут о нашем опыте лучше любых скриншотов.
          </p>
        </div>

        {/* Stats Grid */}
        <div className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 mb-10 sm:mb-12 md:mb-16 transition-all duration-700 delay-200",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="relative p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border/50 hover:border-border transition-all duration-300 group"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Glow effect on hover */}
              <div 
                className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ boxShadow: `0 0 40px ${stat.color}15` }}
              />
              
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl flex items-center justify-center mb-3 sm:mb-4"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" style={{ color: stat.color }} />
              </div>
              
              <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-0.5 sm:mb-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm md:text-base font-semibold text-foreground mb-0.5 sm:mb-1">
                {stat.label}
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground leading-relaxed">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Achievements + Industries */}
        <div className={cn(
          "grid lg:grid-cols-2 gap-6 md:gap-8 transition-all duration-700 delay-300",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        )}>
          {/* Achievements */}
          <div className="p-6 md:p-8 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold">Почему выбирают нас</h3>
            </div>
            
            <div className="space-y-3">
              {achievements.map((achievement, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    {achievement}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Industries + CTA */}
          <div className="flex flex-col gap-6">
            {/* Industries */}
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border/50 flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <NetworkIcon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold">Работаем в отраслях</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <span
                    key={industry}
                    className="px-3 py-1.5 text-xs md:text-sm rounded-lg bg-secondary/80 text-muted-foreground border border-border/30 hover:border-border/60 transition-colors"
                  >
                    {industry}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div 
              className="p-6 md:p-8 rounded-2xl border border-[#ff6b35]/30 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08) 0%, rgba(255,107,53,0.02) 100%)' }}
            >
              <div className="relative z-10">
                <h3 className="text-lg md:text-xl font-semibold mb-2">
                  Готовы обсудить ваш проект?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Бесплатная консультация и аудит текущих рекламных кампаний
                </p>
                <Button 
                  className="gap-2 bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white"
                  onClick={() => {
                    const element = document.getElementById('contact')
                    if (element) element.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Получить консультацию
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Trust note */}
        <div className={cn(
          "mt-12 md:mt-16 text-center transition-all duration-700 delay-400",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Мы соблюдаем строгую конфиденциальность и работаем по NDA. 
            Подробности о кейсах и результатах обсудим на личной встрече.
          </p>
        </div>
      </div>
    </section>
  )
}
