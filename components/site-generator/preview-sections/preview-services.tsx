"use client"

import { Briefcase, Code2, Palette, Rocket, Shield, BarChart3 } from "lucide-react"
import type { GeneratedSite, ColorScheme } from "../generator-types"

const iconMap = {
  briefcase: Briefcase,
  code: Code2,
  palette: Palette,
  rocket: Rocket,
  shield: Shield,
  chart: BarChart3,
}

interface PreviewServicesProps {
  data: GeneratedSite["services"]
  colorScheme: ColorScheme
}

export function PreviewServices({ data, colorScheme }: PreviewServicesProps) {
  return (
    <section 
      className="py-20 px-6"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div 
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4"
          >
            <span className="text-xs font-medium" style={{ color: "var(--preview-primary)" }}>
              Наши услуги
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Что мы предлагаем
          </h2>
          <p className="text-white/60 max-w-2xl mx-auto">
            Комплексные решения для вашего бизнеса
          </p>
        </div>
        
        {/* Services grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((service, index) => {
            const IconComponent = iconMap[service.icon] || Briefcase
            return (
              <div 
                key={index}
                className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all hover:-translate-y-1"
              >
                {/* Icon */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                  style={{ 
                    background: "var(--preview-primary)",
                    opacity: 0.15 
                  }}
                >
                  <IconComponent 
                    className="w-6 h-6" 
                    style={{ color: "var(--preview-primary)" }}
                  />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {service.description}
                </p>
                
                {/* Hover glow */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{ 
                    boxShadow: `inset 0 0 30px var(--preview-primary)`,
                    opacity: 0.05 
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
