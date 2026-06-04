"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Rocket, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  CheckCircle2,
  Zap,
  Target,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StartProjectSectionProps {
  onNavigate: (section: string) => void
}

// Popular business suggestions for quick input
const businessSuggestions = [
  "Автосервис",
  "Ресторан",
  "Салон красоты",
  "Интернет-магазин",
  "Стоматология",
  "Фитнес-клуб",
  "Юридическая фирма",
  "Строительная компания"
]

export function StartProjectSection({ onNavigate }: StartProjectSectionProps) {
  const [businessInput, setBusinessInput] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)

  // Animated placeholder text
  const placeholders = [
    "Шиномонтаж",
    "Кофейня",
    "IT-компания",
    "Стоматология",
    "Фитнес-клуб"
  ]
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (businessInput) return // Don't animate if user is typing

    const currentWord = placeholders[placeholderIndex]
    let charIndex = 0
    let isDeleting = false
    let timeout: NodeJS.Timeout

    const type = () => {
      if (isDeleting) {
        setAnimatedPlaceholder(currentWord.substring(0, charIndex - 1))
        charIndex--
        if (charIndex === 0) {
          isDeleting = false
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
        }
        timeout = setTimeout(type, 30)
      } else {
        setAnimatedPlaceholder(currentWord.substring(0, charIndex + 1))
        charIndex++
        if (charIndex === currentWord.length) {
          timeout = setTimeout(() => {
            isDeleting = true
            type()
          }, 2000)
          return
        }
        timeout = setTimeout(type, 80)
      }
    }

    type()
    return () => clearTimeout(timeout)
  }, [placeholderIndex, businessInput])

  const handleSubmit = () => {
    if (!businessInput.trim()) return
    
    // Save to sessionStorage for ContactSection
    sessionStorage.setItem('projectBusiness', businessInput.trim())
    sessionStorage.setItem('projectSource', 'start-widget')
    
    // Navigate to contact section
    onNavigate("contact")
  }

  const handleSuggestionClick = (suggestion: string) => {
    setBusinessInput(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const filteredSuggestions = businessSuggestions.filter(s => 
    s.toLowerCase().includes(businessInput.toLowerCase()) && businessInput.length > 0
  )

  return (
    <section 
      id="start-project" 
      className="py-16 sm:py-20 md:py-24 lg:py-32 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-10 sm:mb-12 md:mb-14">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Zap className="w-4 h-4" />
              <span>Быстрый старт</span>
            </motion.div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-5 text-balance">
              Запустите проект{" "}
              <span className="text-primary">за 7 дней</span>
            </h2>
            
            <p className="text-muted-foreground text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-pretty">
              Расскажите о вашем бизнесе — мы подготовим персональное предложение 
              и смету уже сегодня
            </p>
          </div>

          {/* Main Widget Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={cn(
              "relative bg-card/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl",
              "border border-border/50 shadow-2xl shadow-black/5",
              "p-6 sm:p-8 md:p-10 lg:p-12",
              "transition-all duration-500",
              isHovering && "border-primary/30 shadow-primary/10"
            )}
          >
            {/* Animated border glow */}
            <div className={cn(
              "absolute inset-0 rounded-2xl sm:rounded-3xl opacity-0 transition-opacity duration-500",
              "bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20",
              isHovering && "opacity-100"
            )} style={{ padding: 1 }}>
              <div className="w-full h-full bg-card rounded-2xl sm:rounded-3xl" />
            </div>

            <div className="relative z-10">
              {/* Input Section */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Ваш бизнес или идея проекта
                </label>
                
                <div className="relative">
                  <div className={cn(
                    "relative flex items-center rounded-xl sm:rounded-2xl transition-all duration-300",
                    "bg-background border-2",
                    isFocused 
                      ? "border-primary shadow-lg shadow-primary/10" 
                      : "border-border hover:border-border/80"
                  )}>
                    <div className="absolute left-4 sm:left-5 text-muted-foreground/50">
                      <Target className="w-5 h-5" />
                    </div>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={businessInput}
                      onChange={(e) => {
                        setBusinessInput(e.target.value)
                        setShowSuggestions(true)
                      }}
                      onFocus={() => {
                        setIsFocused(true)
                        setShowSuggestions(true)
                      }}
                      onBlur={() => {
                        setIsFocused(false)
                        // Delay hiding to allow click on suggestions
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder={businessInput ? "" : animatedPlaceholder}
                      className={cn(
                        "w-full bg-transparent py-4 sm:py-5 pl-12 sm:pl-14 pr-4",
                        "text-base sm:text-lg font-medium",
                        "placeholder:text-muted-foreground/40",
                        "focus:outline-none",
                        "transition-all duration-200"
                      )}
                    />
                    
                    {businessInput && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-4 text-primary"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </motion.div>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "absolute top-full left-0 right-0 mt-2 z-50",
                          "bg-popover border border-border rounded-xl shadow-xl",
                          "overflow-hidden"
                        )}
                      >
                        {filteredSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={cn(
                              "w-full px-4 py-3 text-left text-sm",
                              "hover:bg-accent/50 transition-colors",
                              "flex items-center gap-3",
                              index !== filteredSuggestions.length - 1 && "border-b border-border/50"
                            )}
                          >
                            <Sparkles className="w-4 h-4 text-primary/60" />
                            <span>{suggestion}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Quick Suggestions Chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {businessSuggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className={cn(
                        "px-3 py-1.5 text-xs sm:text-sm rounded-full",
                        "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground",
                        "border border-border/50 hover:border-border",
                        "transition-all duration-200",
                        businessInput === suggestion && "bg-primary/10 border-primary/30 text-primary"
                      )}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={!businessInput.trim()}
                className={cn(
                  "w-full h-14 sm:h-16 text-base sm:text-lg font-semibold",
                  "rounded-xl sm:rounded-2xl",
                  "shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
                  "transition-all duration-300",
                  "group",
                  !businessInput.trim() && "opacity-50 cursor-not-allowed"
                )}
              >
                <Rocket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Обсудить проект
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>

              {/* Features Row */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { 
                      icon: Clock, 
                      title: "Смета за 2 часа", 
                      desc: "Быстрый расчёт стоимости" 
                    },
                    { 
                      icon: Shield, 
                      title: "Гарантия качества", 
                      desc: "Поддержка 30 дней" 
                    },
                    { 
                      icon: Target, 
                      title: "100+ проектов", 
                      desc: "Опыт в любой нише" 
                    },
                  ].map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex items-start gap-3 sm:gap-4"
                    >
                      <div className="flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm sm:text-base">{feature.title}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{feature.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 sm:mt-10 text-center"
          >
            <p className="text-sm text-muted-foreground">
              Отвечаем в течение 2 часов в рабочее время
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
