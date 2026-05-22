"use client"

import { Check } from "lucide-react"
import type { GeneratedSite, ColorScheme } from "../generator-types"

interface PreviewFeaturesProps {
  data: GeneratedSite["features"]
  colorScheme: ColorScheme
}

export function PreviewFeatures({ data, colorScheme }: PreviewFeaturesProps) {
  return (
    <section 
      className="py-20 px-6 bg-white/[0.01]"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            <div 
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4"
            >
              <span className="text-xs font-medium" style={{ color: "var(--preview-primary)" }}>
                Преимущества
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Почему выбирают нас
            </h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              Мы предлагаем комплексный подход к решению ваших задач, 
              используя современные технологии и многолетний опыт.
            </p>
            
            {/* Features list */}
            <div className="space-y-4">
              {data.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div 
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ background: "var(--preview-primary)" }}
                  >
                    <Check className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-white/60">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right: Visual element */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-8 flex items-center justify-center">
              {/* Abstract shapes */}
              <div className="relative w-full h-full">
                <div 
                  className="absolute top-1/4 left-1/4 w-32 h-32 rounded-2xl rotate-12 opacity-60"
                  style={{ background: "var(--preview-primary)" }}
                />
                <div 
                  className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full opacity-40"
                  style={{ background: "var(--preview-primary)" }}
                />
                <div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-3xl border-2 opacity-30"
                  style={{ borderColor: "var(--preview-primary)" }}
                />
              </div>
            </div>
            
            {/* Floating stats */}
            <div className="absolute -bottom-4 -left-4 px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/10">
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-xs text-white/60">Проектов</div>
            </div>
            <div className="absolute -top-4 -right-4 px-4 py-3 rounded-xl bg-[#0a0a0f] border border-white/10">
              <div className="text-2xl font-bold" style={{ color: "var(--preview-primary)" }}>98%</div>
              <div className="text-xs text-white/60">Довольных</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
