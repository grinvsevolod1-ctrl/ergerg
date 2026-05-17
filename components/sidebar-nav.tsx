"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { 
  Home, 
  Briefcase, 
  FolderKanban, 
  Users, 
  Mail, 
  Workflow, 
  Menu, 
  X,
  Phone,
  ExternalLink,
} from "lucide-react"
import { TelegramIcon, WhatsAppIcon, ViberIcon, InstagramIcon, LinkedInIcon } from "@/components/icons"
import { NexikLogo } from "@/components/nexik/logo"

interface NavItem {
  id: string
  label: string
  labelRu: string
  icon: typeof Home
  color: string
}

const navItems: NavItem[] = [
  { id: "hero", label: "Home", labelRu: "Главная", icon: Home, color: "#22d3ee" },
  { id: "services", label: "Services", labelRu: "Услуги", icon: Briefcase, color: "#a78bfa" },
  { id: "process", label: "Process", labelRu: "Процесс", icon: Workflow, color: "#34d399" },
  { id: "portfolio", label: "Experience", labelRu: "Опыт", icon: FolderKanban, color: "#fbbf24" },
  { id: "team", label: "Team", labelRu: "Команда", icon: Users, color: "#f472b6" },
  { id: "contact", label: "Contact", labelRu: "Контакты", icon: Mail, color: "#60a5fa" },
]

// Nexik product link (separate from nav items)
const nexikLink = {
  href: "/nexik",
  label: "Nexik AI",
  labelRu: "Nexik AI",
  description: "AI-ассистент 24/7",
  badge: "by Netnext",
  color: "#22d3ee",
  gradientFrom: "#22d3ee",
  gradientTo: "#06b6d4",
}

const contactInfo = {
  phone: "+375 (29) 14-14-555",
  phoneHref: "tel:+375291414555",
  email: "hello@netnext.site",
  telegram: "https://t.me/netnextadminbot",
  whatsapp: "https://wa.me/375291414555",
  viber: "viber://chat?number=%2B375291414555",
}

interface SidebarNavProps {
  activeSection: string
  onNavigate: (section: string) => void
}

// Custom Logo Component
function NetNextLogo({ expanded = false }: { expanded?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Logo Mark */}
      <div className="relative w-10 h-10 flex-shrink-0">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-accent to-primary opacity-20 blur-md" />
        
        {/* Main logo container */}
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-primary/30 flex items-center justify-center overflow-hidden">
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
          
          {/* Letter N with gradient */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="relative z-10">
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path
              d="M6 18V6h2l8 9V6h2v12h-2l-8-9v9H6z"
              fill="url(#logoGradient)"
            />
          </svg>
          
          {/* Corner accent */}
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-tl-lg opacity-60" />
        </div>
      </div>
      
      {/* Logo Text */}
      <div
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-300",
          expanded ? "opacity-100 w-auto" : "opacity-0 w-0"
        )}
      >
        <span className="text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
          NetNext
        </span>
        <span className="text-[10px] text-muted-foreground tracking-widest uppercase whitespace-nowrap">
          Studio
        </span>
      </div>
    </div>
  )
}

export function SidebarNav({ activeSection, onNavigate }: SidebarNavProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileContactOpen, setIsMobileContactOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    let resizeTimeout: ReturnType<typeof setTimeout>
    const checkMobile = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => setIsMobile(window.innerWidth < 768), 150)
    }
    setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", checkMobile)
    return () => { window.removeEventListener("resize", checkMobile); clearTimeout(resizeTimeout) }
  }, [])

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0
        setScrollProgress(progress)
        ticking = false
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const activeIndex = navItems.findIndex((item) => item.id === activeSection)
  const activeColor = navItems[activeIndex]?.color || "#22d3ee"

  const handleNavigate = (section: string) => {
    onNavigate(section)
    setIsMobileMenuOpen(false)
  }

  // ========== MOBILE ==========
  if (isMobile) {
    return (
      <>
        {/* Mobile Top Header - premium glassmorphism */}
        <header 
          className="fixed top-2 left-3 right-3 z-50 rounded-2xl backdrop-blur-xl transition-all duration-500 overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, 
              color-mix(in srgb, ${activeColor} 5%, rgba(0,0,0,0.4) 95%),
              color-mix(in srgb, ${activeColor} 8%, rgba(0,0,0,0.3) 92%)
            )`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 80px ${activeColor}08`,
            border: `1px solid color-mix(in srgb, ${activeColor} 25%, rgba(255,255,255,0.1) 75%)`,
          }}
        >
          {/* Animated gradient line on top */}
          <div 
            className="absolute top-0 left-0 right-0 h-[2px] transition-all duration-700"
            style={{
              background: `linear-gradient(90deg, transparent, ${activeColor}, transparent)`,
              opacity: 0.6,
            }}
          />
          
          <div className="flex items-center justify-between h-12 px-4">
            {/* Logo - with glow effect */}
            <div className="flex items-center gap-2.5">
              <div 
                className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500"
                style={{ 
                  background: `linear-gradient(135deg, ${activeColor}25, ${activeColor}08)`,
                  boxShadow: `0 0 20px ${activeColor}20, inset 0 1px 0 rgba(255,255,255,0.1)`,
                  border: `1px solid ${activeColor}30`,
                }}
              >
                {/* Pulse ring */}
                <div 
                  className="absolute inset-0 rounded-xl animate-pulse"
                  style={{ 
                    boxShadow: `0 0 15px ${activeColor}30`,
                    opacity: 0.5,
                  }}
                />
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" className="relative z-10">
                  <path
                    d="M6 18V6h2l8 9V6h2v12h-2l-8-9v9H6z"
                    fill={activeColor}
                    className="transition-all duration-500"
                  />
                </svg>
              </div>
              <div className="flex flex-col">
                <span 
                  className="text-sm font-bold tracking-tight transition-colors duration-500 leading-tight"
                  style={{ color: activeColor }}
                >
                  NetNext
                </span>
                <span className="text-[8px] text-muted-foreground/60 uppercase tracking-widest">
                  studio
                </span>
              </div>
            </div>
            
            {/* Current Section - animated pill */}
            <div 
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-500 overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${activeColor}15, ${activeColor}08)`,
                border: `1px solid ${activeColor}30`,
                boxShadow: `0 2px 10px ${activeColor}10`,
              }}
            >
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${activeColor}20, transparent)`,
                }}
              />
              {(() => {
                const currentItem = navItems.find(item => item.id === activeSection)
                const Icon = currentItem?.icon || Home
                return (
                  <>
                    <Icon 
                      className="w-3.5 h-3.5 transition-all duration-500 relative z-10" 
                      style={{ color: activeColor, filter: `drop-shadow(0 0 4px ${activeColor}50)` }}
                    />
                    <span 
                      className="text-[11px] font-semibold transition-colors duration-500 relative z-10"
                      style={{ color: activeColor }}
                    >
                      {currentItem?.labelRu || "Главная"}
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        </header>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50 safe-area-pb">
          <div className="flex items-stretch h-14">
            {/* Main Nav Items */}
            {navItems.slice(0, 4).map((item) => {
              const isActive = activeSection === item.id
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 relative active:scale-95 transition-transform"
                >
                  {isActive && (
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full"
                      style={{ background: item.color }}
                    />
                  )}
                  <Icon 
                    className={cn("w-5 h-5 transition-all duration-200", isActive && "scale-110")}
                    style={{ color: isActive ? item.color : "var(--muted-foreground)" }}
                  />
                  <span 
                    className="text-[10px] font-medium transition-colors"
                    style={{ color: isActive ? item.color : "var(--muted-foreground)" }}
                  >
                    {item.labelRu}
                  </span>
                </button>
              )
            })}
            
            {/* Contact Button */}
            <button
              onClick={() => setIsMobileContactOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
            >
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Связь</span>
            </button>
            
            {/* Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">Меню</span>
            </button>
          </div>
        </nav>

        {/* Mobile Contact Sheet */}
        {isMobileContactOpen && (
          <>
            <div 
              className="fixed inset-0 bg-background/80 z-50"
              onClick={() => setIsMobileContactOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border/50 rounded-t-3xl animate-in slide-in-from-bottom duration-300 safe-area-pb">
              <div className="p-5 pb-6 max-w-lg mx-auto">
                {/* Handle */}
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold">Связатьс�� с нами</h3>
                  <button
                    onClick={() => setIsMobileContactOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Contact Options */}
                <div className="space-y-3">
                  {/* Phone */}
                  <a
                    href={contactInfo.phoneHref}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <div className="font-medium">{contactInfo.phone}</div>
                      <div className="text-sm text-muted-foreground">Позвонить</div>
                    </div>
                  </a>
                  
                  {/* Email */}
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{contactInfo.email}</div>
                      <div className="text-sm text-muted-foreground">Основной email</div>
                    </div>
                  </a>
                  
                  {/* Messengers row */}
                  <div className="grid grid-cols-3 gap-2">
                    <a href={contactInfo.telegram} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-colors">
                      <TelegramIcon className="w-6 h-6 text-[#0088cc]" />
                      <span className="text-xs font-medium text-[#0088cc]">Telegram</span>
                    </a>
                    <a href={contactInfo.whatsapp} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors">
                      <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                      <span className="text-xs font-medium text-[#25D366]">WhatsApp</span>
                    </a>
                    <a href={contactInfo.viber} target="_blank" rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-[#7360F2]/10 hover:bg-[#7360F2]/20 transition-colors">
                      <ViberIcon className="w-6 h-6 text-[#7360F2]" />
                      <span className="text-xs font-medium text-[#7360F2]">Viber</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Full Menu Sheet */}
        {isMobileMenuOpen && (
          <>
            <div 
              className="fixed inset-0 bg-background/80 z-50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border/50 rounded-t-3xl animate-in slide-in-from-bottom duration-300 safe-area-pb">
              <div className="p-5 pb-6 max-w-lg mx-auto">
                {/* Handle */}
                <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
                
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <NetNextLogo expanded />
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Navigation Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all relative overflow-hidden"
                      >
                        {isActive && (
                          <div 
                            className="absolute inset-0 opacity-10"
                            style={{ background: item.color }}
                          />
                        )}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                          style={{
                            background: isActive ? `${item.color}20` : "transparent",
                            border: `1px solid ${isActive ? item.color + '40' : 'transparent'}`,
                          }}
                        >
                          <Icon 
                            className="w-5 h-5" 
                            style={{ color: isActive ? item.color : "var(--muted-foreground)" }}
                          />
                        </div>
                        <span 
                          className="text-xs font-medium"
                          style={{ color: isActive ? item.color : "var(--foreground)" }}
                        >
                          {item.labelRu}
                        </span>
                      </button>
                    )
                  })}
                </div>
                
                {/* Nexik AI Product Link - Premium Mobile Card */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Link
                    href={nexikLink.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative flex items-center gap-4 p-4 rounded-2xl transition-all overflow-hidden group active:scale-[0.98]"
                    style={{
                      background: `linear-gradient(135deg, ${nexikLink.gradientFrom}12 0%, ${nexikLink.gradientTo}08 100%)`,
                      border: `1px solid ${nexikLink.color}25`,
                    }}
                  >
                    {/* Animated shimmer effect */}
                    <div 
                      className="absolute inset-0 -translate-x-full group-active:translate-x-full transition-transform duration-700"
                      style={{
                        background: `linear-gradient(90deg, transparent 0%, ${nexikLink.color}10 50%, transparent 100%)`,
                      }}
                    />
                    
                    {/* Orb with pulsing glow */}
                    <div className="relative">
                      <div
                        className="absolute inset-0 rounded-xl animate-pulse"
                        style={{
                          background: `${nexikLink.color}30`,
                          filter: 'blur(8px)',
                        }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${nexikLink.gradientFrom}30 0%, ${nexikLink.gradientTo}20 100%)`,
                          boxShadow: `0 0 25px ${nexikLink.color}25`,
                        }}
                      >
                        <NexikLogo size={32} color={nexikLink.color} />
                      </div>
                      {/* Live indicator */}
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span 
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: nexikLink.color }}
                        />
                        <span 
                          className="relative inline-flex rounded-full h-3 w-3 border-2 border-card"
                          style={{ backgroundColor: nexikLink.color }}
                        />
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span 
                          className="font-bold text-base"
                          style={{ 
                            background: `linear-gradient(135deg, ${nexikLink.gradientFrom} 0%, ${nexikLink.gradientTo} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                          }}
                        >
                          {nexikLink.labelRu}
                        </span>
                        <span 
                          className="px-2 py-0.5 text-[10px] font-semibold rounded-full"
                          style={{ 
                            background: `${nexikLink.color}20`,
                            color: nexikLink.color,
                          }}
                        >
                          {nexikLink.badge}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {nexikLink.description}
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    )
  }

  // ========== DESKTOP ==========
  return (
    <nav
      className={cn(
        "fixed left-0 top-0 h-screen z-50",
        "hidden md:flex flex-col",
        "bg-card border-r border-border/50",
        "transition-all duration-300 ease-out",
        isExpanded ? "w-52" : "w-[72px]"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Scroll Progress */}
      <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-border/30">
        <div
          className="absolute top-0 left-0 w-full transition-all duration-150"
          style={{
            height: `${scrollProgress}%`,
            background: `linear-gradient(to bottom, #22d3ee, ${activeColor})`,
          }}
        />
      </div>

      {/* Logo Section */}
      <div className="flex items-center h-16 px-4 border-b border-border/50">
        <NetNextLogo expanded={isExpanded} />
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            const isHovered = hoveredItem === item.id
            const Icon = item.icon

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "relative flex items-center w-full h-11 rounded-xl transition-all duration-200",
                  "hover:bg-secondary/50",
                  isExpanded ? "px-3 gap-3" : "justify-center"
                )}
              >
                {/* Active Background */}
                {isActive && (
                  <div 
                    className="absolute inset-0 rounded-xl opacity-10"
                    style={{ background: item.color }}
                  />
                )}
                
                {/* Active Indicator Line */}
                {isActive && (
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                    style={{ background: item.color }}
                  />
                )}

                {/* Icon */}
                <div
                  className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 flex-shrink-0",
                    isActive && "shadow-sm"
                  )}
                  style={{
                    background: isActive ? `${item.color}15` : "transparent",
                    color: isActive || isHovered ? item.color : "var(--muted-foreground)",
                  }}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </div>

                {/* Label */}
                <div
                  className={cn(
                    "flex flex-col items-start min-w-0 transition-all duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  <span
                    className="text-sm font-medium truncate transition-colors"
                    style={{ color: isActive ? item.color : "var(--foreground)" }}
                  >
                    {item.labelRu}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {item.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Nexik AI Product Link - Premium Section */}
        <div className="mt-4 pt-4 border-t border-border/30">
          <Link
            href={nexikLink.href}
            onMouseEnter={() => setHoveredItem("nexik")}
            onMouseLeave={() => setHoveredItem(null)}
            className={cn(
              "group relative flex items-center w-full rounded-xl transition-all duration-300 overflow-hidden",
              isExpanded ? "px-3 py-2.5 gap-3" : "justify-center h-11"
            )}
          >
            {/* Animated gradient background */}
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ 
                background: `linear-gradient(135deg, ${nexikLink.gradientFrom}15 0%, ${nexikLink.gradientTo}10 100%)`,
              }}
            />
            
            {/* Animated border glow on hover */}
            <div 
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                boxShadow: `inset 0 0 0 1px ${nexikLink.color}30, 0 0 20px ${nexikLink.color}15`,
              }}
            />
            
            {/* Pulsing dot indicator (live status) */}
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="relative flex h-2 w-2">
                <span 
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ backgroundColor: nexikLink.color }}
                />
                <span 
                  className="relative inline-flex rounded-full h-2 w-2"
                  style={{ backgroundColor: nexikLink.color }}
                />
              </span>
            </div>
            
            {/* Orb Icon with glow effect */}
            <div
              className={cn(
                "relative flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 flex-shrink-0",
                "group-hover:scale-110"
              )}
              style={{
                background: `linear-gradient(135deg, ${nexikLink.gradientFrom}25 0%, ${nexikLink.gradientTo}15 100%)`,
                boxShadow: hoveredItem === "nexik" 
                  ? `0 0 25px ${nexikLink.color}40, 0 0 10px ${nexikLink.color}20` 
                  : `0 0 10px ${nexikLink.color}15`,
              }}
            >
              <NexikLogo size={24} color={nexikLink.color} />
            </div>

            {/* Label with badge */}
            <div
              className={cn(
                "flex flex-col items-start min-w-0 transition-all duration-300",
                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-semibold truncate transition-colors"
                  style={{ 
                    background: `linear-gradient(135deg, ${nexikLink.gradientFrom} 0%, ${nexikLink.gradientTo} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {nexikLink.labelRu}
                </span>
                <span 
                  className="px-1.5 py-0.5 text-[9px] font-medium rounded-md"
                  style={{ 
                    background: `${nexikLink.color}15`,
                    color: nexikLink.color,
                  }}
                >
                  {nexikLink.badge}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                {nexikLink.description}
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Contact Section */}
      <div className="border-t border-border/50 p-3 space-y-1.5">
        {/* Email -- always a full row */}
        <a
          href={`mailto:${contactInfo.email}`}
          className={cn(
            "flex items-center w-full h-10 rounded-xl transition-all duration-200 hover:bg-secondary/50",
            isExpanded ? "px-3 gap-3" : "justify-center"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          {isExpanded && (
            <span className="text-xs text-foreground truncate">{contactInfo.email}</span>
          )}
        </a>

        {/* Socials -- collapsed: vertical stack, expanded: single row with tooltips */}
        {isExpanded ? (
          <div className="flex items-center justify-center gap-1.5 px-1 pt-1">
            {[
              { href: contactInfo.telegram, icon: TelegramIcon, color: "#0088cc", bg: "#0088cc", label: "Написать в Telegram" },
              { href: contactInfo.whatsapp, icon: WhatsAppIcon, color: "#25D366", bg: "#25D366", label: "Написать в WhatsApp" },
              { href: contactInfo.viber, icon: ViberIcon, color: "#7360F2", bg: "#7360F2", label: "Написать в Viber" },
              { href: "https://instagram.com/netnext.site", icon: InstagramIcon, color: "#E4405F", bg: "#E4405F", label: "Подписаться в Instagram" },
              { href: "https://linkedin.com/company/netnext", icon: LinkedInIcon, color: "#0A66C2", bg: "#0A66C2", label: "Мы в LinkedIn" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/tip relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{ backgroundColor: `${item.bg}15` }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget
                    el.style.backgroundColor = `${item.bg}30`
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget
                    el.style.backgroundColor = `${item.bg}15`
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                  {/* Tooltip above */}
                  <div
                    className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 opacity-0 group-hover/tip:opacity-100 transition-all duration-200 translate-y-1 group-hover/tip:translate-y-0"
                    style={{ zIndex: 9999 }}
                  >
                    <div
                      className="relative whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-medium text-white shadow-xl"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.label}
                      {/* Arrow pointing down */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            {[
              { href: contactInfo.telegram, icon: TelegramIcon, color: "#0088cc" },
              { href: contactInfo.whatsapp, icon: WhatsAppIcon, color: "#25D366" },
              { href: contactInfo.viber, icon: ViberIcon, color: "#7360F2" },
            ].map((item) => {
              const Icon = item.icon
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-secondary/50"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </a>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
