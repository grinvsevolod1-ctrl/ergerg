"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Home, ArrowLeft, Search, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NetworkIcon } from "@/components/icons"

// Animated glitch text effect
function GlitchText({ children }: { children: string }) {
  const [glitch, setGlitch] = useState(false)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <span className="relative inline-block">
      <span className={`relative z-10 ${glitch ? "animate-pulse" : ""}`}>
        {children}
      </span>
      {glitch && (
        <>
          <span className="absolute inset-0 text-cyan-400 translate-x-[2px] translate-y-[-2px] opacity-70 z-0">
            {children}
          </span>
          <span className="absolute inset-0 text-red-400 translate-x-[-2px] translate-y-[2px] opacity-70 z-0">
            {children}
          </span>
        </>
      )}
    </span>
  )
}

// Floating particles
function FloatingParticles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5,
  }))
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Interactive 404 animation
function Interactive404() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 20
    const y = (e.clientY - rect.top - rect.height / 2) / 20
    setMousePos({ x, y })
  }, [])
  
  return (
    <motion.div
      className="relative select-none cursor-default"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
      style={{
        transform: `perspective(1000px) rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)`,
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-cyan-500/30 via-primary/20 to-teal-500/30 rounded-full scale-150" />
      
      {/* Main 404 text */}
      <div className="relative">
        <span className="text-[12rem] md:text-[16rem] font-black leading-none tracking-tighter">
          <span className="bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
            4
          </span>
          <span className="relative inline-block mx-2 md:mx-4">
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full blur-xl opacity-50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="relative bg-gradient-to-br from-cyan-400 via-primary to-teal-400 bg-clip-text text-transparent">
              0
            </span>
          </span>
          <span className="bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent">
            4
          </span>
        </span>
      </div>
    </motion.div>
  )
}

// Quick links
const quickLinks = [
  { href: "/", label: "Главная", icon: Home, description: "Вернуться на главную" },
  { href: "/#services", label: "Услуги", icon: Search, description: "Наши услуги" },
  { href: "/#contact", label: "Связаться", icon: MessageCircle, description: "Написать нам" },
]

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("")
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect to Google search with site filter
      window.location.href = `https://www.google.com/search?q=site:netnext.site+${encodeURIComponent(searchQuery)}`
    }
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Background effects */}
      <FloatingParticles />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                           linear-gradient(to bottom, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_70%)]" />
      
      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-3xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/" className="inline-flex items-center gap-3 group">
            <NetworkIcon className="w-10 h-10 text-primary transition-transform group-hover:scale-110" />
            <span className="text-xl font-semibold text-foreground">NetNext</span>
          </Link>
        </motion.div>
        
        {/* 404 Display */}
        <Interactive404 />
        
        {/* Message */}
        <motion.div
          className="mt-6 mb-10 space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            <GlitchText>Страница не найдена</GlitchText>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Похоже, эта страница ушла в отпуск или никогда не существовала. 
            Давайте найдём то, что вам нужно.
          </p>
        </motion.div>
        
        {/* Search */}
        <motion.form
          onSubmit={handleSearch}
          className="mb-10 max-w-md mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center bg-card border border-border rounded-xl overflow-hidden">
              <Search className="w-5 h-5 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по сайту..."
                className="flex-1 px-4 py-3.5 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="mr-2 bg-primary hover:bg-primary/90"
              >
                Найти
              </Button>
            </div>
          </div>
        </motion.form>
        
        {/* Quick Links */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {quickLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative p-4 bg-card/50 border border-border/50 rounded-xl hover:border-primary/50 hover:bg-card transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity" />
              <div className="relative flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">{link.label}</span>
                <span className="text-xs text-muted-foreground">{link.description}</span>
              </div>
            </Link>
          ))}
        </motion.div>
        
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Вернуться назад
          </Button>
        </motion.div>
      </motion.div>
      
      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
