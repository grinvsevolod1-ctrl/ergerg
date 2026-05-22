"use client"

import { useEffect, useRef } from "react"
import { ArrowRight, Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GeneratorWidget } from "@/components/site-generator"

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
    <section id="hero" className="min-h-[100svh] flex items-center justify-center relative overflow-hidden pt-24 pb-20 md:pt-0 md:pb-0">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-64 md:w-80 lg:w-96 h-48 sm:h-64 md:h-80 lg:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-56 md:w-72 lg:w-80 h-40 sm:h-56 md:h-72 lg:h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-16">
          {/* Left column - text content */}
          <div className="flex-1 text-center lg:text-left">
<h1 className="text-[2rem] leading-[1.15] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-5 sm:mb-6 text-balance tracking-tight">
              <span className="text-foreground">Мы создаём</span>
              <br />
              <span className="text-primary">
                <span ref={textRef}>сайты</span>
                <span className="animate-pulse ml-0.5">|</span>
              </span>
            </h1>

            <p className="text-[15px] leading-[1.7] sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-7 sm:mb-8 md:mb-10 max-w-xl lg:max-w-2xl mx-auto lg:mx-0 text-pretty">
              Превращаем идеи в работающий бизнес. Разработка сайтов, запуск рекламы 
              и полное digital-сопровождение — от первого клика до первой продажи.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="group text-[15px] sm:text-base px-6 sm:px-7 md:px-8 h-12 sm:h-[52px] w-full sm:w-auto font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                onClick={() => onNavigate("contact")}
              >
                Обсудить проект
                <ArrowRight className="ml-2.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-[15px] sm:text-base px-6 sm:px-7 md:px-8 h-12 sm:h-[52px] bg-transparent w-full sm:w-auto font-medium hover:bg-secondary/80 transition-all"
                onClick={() => onNavigate("services")}
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

          {/* Right column - Site Generator Widget (desktop) */}
          <div className="hidden lg:block flex-1 max-w-md xl:max-w-lg">
            <GeneratorWidget />
          </div>

          {/* Mobile Generator CTA */}
          <div className="lg:hidden w-full max-w-sm mx-auto">
            <GeneratorWidget variant="compact" />
          </div>
        </div>
      </div>


    </section>
  )
}
