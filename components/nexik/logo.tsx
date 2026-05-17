"use client"

import { cn } from "@/lib/utils"

interface NexikLogoProps {
  size?: number
  className?: string
  animated?: boolean
  color?: string
}

export function NexikLogo({ 
  size = 24, 
  className,
  animated = false,
  color = "#4fd1c5"
}: NexikLogoProps) {
  const id = `nexik-logo-${Math.random().toString(36).slice(2, 9)}`
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={cn("flex-shrink-0", className)}
    >
      <defs>
        {/* Main gradient */}
        <radialGradient id={`${id}-core`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor={color} stopOpacity="0.9" />
          <stop offset="60%" stopColor="#00cc99" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#00ffff" stopOpacity="0.5" />
        </radialGradient>
        
        {/* Outer glow */}
        <radialGradient id={`${id}-glow`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="70%" stopColor={color} stopOpacity="0.1" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        
        {/* Inner highlight */}
        <radialGradient id={`${id}-highlight`} cx="30%" cy="30%" r="40%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        
        {/* Blur filter */}
        <filter id={`${id}-blur`}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
        </filter>
        
        {/* Glow filter */}
        <filter id={`${id}-glow-filter`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background glow */}
      <circle 
        cx="50" 
        cy="50" 
        r="45" 
        fill={`url(#${id}-glow)`}
        className={animated ? "animate-pulse" : ""}
        style={animated ? { animationDuration: '3s' } : {}}
      />
      
      {/* Main orb body */}
      <ellipse 
        cx="50" 
        cy="50" 
        rx="32" 
        ry="30" 
        fill={`url(#${id}-core)`}
        filter={`url(#${id}-glow-filter)`}
        className={animated ? "origin-center" : ""}
        style={animated ? { 
          animation: 'nexik-logo-breathe 3s ease-in-out infinite'
        } : {}}
      />
      
      {/* Inner core highlight */}
      <circle 
        cx="40" 
        cy="40" 
        r="14" 
        fill={`url(#${id}-highlight)`}
        filter={`url(#${id}-blur)`}
      />
      
      {/* Bright spot */}
      <circle cx="38" cy="38" r="5" fill="rgba(255,255,255,0.9)" />
      <circle cx="42" cy="42" r="2" fill="rgba(255,255,255,0.6)" />
      
      {/* Ambient particles */}
      {animated && (
        <>
          <circle 
            cx="68" cy="35" r="2" 
            fill={color}
            className="animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <circle 
            cx="32" cy="68" r="1.5" 
            fill="#00ffff"
            className="animate-ping"
            style={{ animationDuration: '2.5s', animationDelay: '0.7s' }}
          />
        </>
      )}
      
      {animated && (
        <style>{`
          @keyframes nexik-logo-breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.03); }
          }
        `}</style>
      )}
    </svg>
  )
}
