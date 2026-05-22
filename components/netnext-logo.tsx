"use client"

import { cn } from "@/lib/utils"

interface NetNextLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export function NetNextLogo({ 
  size = 40, 
  showText = true,
  className 
}: NetNextLogoProps) {
  const id = `netnext-logo-${Math.random().toString(36).slice(2, 9)}`
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Logo Mark */}
      <div 
        className="relative flex-shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#22d3ee] via-[#14b8a6] to-[#22d3ee] opacity-20 blur-md" />
        
        {/* Main logo container */}
        <div 
          className="relative rounded-xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-[#22d3ee]/30 flex items-center justify-center overflow-hidden"
          style={{ width: size, height: size }}
        >
          {/* Animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#22d3ee]/20 via-transparent to-[#14b8a6]/20" />
          
          {/* Letter N with gradient */}
          <svg 
            width={size * 0.5} 
            height={size * 0.5} 
            viewBox="0 0 24 24" 
            fill="none" 
            className="relative z-10"
          >
            <defs>
              <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
            <path
              d="M6 18V6h2l8 9V6h2v12h-2l-8-9v9H6z"
              fill={`url(#${id}-gradient)`}
            />
          </svg>
          
          {/* Corner accent */}
          <div 
            className="absolute -bottom-1 -right-1 bg-[#22d3ee] rounded-tl-lg opacity-60"
            style={{ width: size * 0.075, height: size * 0.075 }}
          />
        </div>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white tracking-tight whitespace-nowrap">
            NetNext
          </span>
          <span className="text-[10px] text-zinc-400 tracking-widest uppercase whitespace-nowrap">
            Studio
          </span>
        </div>
      )}
    </div>
  )
}
