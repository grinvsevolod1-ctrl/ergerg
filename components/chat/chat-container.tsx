"use client"

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { ChatDisplayConfig } from './types'

interface ChatContainerProps {
  displayConfig: ChatDisplayConfig
  isOpen: boolean
  children: React.ReactNode
  onClose: () => void
  className?: string
}

export function ChatContainer({
  displayConfig,
  isOpen,
  children,
  onClose,
  className,
}: ChatContainerProps) {
  const { mode, modalSize, position, mobileFullscreen } = displayConfig
  const containerRef = useRef<HTMLDivElement>(null)

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen && mode === 'modal') {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen, mode])

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Get size classes for modal
  const getSizeClasses = () => {
    switch (modalSize) {
      case 'sm': return 'w-[min(500px,95vw)] h-[min(550px,85vh)]'
      case 'md': return 'w-[min(600px,95vw)] h-[min(650px,85vh)]'
      case 'lg': return 'w-[min(700px,95vw)] h-[min(750px,90vh)]'
      case 'xl': return 'w-[min(900px,95vw)] h-[min(850px,92vh)]'
      default: return 'w-[min(700px,95vw)] h-[min(750px,90vh)]'
    }
  }

  // Get position classes for mini mode
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right': return 'bottom-6 right-6'
      case 'bottom-left': return 'bottom-6 left-6'
      case 'top-right': return 'top-6 right-6'
      case 'top-left': return 'top-6 left-6'
      default: return 'bottom-6 right-6'
    }
  }

  // Modal mode - centered with backdrop
  if (mode === 'modal') {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 z-[100] bg-black/70"
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal container */}
        <div 
          className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
        >
          <div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            style={{ backgroundColor: 'rgb(24, 24, 27)' }}
            className={cn(
              "pointer-events-auto",
              "flex flex-col overflow-hidden",
              "border border-zinc-700",
              "rounded-3xl",
              // Glow shadow
              "shadow-[0_0_100px_-20px_rgba(79,209,197,0.4)]",
              // Sizing
              getSizeClasses(),
              // Mobile fullscreen
              mobileFullscreen && "max-md:!w-full max-md:!h-full max-md:!rounded-none max-md:!max-w-none max-md:!max-h-none",
              className
            )}
          >
            {children}
          </div>
        </div>
      </>
    )
  }

  // Mini mode - corner positioned
  if (mode === 'mini') {
    return (
      <div
        ref={containerRef}
        role="dialog"
        style={{ backgroundColor: 'rgb(24, 24, 27)' }}
        className={cn(
          "fixed z-[100]",
          "w-[380px] h-[560px]",
          "flex flex-col overflow-hidden",
          "border border-zinc-700",
          "rounded-2xl",
          "shadow-[0_0_60px_-15px_rgba(79,209,197,0.3)]",
          getPositionClasses(),
          "max-md:w-[calc(100%-2rem)] max-md:h-[70vh] max-md:left-4 max-md:right-4 max-md:bottom-4",
          className
        )}
      >
        {children}
      </div>
    )
  }

  // Inline mode
  return (
    <div 
      ref={containerRef}
      style={{ backgroundColor: 'rgb(24, 24, 27)' }}
      className={cn(
        "flex flex-col overflow-hidden",
        "border border-zinc-700 rounded-2xl",
        className
      )}
    >
      {children}
    </div>
  )
}
