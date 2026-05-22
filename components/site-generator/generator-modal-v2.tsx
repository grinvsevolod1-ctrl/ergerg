"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { 
  X, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  RefreshCw,
  ChevronRight,
  Monitor,
  Smartphone,
  Tablet,
  Check,
  Search,
  Globe,
  Cpu,
  Database,
  Code2,
  Layers,
  CheckCircle2,
  AlertCircle,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Building2,
  Phone,
  Mail,
  FileText,
  QrCode,
  Copy,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"
import QRCode from "qrcode"

type Step = "form" | "generating" | "preview"
type DeviceType = "desktop" | "tablet" | "mobile"

interface UserData {
  niche: string
  companyName: string
  phone: string
  email: string
  description: string
}

const DEVICE_SIZES = {
  desktop: { width: "100%", maxWidth: "100%" },
  tablet: { width: "768px", maxWidth: "768px" },
  mobile: { width: "375px", maxWidth: "375px" },
}

const GENERATION_PHASES = [
  { text: "Поиск лучших сайтов", icon: Search, code: "search_best_sites(niche)" },
  { text: "Анализ структуры", icon: Globe, code: "analyze_structure(sites)" },
  { text: "Загрузка контента", icon: Database, code: "fetch_content(selected)" },
  { text: "Адаптация под вас", icon: Code2, code: "replace_content(userData)" },
  { text: "Финальная сборка", icon: Layers, code: "build_preview(html)" },
]

interface GeneratorModalV2Props {
  isOpen: boolean
  onClose: () => void
  initialBusiness?: string
  onOrderClick?: (userData: UserData) => void
}

export function GeneratorModalV2({ 
  isOpen, 
  onClose, 
  initialBusiness = "",
  onOrderClick 
}: GeneratorModalV2Props) {
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState<Step>("form")
  const [sessionId] = useState(() => uuidv4())
  
  // Form state
  const [userData, setUserData] = useState<UserData>({
    niche: initialBusiness,
    companyName: "",
    phone: "",
    email: "",
    description: "",
  })
  const [consent, setConsent] = useState(false)
  const [formErrors, setFormErrors] = useState<Partial<UserData>>({})
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationPhase, setGenerationPhase] = useState(0)
  const [generationError, setGenerationError] = useState<string | null>(null)
  
  // Preview state
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [currentVariant, setCurrentVariant] = useState(0)
  const [totalVariants, setTotalVariants] = useState(0)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  
  // UI state
  const [viewDevice, setViewDevice] = useState<DeviceType>("desktop")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)
  
  // Share state
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const startTimeRef = useRef<number>(0)

  // Accent color
  const accentColor = "oklch(0.75 0.18 195)"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setUserData(prev => ({ ...prev, niche: initialBusiness }))
      setStep("form")
      setPreviewHtml(null)
      setGenerationError(null)
      setFeedback(null)
      setShareUrl(null)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, initialBusiness])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: Partial<UserData> = {}
    
    if (!userData.niche.trim()) {
      errors.niche = "Укажите вашу нишу"
    }
    if (!userData.companyName.trim()) {
      errors.companyName = "Укажите название компании"
    }
    if (!userData.phone.trim()) {
      errors.phone = "Укажите телефон"
    } else if (!/^[\d\s\-\+\(\)]{7,20}$/.test(userData.phone)) {
      errors.phone = "Неверный формат телефона"
    }
    if (!userData.email.trim()) {
      errors.email = "Укажите email"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
      errors.email = "Неверный формат email"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [userData])

  // Generate site
  const handleGenerate = useCallback(async () => {
    if (!validateForm() || !consent) return
    
    setGlitchActive(true)
    setTimeout(() => setGlitchActive(false), 200)
    
    setStep("generating")
    setIsGenerating(true)
    setGenerationPhase(0)
    setGenerationError(null)
    startTimeRef.current = Date.now()

    // Animate through phases
    for (let i = 0; i < GENERATION_PHASES.length - 1; i++) {
      setGenerationPhase(i)
      await new Promise(r => setTimeout(r, 1000 + Math.random() * 500))
    }
    setGenerationPhase(GENERATION_PHASES.length - 1)

    try {
      const response = await fetch("/api/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          variantIndex: currentVariant,
          sessionId,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ошибка генерации")
      }

      setPreviewHtml(data.html)
      setCurrentVariant(data.currentVariant)
      setTotalVariants(data.totalVariants)
      setSourceUrl(data.sourceUrl)
      setStep("preview")
      
    } catch (error) {
      console.error("[Generator] Error:", error)
      setGenerationError(
        error instanceof Error ? error.message : "Произошла ошибка. Попробуйте позже."
      )
      setStep("form")
    } finally {
      setIsGenerating(false)
    }
  }, [userData, consent, validateForm, currentVariant, sessionId])

  // Get another variant
  const handleNextVariant = useCallback(async () => {
    if (currentVariant >= totalVariants - 1) {
      // No more variants, restart search
      setCurrentVariant(0)
    } else {
      setCurrentVariant(prev => prev + 1)
    }
    
    setIsGenerating(true)
    setGenerationPhase(3) // Skip to "adapting" phase
    
    try {
      const response = await fetch("/api/analyze-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          variantIndex: currentVariant + 1,
          sessionId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPreviewHtml(data.html)
        setCurrentVariant(data.currentVariant)
        setTotalVariants(data.totalVariants)
        setSourceUrl(data.sourceUrl)
        setFeedback(null)
      }
    } catch (error) {
      console.error("[Generator] Error getting variant:", error)
    } finally {
      setIsGenerating(false)
    }
  }, [userData, currentVariant, totalVariants, sessionId])

  // Handle feedback
  const handleFeedback = useCallback(async (type: "like" | "dislike") => {
    setFeedback(type)
    
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: userData.niche,
          variantUrl: sourceUrl,
          feedback: type,
          sessionId,
        }),
      })
    } catch {
      // Ignore analytics errors
    }
  }, [userData.niche, sourceUrl, sessionId])

  // Handle share
  const handleShare = useCallback(async () => {
    if (!previewHtml) return
    
    try {
      const response = await fetch("/api/preview/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: userData.niche,
          variantIndex: currentVariant,
          companyName: userData.companyName,
          html: previewHtml,
          sessionId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setShareUrl(data.shareUrl)
        
        // Generate QR code
        const qr = await QRCode.toDataURL(data.shareUrl, {
          width: 200,
          margin: 2,
          color: { dark: "#ffffff", light: "#00000000" }
        })
        setQrCodeUrl(qr)
        setShowShareModal(true)
      }
    } catch (error) {
      console.error("[Generator] Share error:", error)
    }
  }, [previewHtml, userData, currentVariant, sessionId])

  // Copy share link
  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input")
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [shareUrl])

  // Handle order
  const handleOrder = useCallback(() => {
    // Save to sessionStorage for autofill
    sessionStorage.setItem("generatorUserData", JSON.stringify({
      ...userData,
      selectedVariantUrl: sourceUrl,
      variantsViewed: currentVariant + 1,
      timeSpentSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
    }))
    
    if (onOrderClick) {
      onOrderClick(userData)
    } else {
      onClose()
      setTimeout(() => {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })
      }, 300)
    }
  }, [userData, sourceUrl, currentVariant, onOrderClick, onClose])

  // Update field
  const updateField = (field: keyof UserData, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (!isOpen || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Backdrop with scanning effect */}
      <div className="absolute inset-0 bg-[#030306]" onClick={onClose}>
        {/* Animated gradient orbs */}
        <div 
          className="absolute inset-0 opacity-30 transition-all duration-1000"
          style={{ 
            background: `
              radial-gradient(ellipse 80% 50% at 20% 30%, ${accentColor}20 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 70%, ${accentColor}15 0%, transparent 50%)
            `
          }}
        />
        
        {/* Scanning grid lines */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(${accentColor} 1px, transparent 1px),
              linear-gradient(90deg, ${accentColor} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            animation: 'gridMove 20s linear infinite'
          }}
        />
        
        {/* Horizontal scan line */}
        <div 
          className="absolute left-0 right-0 h-[2px] opacity-20 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            animation: 'scanLine 4s ease-in-out infinite',
            boxShadow: `0 0 20px ${accentColor}`
          }}
        />
      </div>

      {/* Modal Container */}
      <div 
        className={cn(
          "relative overflow-hidden shadow-2xl transition-all duration-700",
          "border border-white/10 backdrop-blur-sm",
          isFullscreen 
            ? "w-full h-full rounded-none" 
            : "w-[95vw] h-[90vh] max-w-6xl rounded-3xl md:rounded-[2rem]",
          glitchActive && "animate-glitch"
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(10,10,16,0.98) 0%, rgba(5,5,10,0.99) 100%)',
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.05),
            0 25px 50px -12px rgba(0,0,0,0.8),
            0 0 100px ${accentColor}10,
            inset 0 1px 0 rgba(255,255,255,0.05)
          `
        }}
      >
        {/* Corner accent lines */}
        <div className="absolute top-0 left-0 w-20 h-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />
          <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: `linear-gradient(180deg, ${accentColor}60, transparent)` }} />
        </div>
        <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none">
          <div className="absolute top-0 right-0 w-full h-[2px]" style={{ background: `linear-gradient(270deg, ${accentColor}60, transparent)` }} />
          <div className="absolute top-0 right-0 h-full w-[2px]" style={{ background: `linear-gradient(180deg, ${accentColor}60, transparent)` }} />
        </div>
        <div className="absolute bottom-0 left-0 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />
          <div className="absolute bottom-0 left-0 h-full w-[2px]" style={{ background: `linear-gradient(0deg, ${accentColor}60, transparent)` }} />
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 pointer-events-none">
          <div className="absolute bottom-0 right-0 w-full h-[2px]" style={{ background: `linear-gradient(270deg, ${accentColor}60, transparent)` }} />
          <div className="absolute bottom-0 right-0 h-full w-[2px]" style={{ background: `linear-gradient(0deg, ${accentColor}60, transparent)` }} />
        </div>

        {/* Glow effects */}
        <div 
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px] opacity-20 transition-all duration-1000 pointer-events-none"
          style={{ background: accentColor }}
        />
        <div 
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-10 transition-all duration-1000 pointer-events-none"
          style={{ background: accentColor }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/10">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo with pulse effect */}
            <div className="relative">
              <div 
                className="absolute inset-0 rounded-xl blur-md opacity-50 animate-pulse"
                style={{ background: accentColor }}
              />
              <div 
                className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center"
                style={{ background: accentColor }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-black" />
              </div>
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm md:text-base">AI Генератор сайтов</h2>
              <p className="text-[10px] md:text-xs text-white/50 hidden sm:block">
                {step === "preview" 
                  ? `Вариант ${currentVariant + 1} из ${totalVariants}`
                  : "Создайте превью сайта за 30 секунд"
                }
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 md:gap-2">
            {step === "preview" && (
              <>
                {/* Device toggle */}
                <div className="hidden md:flex items-center gap-1 mr-2 p-1 rounded-lg bg-white/5">
                  {(["desktop", "tablet", "mobile"] as DeviceType[]).map((device) => {
                    const Icon = device === "desktop" ? Monitor : device === "tablet" ? Tablet : Smartphone
                    return (
                      <button
                        key={device}
                        onClick={() => setViewDevice(device)}
                        className={cn(
                          "p-1.5 rounded-md transition-all",
                          viewDevice === device 
                            ? "text-black" 
                            : "text-white/50 hover:text-white"
                        )}
                        style={viewDevice === device ? { background: accentColor } : undefined}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    )
                  })}
                </div>
                
                {/* Fullscreen */}
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-all hidden md:flex"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative h-[calc(100%-57px)] md:h-[calc(100%-73px)] overflow-hidden">
          
          {/* Step: Form */}
          {step === "form" && (
            <div className="absolute inset-0 flex flex-col items-center justify-start p-4 md:p-8 overflow-y-auto">
              <div className="w-full max-w-xl py-4">
                {/* Header */}
                <div className="text-center mb-6">
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-4"
                    style={{ 
                      background: `${accentColor}10`,
                      borderColor: `${accentColor}30`
                    }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full animate-ping opacity-50" style={{ background: accentColor }} />
                      <Cpu className="relative w-3.5 h-3.5" style={{ color: accentColor }} />
                    </div>
                    <span className="text-xs font-mono" style={{ color: accentColor }}>AI_GENERATOR</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Создайте превью вашего сайта
                  </h3>
                  <p className="text-sm text-white/60">
                    Наш AI найдёт лучшие сайты в вашей нише и адаптирует под вас
                  </p>
                </div>

                {/* Error message */}
                {generationError && (
                  <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{generationError}</p>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Niche */}
                  <div>
                    <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Ваша ниша / сфера деятельности
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={userData.niche}
                      onChange={(e) => updateField("niche", e.target.value)}
                      placeholder="Например: стоматология, автосервис, психолог..."
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white placeholder:text-white/30",
                        "focus:outline-none focus:bg-white/[0.05] transition-all",
                        formErrors.niche ? "border-red-500/50" : "border-white/10 focus:border-white/20"
                      )}
                    />
                    {formErrors.niche && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.niche}</p>
                    )}
                  </div>

                  {/* Company name */}
                  <div>
                    <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Название компании
                    </label>
                    <input
                      type="text"
                      value={userData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      placeholder="Например: Клиника Здоровье"
                      className={cn(
                        "w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white placeholder:text-white/30",
                        "focus:outline-none focus:bg-white/[0.05] transition-all",
                        formErrors.companyName ? "border-red-500/50" : "border-white/10 focus:border-white/20"
                      )}
                    />
                    {formErrors.companyName && (
                      <p className="mt-1 text-xs text-red-400">{formErrors.companyName}</p>
                    )}
                  </div>

                  {/* Phone & Email row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Телефон
                      </label>
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="+375 29 123-45-67"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white placeholder:text-white/30",
                          "focus:outline-none focus:bg-white/[0.05] transition-all",
                          formErrors.phone ? "border-red-500/50" : "border-white/10 focus:border-white/20"
                        )}
                      />
                      {formErrors.phone && (
                        <p className="mt-1 text-xs text-red-400">{formErrors.phone}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <input
                        type="email"
                        value={userData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="info@company.by"
                        className={cn(
                          "w-full px-4 py-3 rounded-xl bg-white/[0.03] border text-white placeholder:text-white/30",
                          "focus:outline-none focus:bg-white/[0.05] transition-all",
                          formErrors.email ? "border-red-500/50" : "border-white/10 focus:border-white/20"
                        )}
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-xs text-red-400">{formErrors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Description (optional) */}
                  <div>
                    <label className="block text-sm text-white/60 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Краткое описание
                      <span className="text-white/30">(необязательно)</span>
                    </label>
                    <textarea
                      value={userData.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Чем занимается ваша компания, какие услуги предоставляете..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all resize-none"
                    />
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="sr-only"
                      />
                      <div 
                        className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          consent 
                            ? "border-transparent" 
                            : "border-white/30 group-hover:border-white/50"
                        )}
                        style={consent ? { background: accentColor } : undefined}
                      >
                        {consent && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </div>
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      Я согласен с{" "}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        className="underline hover:no-underline"
                        style={{ color: accentColor }}
                      >
                        политикой обработки данных
                      </a>
                    </span>
                  </label>

                  {/* Submit button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!consent || isGenerating}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-black transition-all",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "hover:scale-[1.02] active:scale-[0.98]"
                    )}
                    style={{ background: accentColor }}
                  >
                    <span className="flex items-center justify-center gap-2">
                      Создать превью сайта
                    </span>
                  </button>

                  <p className="text-xs text-white/40 text-center">
                    Генерация занимает около 30 секунд. Ваши данные защищены.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step: Generating */}
          {step === "generating" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8">
              <div className="w-full max-w-md text-center">
                {/* Animated icon */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div 
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: accentColor }}
                  />
                  <div 
                    className="absolute inset-2 rounded-full animate-pulse opacity-50"
                    style={{ background: `${accentColor}40` }}
                  />
                  <div 
                    className="relative w-full h-full rounded-full flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                      border: `2px solid ${accentColor}40`
                    }}
                  >
                    <Cpu className="w-10 h-10" style={{ color: accentColor }} />
                  </div>
                </div>

                {/* Progress phases */}
                <div className="space-y-3 mb-8">
                  {GENERATION_PHASES.map((phase, index) => {
                    const Icon = phase.icon
                    const isActive = index === generationPhase
                    const isComplete = index < generationPhase
                    
                    return (
                      <div 
                        key={index}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                          isActive && "bg-white/5",
                          isComplete && "opacity-60"
                        )}
                      >
                        <div 
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                            isComplete && "bg-green-500/20",
                            isActive && "animate-pulse"
                          )}
                          style={isActive ? { background: `${accentColor}30` } : undefined}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                          ) : isActive ? (
                            <Icon className="w-4 h-4" style={{ color: accentColor }} />
                          ) : (
                            <Icon className="w-4 h-4 text-white/30" />
                          )}
                        </div>
                        <div className="text-left flex-1">
                          <p className={cn(
                            "text-sm font-medium transition-colors",
                            isActive ? "text-white" : isComplete ? "text-white/60" : "text-white/40"
                          )}>
                            {phase.text}
                          </p>
                          <p className="text-xs font-mono text-white/30">{phase.code}</p>
                        </div>
                        {isActive && (
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: accentColor }} />
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Terminal-like log */}
                <div className="p-4 rounded-xl bg-black/50 border border-white/10 text-left overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-white/40 ml-2 font-mono">terminal</span>
                  </div>
                  <div className="font-mono text-xs text-white/60 space-y-1">
                    <p><span style={{ color: accentColor }}>$</span> netnext generate --niche=&quot;{userData.niche}&quot;</p>
                    <p className="text-green-400">→ {GENERATION_PHASES[generationPhase]?.text}...</p>
                    <p className="animate-pulse">█</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === "preview" && previewHtml && (
            <div className="absolute inset-0 flex flex-col">
              {/* Preview iframe */}
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden bg-[#0a0a0f]">
                <div 
                  className="relative h-full bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
                  style={DEVICE_SIZES[viewDevice]}
                >
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-same-origin"
                    title="Site Preview"
                  />
                </div>
              </div>

              {/* Action bar */}
              <div className="flex-shrink-0 border-t border-white/10 bg-black/50 backdrop-blur-sm p-3 md:p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 max-w-4xl mx-auto">
                  {/* Left: Feedback */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/40 hidden sm:block">Нравится?</span>
                    <button
                      onClick={() => handleFeedback("like")}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        feedback === "like" 
                          ? "bg-green-500/20 text-green-400" 
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback("dislike")}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        feedback === "dislike" 
                          ? "bg-red-500/20 text-red-400" 
                          : "text-white/50 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Center: Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNextVariant}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                      <span className="hidden sm:inline">Другой вариант</span>
                    </button>
                    
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Поделиться</span>
                    </button>
                  </div>

                  {/* Right: Order button */}
                  <button
                    onClick={handleOrder}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-black transition-all hover:scale-105"
                    style={{ background: accentColor }}
                  >
                    <span>Заказать такой сайт</span>
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && shareUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
            <div 
              className="w-full max-w-sm mx-4 p-6 rounded-2xl border border-white/10"
              style={{ background: 'rgba(10,10,16,0.98)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Поделиться превью</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* QR Code */}
              {qrCodeUrl && (
                <div className="flex justify-center mb-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                  </div>
                </div>
              )}
              
              {/* Link */}
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    copied 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              
              <p className="text-xs text-white/40 text-center">
                Ссылка действительна 24 часа
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Global styles */}
      <style jsx global>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        @keyframes scanLine {
          0%, 100% { top: -2px; }
          50% { top: 100%; }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        .animate-glitch {
          animation: glitch 0.2s ease-in-out;
        }
      `}</style>
    </div>,
    document.body
  )
}
