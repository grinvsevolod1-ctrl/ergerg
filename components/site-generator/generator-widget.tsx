"use client"

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react"
import { ArrowRight, Wand2, Clock, Zap, Search, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BUSINESS_THEMES,
  detectBusinessTheme,
  getSuggestions,
  getRandomExamples,
  getTheme,
  type BusinessTheme,
  type Suggestion,
  type MatchResult
} from "./business-intelligence"

// ══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CONFIG
// ══════════════════════════════════════════════════════════════════════════════

const TYPING_SPEED = 45
const ERASE_SPEED = 20
const PAUSE_AFTER_TYPED = 2500

// ══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS - CSS-only animations, memoized for performance
// ══════════════════════════════════════════════════════════════════════════════

const ConfidenceMeter = memo(function ConfidenceMeter({ 
  confidence, 
  accentColor 
}: { 
  confidence: number
  accentColor: string 
}) {
  const segments = 5
  const filledSegments = Math.ceil((confidence / 100) * segments)
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 rounded-full transition-all duration-300"
            style={{
              background: i < filledSegments ? accentColor : 'rgba(255,255,255,0.1)',
              transform: i < filledSegments ? 'scaleY(1)' : 'scaleY(0.6)'
            }}
          />
        ))}
      </div>
      <span 
        className="text-[10px] font-medium transition-colors"
        style={{ color: confidence > 50 ? accentColor : 'rgba(255,255,255,0.4)' }}
      >
        {confidence > 80 ? 'Определено' : confidence > 50 ? 'Вероятно' : 'Анализ...'}
      </span>
    </div>
  )
})

const SuggestionsList = memo(function SuggestionsList({
  suggestions,
  onSelect,
  accentColor
}: {
  suggestions: Suggestion[]
  onSelect: (text: string) => void
  accentColor: string
}) {
  if (suggestions.length === 0) return null
  
  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0c12] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(suggestion.text)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors group"
        >
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: `${accentColor}15` }}
          >
            {(() => {
              const theme = getTheme(suggestion.theme)
              const Icon = theme.icon
              return <Icon className="w-4 h-4" style={{ color: accentColor }} />
            })()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{suggestion.text}</div>
            <div className="text-[10px] text-white/40">{suggestion.category}</div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
        </button>
      ))}
    </div>
  )
})

// Dynamic UI preview based on theme
const DynamicUIPreview = memo(function DynamicUIPreview({ 
  theme,
  isTransforming
}: { 
  theme: BusinessTheme
  isTransforming: boolean 
}) {
  const Icon = theme.icon
  const [SecondaryIcon1, SecondaryIcon2, SecondaryIcon3] = theme.secondaryIcons
  
  return (
    <div 
      className="relative min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 rounded-xl overflow-hidden transition-all duration-500"
      style={{ 
        background: `linear-gradient(180deg, ${theme.accentColor}08 0%, transparent 100%)`,
        border: `1px solid ${theme.accentColor}15`,
        opacity: isTransforming ? 0 : 1,
        transform: isTransforming ? 'scale(0.95)' : 'scale(1)'
      }}
    >
      {/* Category badge */}
      <div 
        className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 rounded-full text-[8px] sm:text-[9px] font-medium"
        style={{ background: `${theme.accentColor}20`, color: theme.accentColor }}
      >
        {theme.category}
      </div>
      
      {/* Main content */}
      <div className="flex items-start gap-3 sm:gap-4">
        <div 
          className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${theme.accentColor}30 0%, ${theme.accentColor}10 100%)`,
            boxShadow: `0 4px 20px ${theme.accentColor}20`
          }}
        >
          <Icon className="w-5 h-5 sm:w-7 sm:h-7" style={{ color: theme.accentColor }} />
        </div>
        
        <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
          <div>
            <div className="text-xs sm:text-sm font-medium text-white truncate">{theme.name}</div>
            <div className="text-[9px] sm:text-[10px] text-white/40 mt-0.5">Сделаем быстро и качественно</div>
          </div>
          
          {/* Mini stats */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {[SecondaryIcon1, SecondaryIcon2, SecondaryIcon3].map((SIcon, i) => (
              <div 
                key={i}
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md animate-fade-in-up"
                style={{ 
                  background: `${theme.accentColor}10`,
                  animationDelay: `${i * 100}ms`
                }}
              >
                <SIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" style={{ color: theme.accentColor }} />
                <span className="text-[8px] sm:text-[9px] text-white/50">
                  {i === 0 ? 'Дизайн' : i === 1 ? 'Функции' : 'Запуск'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mt-3 sm:mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full animate-progress-bar"
          style={{ background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.accentColor}40)` }}
        />
      </div>
    </div>
  )
})

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

interface GeneratorWidgetProps {
  variant?: "default" | "compact"
  onNavigateToContact?: () => void
}

export function GeneratorWidget({ variant = "default", onNavigateToContact }: GeneratorWidgetProps) {
  const [input, setInput] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [nicheIndex, setNicheIndex] = useState(0)
  const [isTransforming, setIsTransforming] = useState(false)
  const [prevThemeKey, setPrevThemeKey] = useState<string>("default")
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  
  // Refs for optimized animation
  const charIndexRef = useRef(0)
  const isTypingRef = useRef(true)
  const rafRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get examples once on mount
  const examples = useMemo(() => getRandomExamples(12), [])
  
  // Detect business theme with confidence
  const matchResult: MatchResult = useMemo(() => {
    if (input.length > 2) {
      return detectBusinessTheme(input)
    }
    return {
      theme: examples[nicheIndex]?.theme || 'default',
      confidence: 0,
      matchedKeywords: []
    }
  }, [input, nicheIndex, examples])
  
  const theme = getTheme(matchResult.theme)
  const IconComponent = theme.icon

  // Theme transformation effect
  useEffect(() => {
    if (matchResult.theme !== prevThemeKey) {
      setIsTransforming(true)
      const timer = setTimeout(() => {
        setIsTransforming(false)
        setPrevThemeKey(matchResult.theme)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [matchResult.theme, prevThemeKey])

  // Autocomplete suggestions with debounce
  useEffect(() => {
    if (input.length < 2 || !isFocused) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    
    const debounceTimer = setTimeout(() => {
      const results = getSuggestions(input, 5)
      setSuggestions(results)
      setShowSuggestions(results.length > 0)
    }, 150)
    
    return () => clearTimeout(debounceTimer)
  }, [input, isFocused])

  // Optimized typing animation using RAF
  useEffect(() => {
    if (input.length > 0 || examples.length === 0) return

    const currentNiche = examples[nicheIndex]
    if (!currentNiche) return
    
    const targetText = currentNiche.text

    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastTimeRef.current
      const speed = isTypingRef.current ? TYPING_SPEED : ERASE_SPEED

      if (elapsed >= speed) {
        lastTimeRef.current = timestamp

        if (isTypingRef.current) {
          if (charIndexRef.current < targetText.length) {
            charIndexRef.current++
            setPlaceholder(targetText.slice(0, charIndexRef.current))
          } else {
            setTimeout(() => {
              isTypingRef.current = false
              rafRef.current = requestAnimationFrame(animate)
            }, PAUSE_AFTER_TYPED)
            return
          }
        } else {
          if (charIndexRef.current > 0) {
            charIndexRef.current--
            setPlaceholder(targetText.slice(0, charIndexRef.current))
          } else {
            isTypingRef.current = true
            setNicheIndex(prev => (prev + 1) % examples.length)
            return
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    charIndexRef.current = 0
    isTypingRef.current = true
    lastTimeRef.current = performance.now()
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [nicheIndex, input.length, examples])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowSuggestions(false)
    
    // Save business to sessionStorage
    if (input.trim()) {
      sessionStorage.setItem('netnext_business', input.trim())
      sessionStorage.setItem('netnext_business_theme', matchResult.theme)
    }
    
    // Navigate to contact form
    if (onNavigateToContact) {
      onNavigateToContact()
    } else {
      // Fallback: scroll to contact section
      const contactSection = document.getElementById('contact')
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [input, matchResult.theme, onNavigateToContact])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit(e as unknown as React.FormEvent)
    }
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }, [handleSubmit])

  const handleSuggestionSelect = useCallback((text: string) => {
    setInput(text)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }, [])

  // Compact variant for mobile
  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 sm:py-5 rounded-2xl border border-white/10 bg-white/[0.03] active:bg-white/10 transition-all group touch-manipulation shadow-lg shadow-black/10"
      >
        <div 
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ 
            background: `linear-gradient(135deg, ${theme.accentColor}20 0%, ${theme.accentColor}10 100%)`,
            boxShadow: `0 4px 16px ${theme.accentColor}15`
          }}
        >
          <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: theme.accentColor }} />
        </div>
        <div className="flex-1 text-left min-w-0">
          <div className="font-semibold text-white text-sm sm:text-[15px]">Быстрый старт проекта</div>
          <div className="text-xs sm:text-sm text-white/50 mt-0.5">Сделаем за 7 дней</div>
        </div>
        <ArrowRight className="w-5 h-5 text-white/30 group-active:translate-x-1 transition-transform flex-shrink-0" />
      </button>
    )
  }

  return (
    <div className="relative w-full max-w-md">
      {/* Glow effect */}
      <div 
        className="absolute -inset-4 rounded-3xl blur-2xl transition-all duration-500 pointer-events-none"
        style={{ 
          background: `radial-gradient(circle, ${theme.accentColor}30 0%, transparent 70%)`,
          opacity: isTransforming ? 0.9 : 0.5
        }}
      />
      
      {/* Main Container */}
      <div 
        className="relative rounded-2xl overflow-hidden bg-[#08080c] border transition-all duration-300"
        style={{ 
          borderColor: `${theme.accentColor}25`,
          boxShadow: `0 0 40px ${theme.accentColor}10, 0 20px 40px -15px rgba(0,0,0,0.6)`,
          transform: isTransforming ? 'scale(0.98)' : 'scale(1)'
        }}
      >
        {/* Corner accents */}
        <div 
          className="absolute top-0 left-0 w-8 sm:w-10 h-8 sm:h-10 border-t-2 border-l-2 rounded-tl-2xl transition-colors"
          style={{ borderColor: `${theme.accentColor}40` }}
        />
        <div 
          className="absolute bottom-0 right-0 w-8 sm:w-10 h-8 sm:h-10 border-b-2 border-r-2 rounded-br-2xl transition-colors"
          style={{ borderColor: `${theme.accentColor}40` }}
        />

        {/* Header */}
        <div 
          className="relative px-3 sm:px-4 py-2.5 sm:py-3 border-b transition-colors"
          style={{ 
            borderColor: `${theme.accentColor}10`,
            background: `linear-gradient(135deg, ${theme.accentColor}05 0%, transparent 50%)`
          }}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex gap-1 sm:gap-1.5">
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/10" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/10" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white/10" />
            </div>
            
            <div 
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300"
              style={{ opacity: isTransforming ? 0 : 1 }}
            >
              <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: theme.accentColor }} />
              <span className="text-[10px] sm:text-xs font-medium text-white/60 truncate">{theme.name}</span>
            </div>
            
            <div 
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold"
              style={{ background: `${theme.accentColor}15`, color: theme.accentColor }}
            >
              <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">7 дней</span>
              <span className="sm:hidden">7д</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative p-4 sm:p-5">
          {/* Dynamic UI Preview */}
          <div className="mb-4 sm:mb-5">
            <DynamicUIPreview theme={theme} isTransforming={isTransforming} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="relative">
              <div className="relative">
                <Search 
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                  style={{ color: input ? theme.accentColor : 'rgba(255,255,255,0.3)' }}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                  placeholder={placeholder + (input.length === 0 ? "|" : "")}
                  className="w-full pl-10 sm:pl-11 pr-4 py-3.5 sm:py-4 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-white/25 focus:outline-none border-2 transition-all"
                  style={{ 
                    borderColor: input ? `${theme.accentColor}50` : 'rgba(255,255,255,0.08)',
                    boxShadow: input ? `0 0 20px ${theme.accentColor}10` : 'none'
                  }}
                />
                {input && matchResult.confidence > 0 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block">
                    <ConfidenceMeter confidence={matchResult.confidence} accentColor={theme.accentColor} />
                  </div>
                )}
              </div>
              
              {/* Suggestions dropdown */}
              {showSuggestions && (
                <SuggestionsList 
                  suggestions={suggestions}
                  onSelect={handleSuggestionSelect}
                  accentColor={theme.accentColor}
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl font-semibold text-white active:scale-[0.98] transition-all touch-manipulation hover:brightness-110"
              style={{ 
                background: `linear-gradient(135deg, ${theme.accentColor} 0%, ${theme.accentColor}CC 100%)`,
                boxShadow: `0 8px 28px ${theme.accentColor}35, 0 2px 8px rgba(0,0,0,0.2)`
              }}
            >
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-[15px]">Обсудить проект</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </form>

          {/* Stats */}
          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/5 flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-white/40">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Запуск за 7 дней</span>
            </div>
            <div 
              className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full"
              style={{ color: theme.accentColor, background: `${theme.accentColor}15` }}
            >
              100+ ниш
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
