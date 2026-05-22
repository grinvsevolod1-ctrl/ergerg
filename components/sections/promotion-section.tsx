"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Megaphone, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Check,
  Globe,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdsWidget } from "@/components/ads-generator/ads-widget"

interface PromotionSectionProps {
  onNavigate: (section: string) => void
}

export function PromotionSection({ onNavigate }: PromotionSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const stats = [
    { value: "10М+", label: "Рекламных бюджетов", sublabel: "под управлением", icon: BarChart3 },
    { value: "25+", label: "Ниш и отраслей", sublabel: "с подтверждённым ROI", icon: Users },
    { value: "340%", label: "Средний ROI", sublabel: "по всем клиентам", icon: TrendingUp },
  ]

  const benefits = [
    "Бесплатный аудит текущих кампаний",
    "Прозрачная отчётность каждую неделю",
    "Работаем на результат, не на показы",
    "Персональный менеджер 24/7",
  ]

  return (
    <section 
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6b35]/20 to-transparent" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#ff6b35]/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 lg:px-20 relative z-10">
        {/* Header */}
        <div 
          className={`text-center mb-16 md:mb-20 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff6b35]/10 border border-[#ff6b35]/20 mb-6">
            <Megaphone className="w-4 h-4 text-[#ff6b35]" />
            <span className="text-sm font-medium text-[#ff6b35]">Уже есть сайт?</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-balance">
            <span className="text-foreground">Узнайте потенциал </span>
            <span className="text-[#ff6b35]">рекламы</span>
            <span className="text-foreground"> в вашей нише</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Введите вашу сферу бизнеса и получите реальные данные из рекламных кабинетов: 
            стоимость клика, конверсию, ROI и рекомендации по запуску.
          </p>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left side - Widget */}
          <div 
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            }`}
          >
            <AdsWidget onContactClick={() => onNavigate("contact")} />
          </div>

          {/* Right side - Content */}
          <div 
            className={`transition-all duration-700 delay-300 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            }`}
          >
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div 
                    key={stat.label}
                    className={`text-center p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] transition-all duration-500 hover:bg-white/[0.04] ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${400 + i * 100}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/10 flex items-center justify-center mx-auto mb-3">
                      <Icon className="w-5 h-5 text-[#ff6b35]" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-xs text-[#888] leading-tight">{stat.label}</div>
                    <div className="text-[10px] text-[#555]">{stat.sublabel}</div>
                  </div>
                )
              })}
            </div>

            {/* Benefits */}
            <div className="space-y-4 mb-10">
              <h3 className="text-lg font-semibold text-white mb-4">Почему выбирают нас</h3>
              {benefits.map((benefit, i) => (
                <div 
                  key={benefit}
                  className={`flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] transition-all duration-500 hover:bg-white/[0.04] ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${600 + i * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#ff6b35]/15 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#ff6b35]" />
                  </div>
                  <span className="text-[#ccc]">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div 
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "1000ms" }}
            >
              <Button 
                size="lg"
                className="group bg-[#ff6b35] hover:bg-[#ff6b35]/90 text-white px-8 py-6 text-base"
                onClick={() => onNavigate("contact")}
              >
                Получить аудит бесплатно
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="bg-transparent border-white/10 hover:bg-white/5 px-8 py-6 text-base"
                onClick={() => onNavigate("portfolio")}
              >
                <Globe className="w-5 h-5 mr-2" />
                Смотреть кейсы
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
