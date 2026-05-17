"use client"

import { useState } from 'react'
import { 
  X, 
  Maximize2, 
  Minimize2, 
  MoreHorizontal, 
  Trash2, 
  RotateCcw, 
  Headphones,
  Volume2,
  VolumeX,
  Download,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SiriOrb } from '@/components/ai-orb'
import { ChatConfig, ChatDisplayConfig } from './types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatHeaderProps {
  config: ChatConfig
  displayConfig: ChatDisplayConfig
  isTyping: boolean
  isConnectedToOperator: boolean
  onClose: () => void
  onMinimize?: () => void
  onSwitchMode?: (mode: ChatDisplayConfig['mode']) => void
  onClearHistory?: () => void
  onResetSession?: () => void
  onConnectOperator?: () => void
  onToggleSound?: () => void
  onExportChat?: () => void
  soundEnabled?: boolean
  className?: string
}

export function ChatHeader({
  config,
  displayConfig,
  isTyping,
  isConnectedToOperator,
  onClose,
  onSwitchMode,
  onClearHistory,
  onResetSession,
  onConnectOperator,
  onToggleSound,
  onExportChat,
  soundEnabled = false,
  className,
}: ChatHeaderProps) {
  const isModal = displayConfig.mode === 'modal'
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  
  return (
    <div
      className={cn(
        "relative flex items-center justify-between px-5 py-4",
        "border-b border-zinc-700/50",
        "bg-gradient-to-r from-zinc-800/80 via-zinc-800/90 to-zinc-800/80",
        className
      )}
    >
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-teal-500/5" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

      {/* Left: Orb + Info */}
      <div className="relative flex items-center gap-4">
        <div className="relative">
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute -inset-3 rounded-full blur-xl transition-all duration-500",
              isTyping ? "opacity-80 scale-110" : "opacity-40"
            )}
            style={{ background: 'radial-gradient(circle, rgba(79,209,197,0.5) 0%, transparent 70%)' }}
          />
          <SiriOrb size={44} isHovered={isTyping} isActive={isTyping} />
          
          {/* Status indicator */}
          <div 
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full",
              "ring-2 ring-zinc-800",
              "transition-all duration-300",
              isConnectedToOperator 
                ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" 
                : isTyping
                  ? "bg-teal-400 shadow-[0_0_10px_rgba(79,209,197,0.7)] animate-pulse"
                  : "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
            )}
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {isConnectedToOperator ? 'Оператор' : config.assistantName}
            </span>
            {!isConnectedToOperator && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                <span className="text-[10px] font-semibold text-teal-400 tracking-wide">AI</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs transition-colors duration-300",
              isTyping ? "text-teal-400" : "text-zinc-400"
            )}>
              {isTyping 
                ? 'печатает...' 
                : isConnectedToOperator 
                  ? 'на связи' 
                  : 'онлайн'
              }
            </span>
            {isTyping && (
              <div className="flex gap-0.5">
                {[0, 1, 2].map((i) => (
                  <span 
                    key={i}
                    className="w-1 h-1 rounded-full bg-teal-400 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="relative flex items-center gap-1">
        {/* Connect to operator button */}
        {config.showOperatorButton && !isConnectedToOperator && onConnectOperator && (
          <button
            onClick={onConnectOperator}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl",
              "text-xs font-medium",
              "bg-blue-500/10 text-blue-400 border border-blue-500/20",
              "hover:bg-blue-500/20 hover:border-blue-500/30",
              "active:scale-95",
              "transition-all duration-200"
            )}
            title="Связаться с оператором"
          >
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Оператор</span>
          </button>
        )}

        {/* Mode switcher */}
        {onSwitchMode && (
          <button
            onClick={() => onSwitchMode(isModal ? 'mini' : 'modal')}
            className={cn(
              "p-2.5 rounded-xl",
              "text-zinc-400 hover:text-white",
              "hover:bg-zinc-700/50 active:bg-zinc-700",
              "active:scale-95",
              "transition-all duration-200"
            )}
            title={isModal ? "Свернуть" : "Развернуть"}
          >
            {isModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        )}

        {/* More menu */}
        <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "p-2.5 rounded-xl",
                "text-zinc-400 hover:text-white",
                "hover:bg-zinc-700/50 active:bg-zinc-700",
                "active:scale-95",
                "transition-all duration-200",
                isMenuOpen && "bg-zinc-700/50 text-white"
              )}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-zinc-900 border-zinc-700 shadow-xl shadow-black/50"
          >
            {onResetSession && (
              <DropdownMenuItem 
                onClick={onResetSession}
                className="gap-3 cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
              >
                <RotateCcw className="w-4 h-4 text-zinc-500" />
                <div className="flex flex-col">
                  <span>Новый диалог</span>
                  <span className="text-[10px] text-zinc-500">Начать сначала</span>
                </div>
              </DropdownMenuItem>
            )}
            
            {onToggleSound && (
              <DropdownMenuItem 
                onClick={onToggleSound}
                className="gap-3 cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-teal-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500" />
                )}
                <div className="flex flex-col">
                  <span>Звуки</span>
                  <span className="text-[10px] text-zinc-500">
                    {soundEnabled ? 'Включены' : 'Выключены'}
                  </span>
                </div>
              </DropdownMenuItem>
            )}

            {onExportChat && (
              <DropdownMenuItem 
                onClick={onExportChat}
                className="gap-3 cursor-pointer text-zinc-300 hover:text-white hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white"
              >
                <Download className="w-4 h-4 text-zinc-500" />
                <div className="flex flex-col">
                  <span>Экспорт чата</span>
                  <span className="text-[10px] text-zinc-500">Скачать историю</span>
                </div>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator className="bg-zinc-800" />
            
            {onClearHistory && (
              <DropdownMenuItem 
                onClick={onClearHistory} 
                className="gap-3 cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
                <div className="flex flex-col">
                  <span>Очистить историю</span>
                  <span className="text-[10px] text-red-400/60">Удалить все сообщения</span>
                </div>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator className="bg-zinc-800" />
            
            <div className="px-3 py-3 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-[11px] text-zinc-500">
                Powered by <span className="text-teal-400 font-medium">{config.companyName}</span>
              </span>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Close */}
        <button
          onClick={onClose}
          className={cn(
            "p-2.5 rounded-xl",
            "text-zinc-400 hover:text-white",
            "hover:bg-red-500/10 hover:text-red-400",
            "active:bg-red-500/20 active:scale-95",
            "transition-all duration-200"
          )}
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
