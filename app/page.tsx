"use client"

// Chat component v2
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"
import { CookieConsent } from "@/components/cookie-consent"
import { HeroSection } from "@/components/sections/hero-section"
import { PromotionSection } from "@/components/sections/promotion-section"
import { ServicesSection } from "@/components/sections/services-section"
import { ProcessSection } from "@/components/sections/process-section"
import { PortfolioSection } from "@/components/sections/portfolio-section"
import { TeamSection } from "@/components/sections/team-section"
import { ContactSection } from "@/components/sections/contact-section"
import { Footer } from "@/components/footer"
import { FloatingCTA } from "@/components/floating-cta"
import { AIOrbCanvas } from "@/components/ai-orb"
import { NexikDemoChat } from "@/components/nexik/demo-chat"

export default function Home() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isOrbMinimized, setIsOrbMinimized] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")
  const [showContent, setShowContent] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
    setTimeout(() => {
      setIsOrbMinimized(true)
      setTimeout(() => setShowContent(true), 400)
    }, 100)
  }, [])

  const handleOrbClick = useCallback(() => {
    setIsChatOpen(prev => !prev)
  }, [])
  
  const handleStartOnboarding = useCallback(() => {
    // Close chat and navigate to /start
    setIsChatOpen(false)
    router.push('/nexik/start')
  }, [router])

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section)
    const element = document.getElementById(section)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  // Throttled scroll handler with RAF
  useEffect(() => {
    let ticking = false
    const sections = ["hero", "services", "process", "portfolio", "team", "contact"]

    const handleScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const scrollPosition = window.scrollY + window.innerHeight / 3
        for (const section of sections) {
          const element = document.getElementById(section)
          if (element) {
            const { offsetTop, offsetHeight } = element
            if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
              setActiveSection(section)
              break
            }
          }
        }
        ticking = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <AIOrbCanvas
        isLoading={isLoading}
        isMinimized={isOrbMinimized}
        onLoadingComplete={handleLoadingComplete}
        onOrbClick={handleOrbClick}
        isChatOpen={isChatOpen}
      />

      {/* Nexik Demo Chat - умный чат с памятью */}
      <NexikDemoChat
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
        onStartOnboarding={handleStartOnboarding}
      />

      {showContent && (
        <SidebarNav activeSection={activeSection} onNavigate={handleNavigate} />
      )}

      {showContent && <CookieConsent />}
      {showContent && <FloatingCTA />}

      <main
        ref={mainRef}
        className={`transition-all duration-700 ease-out ${
          showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {showContent && (
            <div className="md:pl-[72px] pt-14 md:pt-0 pb-24 md:pb-0">
            <HeroSection onNavigate={handleNavigate} />
            <PromotionSection onNavigate={handleNavigate} />
            <ServicesSection />
            <ProcessSection />
            <PortfolioSection />
            <TeamSection />
            <ContactSection />
            <Footer />
          </div>
        )}
      </main>
    </>
  )
}
