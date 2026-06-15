"use client"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import {
  Search,
  TrendingUp,
  MousePointer,
  Eye,
  Users,
  Target,
  ArrowRight,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  ADS_NICHES,
  detectAdsNiche,
  getAdsExamples,
  formatNumber,
  formatCurrency,
  type AdsNiche
} from "./ads-intelligence"

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

const TYPING_SPEED = 50
const ERASE_SPEED = 25
const PAUSE_AFTER_TYPED = 2500

// ══════════════════════════════════════════════════════════════════════════════
// MINI CHART COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const MiniChart = memo(function MiniChart({ 
  data, 
  color,
  animate = true
}: { 
  data: number[]
  color: string
  animate?: boolean
}) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100
        const isMax = value === max
        
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-500"
            style={{
              height: animate ? `${Math.max(15, height)}%` : '15%',
              background: isMax ? color : `${color}40`,
              transitionDelay: animate ? `${i * 40}ms` : '0ms'
            }}
          />
        )
      })}
    </div>
  )
})

// ══════════════════════════════════════════════════════════════════════════════
// STAT CARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  color,
  delay = 0
}: {
  icon: typeof Eye
  label: string
  value: string
  subValue?: string
  trend?: number
  color: string
  delay?: number
}) {
  return (
    <div 
      className="relative bg-white/[0.02] rounded-xl p-4 border border-white/[0.06] overflow-hidden group hover:bg-white/[0.04] transition-colors animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow */}
      <div 
        className="absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity"
        style={{ background: color }}
      />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-[#666]" />
            <span className="text-xs text-[#666]">{label}</span>
          </div>
          {trend !== undefined && (
            <div className={cn(
              "flex items-center gap-0.5 text-[10px] font-medium",
              trend >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              {trend >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {subValue && (
          <div className="text-xs text-[#555] mt-1">{subValue}</div>
        )}
      </div>
    </div>
  )
})

// ══════════════════════════════════════════════════════════════════════════════
// PLATFORM BADGE
// ══════════════════════════════════════════════════════════════════════════════

const PlatformBadge = memo(function PlatformBadge({
  name,
  color,
  cpc,
  ctr,
  active = false,
  onClick
}: {
  name: string
  color: string
  cpc: number
  ctr: number
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 p-3 rounded-xl border transition-all text-left",
        active 
          ? "bg-white/[0.04] border-white/20" 
          : "bg-transparent border-white/[0.06] hover:bg-white/[0.02]"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="text-sm font-medium text-white">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-[#666]">
        <span>CPC: {cpc} BYN</span>
        <span>CTR: {ctr}%</span>
      </div>
    </button>
  )
})

// ══════════════════════════════════════════════════════════════════════════════
// MAIN WIDGET
// ══════════════════════════════════════════════════════════════════════════════

interface AdsWidgetProps {
  onContactClick?: () => void
}

export function AdsWidget({ onContactClick }: AdsWidgetProps) {
  const [input, setInput] = useState("")
  const [placeholder, setPlaceholder] = useState("")
  const [exampleIndex, setExampleIndex] = useState(0)
  const [selectedNiche, setSelectedNiche] = useState<AdsNiche | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<"yandex" | "google">("yandex")
  const [isAnimating, setIsAnimating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  const charIndexRef = useRef(0)
  const isTypingRef = useRef(true)
  const rafRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef(0)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Get examples
  const examples = useMemo(() => getAdsExamples(10), [])
  
  // Detect niche from input
  const detection = useMemo(() => {
    if (input.length > 2) {
      return detectAdsNiche(input)
    }
    return { niche: null, confidence: 0 }
  }, [input])
  
  // Update selected niche when detection changes
  useEffect(() => {
    if (detection.niche && detection.confidence > 40) {
      if (detection.niche.id !== selectedNiche?.id) {
        setIsAnimating(true)
        setTimeout(() => {
          setSelectedNiche(detection.niche)
          setShowResults(true)
          setIsAnimating(false)
        }, 200)
      }
    }
  }, [detection, selectedNiche?.id])
  
  // Typing animation
  useEffect(() => {
    if (input.length > 0 || examples.length === 0) return
    
    const currentExample = examples[exampleIndex]
    if (!currentExample) return
    
    const targetText = currentExample.name
    
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
            setExampleIndex(prev => (prev + 1) % examples.length)
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
  }, [exampleIndex, input.length, examples])
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (detection.niche) {
      setSelectedNiche(detection.niche)
      setShowResults(true)
    }
  }, [detection])
  
  const handleQuickSelect = useCallback((niche: AdsNiche) => {
    setInput(niche.name)
    setSelectedNiche(niche)
    setShowResults(true)
  }, [])
  
  const currentNiche = selectedNiche || examples[exampleIndex]
  const platformData = selectedPlatform === "yandex" ? currentNiche?.yandex : currentNiche?.google
  const IconComponent = currentNiche?.icon || Target
  const accentColor = currentNiche?.accentColor || "#ff6b35"
  
  return (
    <div className="relative w-full">
      {/* Main Container */}
      <div 
        className="relative rounded-2xl overflow-hidden bg-[#08080c] border transition-all duration-300"
        style={{ 
          borderColor: `${accentColor}20`,
          boxShadow: `0 0 60px ${accentColor}08`
        }}
      >
        {/* Header */}
        <div 
          className="relative px-5 py-4 border-b transition-colors"
          style={{ 
            borderColor: `${accentColor}10`,
            background: `linear-gradient(135deg, ${accentColor}05 0%, transparent 50%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300"
                style={{ 
                  background: `linear-gradient(135deg, ${accentColor}25 0%, ${accentColor}10 100%)`,
                  transform: isAnimating ? 'scale(0.9)' : 'scale(1)'
                }}
              >
                <IconComponent className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Анализ рекламных кампаний</div>
                <div className="text-xs text-[#666]">Данные из реальных кабинетов</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-500 font-medium">Live</span>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          {/* Search Input */}
          <form onSubmit={handleSubmit} className="mb-5">
            <div className="relative">
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors"
                style={{ color: input ? accentColor : 'rgba(255,255,255,0.3)' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholder + (input.length === 0 ? "│" : "")}
                className="w-full pl-11 pr-4 py-4 rounded-xl bg-white/[0.03] text-white text-sm placeholder:text-white/25 focus:outline-none border-2 transition-all"
                style={{ 
                  borderColor: input ? `${accentColor}40` : 'rgba(255,255,255,0.08)',
                  boxShadow: input ? `0 0 20px ${accentColor}10` : 'none'
                }}
              />
              {detection.confidence > 30 && (
                <div 
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-[10px] font-medium"
                  style={{ background: `${accentColor}20`, color: accentColor }}
                >
                  {detection.confidence > 70 ? "Найдено" : "Анализ..."}
                </div>
              )}
            </div>
          </form>
          
          {/* Quick Select Tags */}
          {!showResults && (
            <div className="flex flex-wrap gap-2 mb-5">
              {examples.slice(0, 6).map((niche) => (
                <button
                  key={niche.id}
                  onClick={() => handleQuickSelect(niche)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-xs text-[#888] hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <niche.icon className="w-3 h-3" />
                  {niche.name}
                </button>
              ))}
            </div>
          )}
          
          {/* Results Dashboard */}
          {showResults && currentNiche && platformData && (
            <div className={cn(
              "transition-all duration-300",
              isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}>
              {/* Platform Selector */}
              <div className="flex gap-2 mb-4">
                <PlatformBadge
                  name="Яндекс Директ"
                  color="#FC3F1D"
                  cpc={currentNiche.yandex.avgCpc}
                  ctr={currentNiche.yandex.ctr}
                  active={selectedPlatform === "yandex"}
                  onClick={() => setSelectedPlatform("yandex")}
                />
                <PlatformBadge
                  name="Google Ads"
                  color="#4285F4"
                  cpc={currentNiche.google.avgCpc}
                  ctr={currentNiche.google.ctr}
                  active={selectedPlatform === "google"}
                  onClick={() => setSelectedPlatform("google")}
                />
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  icon={Eye}
                  label="Показы/мес"
                  value={formatNumber(platformData.impressions)}
                  trend={24}
                  color={accentColor}
                  delay={0}
                />
                <StatCard
                  icon={MousePointer}
                  label="Клики/мес"
                  value={formatNumber(platformData.clicks)}
                  subValue={`CTR: ${platformData.ctr}%`}
                  trend={18}
                  color={accentColor}
                  delay={50}
                />
                <StatCard
                  icon={Users}
                  label="Лиды/мес"
                  value={platformData.leads.toString()}
                  subValue={`Конверсия: ${platformData.conversionRate}%`}
                  trend={32}
                  color={accentColor}
                  delay={100}
                />
                <StatCard
                  icon={Target}
                  label="Цена лида"
                  value={formatCurrency(platformData.cpl)}
                  subValue={`Бюджет: ${formatCurrency(platformData.avgBudget)}`}
                  color={accentColor}
                  delay={150}
                />
              </div>
              
              {/* ROI & Seasonality */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* ROI Card */}
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-[#666]">Средний ROI</span>
                    </div>
                    <div 
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ 
                        background: currentNiche.competition === "very_high" ? "rgba(239,68,68,0.2)" :
                                   currentNiche.competition === "high" ? "rgba(251,146,60,0.2)" :
                                   currentNiche.competition === "medium" ? "rgba(234,179,8,0.2)" :
                                   "rgba(34,197,94,0.2)",
                        color: currentNiche.competition === "very_high" ? "#ef4444" :
                               currentNiche.competition === "high" ? "#fb923c" :
                               currentNiche.competition === "medium" ? "#eab308" :
                               "#22c55e"
                      }}
                    >
                      {currentNiche.competition === "very_high" ? "Высокая конкуренция" :
                       currentNiche.competition === "high" ? "Конкуренция выше среднего" :
                       currentNiche.competition === "medium" ? "Средняя конкуренция" :
                       "Низкая конкуренция"}
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400 mb-1">
                    +{currentNiche.roi}%
                  </div>
                  <div className="text-xs text-[#555]">
                    На каждый вложенный рубль
                  </div>
                </div>
                
                {/* Seasonality */}
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06]">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-[#666]" />
                    <span className="text-xs text-[#666]">Сезонность (12 мес)</span>
                  </div>
                  <MiniChart 
                    data={currentNiche.seasonality} 
                    color={accentColor}
                    animate={showResults}
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-[#555]">
                    <span>Янв</span>
                    <span>Июн</span>
                    <span>Дек</span>
                  </div>
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.06] mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                  <span className="text-sm font-medium text-white">Рекомендации для {currentNiche.name}</span>
                </div>
                <ul className="space-y-2">
                  {currentNiche.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#888]">
                      <div 
                        className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: accentColor }}
                      />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* CTA */}
          <Button
            onClick={onContactClick}
            className="w-full py-6 text-base font-semibold group"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}CC 100%)`,
              boxShadow: `0 8px 32px ${accentColor}30`
            }}
          >
            Получить бесплатный аудит
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          {/* Footer Stats */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 text-xs text-[#666]">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>10М+ BYN под управлением</span>
            </div>
            <div 
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ color: accentColor, background: `${accentColor}12` }}
            >
              25+ ниш
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
