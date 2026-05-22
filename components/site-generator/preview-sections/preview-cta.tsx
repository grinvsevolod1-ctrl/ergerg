"use client"

import { ArrowRight, Mail, Phone } from "lucide-react"
import type { GeneratedSite, ColorScheme } from "../generator-types"

interface PreviewCTAProps {
  data: GeneratedSite["cta"]
  businessName: string
  colorScheme: ColorScheme
}

export function PreviewCTA({ data, businessName, colorScheme }: PreviewCTAProps) {
  return (
    <section 
      className="py-24 px-6 relative overflow-hidden"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      {/* Background effects */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{ 
          background: `radial-gradient(ellipse at center, var(--preview-primary), transparent 70%)` 
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
          {data.headline}
        </h2>
        
        {/* Description */}
        <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
          {data.description}
        </p>
        
        {/* CTA button */}
        <button 
          className="px-10 py-5 rounded-xl font-semibold text-black text-lg transition-all hover:scale-105 flex items-center gap-3 mx-auto group"
          style={{ background: "var(--preview-primary)" }}
        >
          {data.buttonText}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
        
        {/* Contact info */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 text-white/60">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>+375 (29) XXX-XX-XX</span>
          </div>
          <div className="hidden sm:block w-1 h-1 rounded-full bg-white/30" />
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span>info@{businessName.toLowerCase().replace(/\s/g, "")}.by</span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10 mt-20 pt-8 border-t border-white/10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div>2024 {businessName}. Все права защищены.</div>
          <div className="flex gap-6">
            <span className="hover:text-white/60 cursor-pointer transition-colors">Политика конфиденциальности</span>
            <span className="hover:text-white/60 cursor-pointer transition-colors">Условия использования</span>
          </div>
        </div>
      </div>
    </section>
  )
}
