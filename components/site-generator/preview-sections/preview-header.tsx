"use client"

import { Menu } from "lucide-react"
import type { ColorScheme } from "../generator-types"

interface PreviewHeaderProps {
  businessName: string
  colorScheme: ColorScheme
}

export function PreviewHeader({ businessName, colorScheme }: PreviewHeaderProps) {
  return (
    <header 
      className="sticky top-0 z-50 px-6 py-4 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-black text-sm"
            style={{ background: "var(--preview-primary)" }}
          >
            {businessName.charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-white text-sm">{businessName}</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Услуги", "Преимущества", "Отзывы", "Контакты"].map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="flex items-center gap-4">
          <button 
            className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-black transition-all hover:opacity-90"
            style={{ background: "var(--preview-primary)" }}
          >
            Связаться
          </button>
          <button className="md:hidden p-2 text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
