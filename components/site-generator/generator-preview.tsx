"use client"

import { useState, useEffect } from "react"
import { Smartphone, Monitor, RefreshCw, ExternalLink, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GeneratedSite } from "./generator-types"
import { 
  PreviewHeader,
  PreviewHero, 
  PreviewServices, 
  PreviewFeatures, 
  PreviewTestimonial, 
  PreviewCTA,
  PreviewFooter
} from "./preview-sections"
import { downloadHTML } from "./export-html"

interface GeneratorPreviewProps {
  data: GeneratedSite | null
  isGenerating: boolean
  generationPhase?: string
  onRegenerate?: () => void
  onOrder?: () => void
}

export function GeneratorPreview({ 
  data, 
  isGenerating, 
  generationPhase,
  onRegenerate,
  onOrder 
}: GeneratorPreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")
  const [showPreview, setShowPreview] = useState(false)

  // Reveal animation when generation completes
  useEffect(() => {
    if (data && !isGenerating) {
      const timer = setTimeout(() => setShowPreview(true), 300)
      return () => clearTimeout(timer)
    }
  }, [data, isGenerating])

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("desktop")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "desktop" 
                ? "bg-white/10 text-white" 
                : "text-white/50 hover:text-white/80"
            )}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={cn(
              "p-2 rounded-lg transition-colors",
              viewMode === "mobile" 
                ? "bg-white/10 text-white" 
                : "text-white/50 hover:text-white/80"
            )}
          >
            <Smartphone className="w-4 h-4" />
          </button>
        </div>

        {data && !isGenerating && (
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Другой вариант</span>
            </button>
            <button
              onClick={() => downloadHTML(data)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Скачать HTML</span>
            </button>
            <button
              onClick={onOrder}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <span className="hidden sm:inline">Заказать такой сайт</span>
              <span className="sm:hidden">Заказать</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden p-4 flex items-start justify-center">
        <div 
          className={cn(
            "h-full overflow-y-auto rounded-xl border border-white/10 transition-all duration-500 scrollbar-none",
            viewMode === "desktop" ? "w-full" : "w-[375px]",
            showPreview ? "opacity-100" : "opacity-0"
          )}
          style={{
            // CSS variables for dynamic colors
            "--preview-cyan": "oklch(0.7 0.18 195)",
            "--preview-orange": "oklch(0.7 0.18 45)",
            "--preview-purple": "oklch(0.65 0.2 280)",
            "--preview-green": "oklch(0.65 0.18 145)",
            "--preview-rose": "oklch(0.65 0.2 350)",
            "--preview-amber": "oklch(0.75 0.15 80)",
          } as React.CSSProperties}
        >
          {/* Generation animation */}
          {isGenerating && (
            <div className="h-full flex flex-col items-center justify-center p-8">
              {/* Animated orb */}
              <div className="relative w-32 h-32 mb-8">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <div className="absolute inset-4 rounded-full bg-primary/30 animate-pulse" />
                <div className="absolute inset-8 rounded-full bg-primary/50" />
                
                {/* Orbiting particles */}
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-primary"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${i * 90}deg) translateX(50px)`,
                      animation: `orbit 2s linear infinite`,
                      animationDelay: `${i * 0.5}s`
                    }}
                  />
                ))}
              </div>

              {/* Phase text */}
              <div className="text-center">
                <p className="text-white font-medium mb-2">{generationPhase || "Подготовка..."}</p>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-primary"
                      style={{
                        animation: "bounce 1s ease-in-out infinite",
                        animationDelay: `${i * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generated preview */}
          {data && !isGenerating && (
            <div className="bg-[#0a0a0f]">
              <PreviewHeader 
                businessName={data.businessName}
                colorScheme={data.colorScheme}
              />
              <PreviewHero 
                data={data.hero} 
                businessName={data.businessName}
                colorScheme={data.colorScheme}
              />
              <PreviewServices 
                data={data.services}
                colorScheme={data.colorScheme}
              />
              <PreviewFeatures 
                data={data.features}
                colorScheme={data.colorScheme}
              />
              <PreviewTestimonial 
                data={data.testimonial}
                colorScheme={data.colorScheme}
              />
              <PreviewCTA 
                data={data.cta}
                businessName={data.businessName}
                colorScheme={data.colorScheme}
              />
              <PreviewFooter 
                businessName={data.businessName}
                colorScheme={data.colorScheme}
              />
            </div>
          )}

          {/* Empty state */}
          {!data && !isGenerating && (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Monitor className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 text-sm max-w-xs">
                Ответьте на несколько вопросов, и мы создадим образец сайта специально для вас
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
