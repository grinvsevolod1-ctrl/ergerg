"use client"

import { ArrowRight } from "lucide-react"
import type { GeneratedSite, ColorScheme } from "../generator-types"

interface PreviewHeroProps {
  data: GeneratedSite["hero"]
  businessName: string
  colorScheme: ColorScheme
}

export function PreviewHero({ data, businessName, colorScheme }: PreviewHeroProps) {
  return (
    <section 
      className="relative min-h-[60vh] flex items-center justify-center px-6 py-16 overflow-hidden"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--preview-primary)]/10 via-transparent to-transparent" />
      
      {/* Decorative orb */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
        style={{ background: `radial-gradient(circle, var(--preview-primary) 0%, transparent 70%)` }}
      />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Logo/Name badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--preview-primary)" }}
          />
          <span className="text-sm font-medium text-white/80">{businessName}</span>
        </div>
        
        {/* Main headline */}
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          {data.headline}
        </h1>
        
        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
          {data.subheadline}
        </p>
        
        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            className="px-8 py-4 rounded-xl font-semibold text-black transition-all hover:scale-105 flex items-center gap-2 group"
            style={{ background: "var(--preview-primary)" }}
          >
            {data.ctaText}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="px-8 py-4 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">
            Узнать больше
          </button>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
    </section>
  )
}
