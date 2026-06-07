"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { reachGoal, YM_GOALS } from "@/lib/analytics"
import { NexikCharacter } from "@/components/sections/nexik-character"

interface HeroSectionProps {
  onNavigate: (section: string) => void
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const words = ["сайты", "рекламу", "приложения", "бизнес"]
    let wordIndex = 0
    let charIndex = 0
    let isDeleting = false
    let timerId: ReturnType<typeof setTimeout>

    const type = () => {
      if (!textRef.current) return

      const currentWord = words[wordIndex]
      
      if (isDeleting) {
        textRef.current.textContent = currentWord.substring(0, charIndex - 1)
        charIndex--
      } else {
        textRef.current.textContent = currentWord.substring(0, charIndex + 1)
        charIndex++
      }

      let timeout = isDeleting ? 50 : 100

      if (!isDeleting && charIndex === currentWord.length) {
        timeout = 2000
        isDeleting = true
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false
        wordIndex = (wordIndex + 1) % words.length
        timeout = 500
      }

      timerId = setTimeout(type, timeout)
    }

    type()
    return () => clearTimeout(timerId)
  }, [])

  return (
    <section
      id="hero"
      style={{ backgroundColor: "#040609" }}
      className="min-h-[100svh] flex items-center justify-center relative overflow-hidden pt-24 pb-20 md:pt-0 md:pb-0"
    >
      {/* Soft green ambient glow on the LEFT only (desktop/tablet ≥lg). Hidden on
          mobile so it never bleeds onto the video. ~15% smaller and pushed further
          left so it can't reach the video and reveal its frame on the right. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 hidden lg:block"
        style={{
          background:
            "radial-gradient(59.5% 76.5% at 9% 48%, rgba(45, 212, 191, 0.14) 0%, rgba(16, 185, 129, 0.07) 38%, rgba(4, 6, 9, 0) 70%)",
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative z-10">
        <div className="grid lg:grid-cols-2 items-center gap-8 lg:gap-12 max-w-6xl mx-auto">
          {/* Character — appears first on mobile (above text), right column on desktop.
              z-0 keeps it BELOW the text/buttons so any overflow never covers the UI. */}
          <div className="order-1 lg:order-2 relative z-0 flex justify-center lg:justify-end">
            <NexikCharacter className="w-[270px] sm:w-[350px] md:w-[420px] lg:w-full lg:max-w-[610px]" />
          </div>

          {/* Text content — z-20 keeps it ABOVE the enlarged video at all times */}
          <div className="order-2 lg:order-1 relative z-20 flex flex-col items-center text-center lg:items-start lg:text-left">
            <h1 className="text-[2rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold mb-5 sm:mb-6 text-balance tracking-tight">
              <span className="text-foreground">Мы создаём</span>
              <br />
              <span className="text-primary">
                <span ref={textRef}>сайты</span>
                <span className="animate-pulse ml-0.5">|</span>
              </span>
            </h1>

            <p className="text-[15px] leading-[1.7] sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-7 sm:mb-8 md:mb-10 max-w-2xl lg:max-w-xl text-pretty">
              Превращаем идеи в работающий бизнес. Разработка сайтов, запуск рекламы 
              и полное digital-сопровождение — от первого клика до первой продажи.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start w-full sm:w-auto">
              <Button 
                size="lg" 
                className="group text-[15px] sm:text-base px-6 sm:px-7 md:px-8 h-12 sm:h-[52px] w-full sm:w-auto font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => {
                  reachGoal(YM_GOALS.clickCtaDiscuss)
                  onNavigate("contact")
                }}
              >
                Обсудить проект
                <ArrowRight className="ml-2.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-[15px] sm:text-base px-6 sm:px-7 md:px-8 h-12 sm:h-[52px] bg-transparent w-full sm:w-auto font-medium hover:bg-secondary/80 transition-all"
                onClick={() => {
                  reachGoal(YM_GOALS.clickCtaPortfolio)
                  onNavigate("services")
                }}
              >
                <Code2 className="mr-2 w-4 h-4" />
                Наши услуги
              </Button>
            </div>

            <div className="mt-10 sm:mt-12 md:mt-16 grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-sm sm:max-w-md md:max-w-lg mx-auto lg:mx-0">
              {[
                { value: "10+", label: "Клиентов" },
                { value: "10М+", label: "Рекламы" },
                { value: "5 лет", label: "Опыта" },
              ].map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary tracking-tight">{stat.value}</div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
