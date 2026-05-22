"use client"

import { Quote } from "lucide-react"
import type { GeneratedSite, ColorScheme } from "../generator-types"

interface PreviewTestimonialProps {
  data: GeneratedSite["testimonial"]
  colorScheme: ColorScheme
}

export function PreviewTestimonial({ data, colorScheme }: PreviewTestimonialProps) {
  return (
    <section 
      className="py-20 px-6"
      style={{ "--preview-primary": `var(--preview-${colorScheme})` } as React.CSSProperties}
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10">
          {/* Quote icon */}
          <div 
            className="absolute -top-4 left-8 w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--preview-primary)" }}
          >
            <Quote className="w-6 h-6 text-black" />
          </div>
          
          {/* Quote text */}
          <blockquote className="text-xl md:text-2xl text-white/90 leading-relaxed mb-8 mt-4">
            &ldquo;{data.quote}&rdquo;
          </blockquote>
          
          {/* Author */}
          <div className="flex items-center gap-4">
            {/* Avatar placeholder */}
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-black"
              style={{ background: "var(--preview-primary)" }}
            >
              {data.author.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-white">{data.author}</div>
              <div className="text-sm text-white/60">{data.role}</div>
            </div>
          </div>
          
          {/* Decorative gradient */}
          <div 
            className="absolute bottom-0 right-0 w-1/2 h-1/2 rounded-br-3xl opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at bottom right, var(--preview-primary), transparent)` }}
          />
        </div>
      </div>
    </section>
  )
}
