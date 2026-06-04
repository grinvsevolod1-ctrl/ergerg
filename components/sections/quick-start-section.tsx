"use client"

import { useCallback } from "react"
import { GeneratorWidget } from "@/components/site-generator"

interface QuickStartSectionProps {
  onNavigate: (section: string) => void
}

export function QuickStartSection({ onNavigate }: QuickStartSectionProps) {
  const handleNavigateToContact = useCallback(() => {
    onNavigate("contact")
  }, [onNavigate])

  return (
    <section className="relative py-16 sm:py-20 md:py-28 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 xl:gap-20">
          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-left max-w-xl lg:max-w-none">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-5 sm:mb-6">
              <span className="text-xs sm:text-sm font-medium text-primary">Быстрый старт</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 text-balance">
              Запустите проект{" "}
              <span className="text-primary">за 7 дней</span>
            </h2>
            
            <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 text-pretty max-w-lg mx-auto lg:mx-0">
              Расскажите о вашем бизнесе, и мы подготовим персональное предложение 
              со сметой уже сегодня. Работаем быстро и качественно.
            </p>
            
            {/* Features list */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0">
              {[
                { icon: "🚀", text: "Запуск за 7 дней" },
                { icon: "💎", text: "Премиум качество" },
                { icon: "🎯", text: "Под ваши задачи" },
                { icon: "🤝", text: "Полная поддержка" },
              ].map((item) => (
                <div 
                  key={item.text}
                  className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-secondary/30 border border-border/50"
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Generator Widget */}
          <div className="w-full max-w-md lg:flex-shrink-0">
            <GeneratorWidget onNavigateToContact={handleNavigateToContact} />
          </div>
        </div>
      </div>
    </section>
  )
}
