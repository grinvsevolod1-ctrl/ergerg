"use client"

import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  color?: 'primary' | 'green' | 'red' | 'blue' | 'yellow' | 'purple' | 'orange'
}

const colorClasses = {
  primary: {
    icon: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'shadow-cyan-500/5',
  },
  green: {
    icon: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'shadow-emerald-500/5',
  },
  red: {
    icon: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    glow: 'shadow-red-500/5',
  },
  blue: {
    icon: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    glow: 'shadow-blue-500/5',
  },
  yellow: {
    icon: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'shadow-amber-500/5',
  },
  purple: {
    icon: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    glow: 'shadow-violet-500/5',
  },
  orange: {
    icon: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    glow: 'shadow-orange-500/5',
  },
}

export function StatsCard({ title, value, icon: Icon, trend, subtitle, color = 'primary' }: StatsCardProps) {
  const colors = colorClasses[color]
  
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-[#0a0a0a]/80 p-5",
      "backdrop-blur-sm transition-all duration-300",
      "hover:shadow-lg hover:border-[#333]",
      colors.border,
      colors.glow
    )}>
      {/* Subtle gradient overlay */}
      <div className={cn(
        "absolute inset-0 opacity-5",
        colors.bg
      )} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-lg",
            colors.bg
          )}>
            <Icon className={cn("w-5 h-5", colors.icon)} />
          </div>
          
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend.isPositive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-red-500/10 text-red-400"
            )}>
              <svg 
                className={cn("w-3 h-3", !trend.isPositive && "rotate-180")}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-3xl font-bold text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString('ru-RU') : value}
          </div>
          <div className="text-sm text-[#888]">{title}</div>
          {subtitle && (
            <div className="text-xs text-[#555]">{subtitle}</div>
          )}
        </div>
      </div>
    </div>
  )
}
