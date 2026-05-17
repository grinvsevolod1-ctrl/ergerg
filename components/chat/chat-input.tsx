"use client"

import { useState, useRef, useCallback, KeyboardEvent } from 'react'
import { Send, Paperclip, Smile, Mic, MicOff, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatConfig } from './types'

interface ChatInputProps {
  config: ChatConfig
  onSend: (message: string) => void
  onAttach?: (file: File) => void
  disabled?: boolean
  className?: string
}

const QUICK_EMOJIS: string[] = []

export function ChatInput({ config, onSend, onAttach, disabled, className }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    setShowEmojis(false)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  const handleEmojiClick = (emoji: string) => {
    setValue(prev => prev + emoji)
    textareaRef.current?.focus()
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && onAttach) {
      onAttach(file)
    }
    e.target.value = ''
  }

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      return
    }

    // Check for browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[v0] Speech recognition not supported')
      return
    }

    setIsRecording(true)
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognitionAPI()
    recognition.lang = 'ru-RU'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: { results: { [x: number]: { [x: number]: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript
      setValue(prev => prev + (prev ? ' ' : '') + transcript)
      setIsRecording(false)
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognition.start()
  }

  const hasContent = value.trim().length > 0

  return (
    <div className={cn("relative px-4 pb-4 pt-2", className)} style={{ backgroundColor: 'rgb(24, 24, 27)' }}>
      {/* Quick emoji bar */}
      {showEmojis && (
        <div className="absolute bottom-full left-4 right-4 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center gap-1 p-2 rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="p-2 rounded-lg hover:bg-zinc-700 active:scale-95 transition-all text-lg"
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowEmojis(false)}
              className="ml-auto p-2 rounded-lg hover:bg-zinc-700 text-zinc-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx"
      />

      {/* Input container */}
      <div 
        className={cn(
          "relative rounded-2xl transition-all duration-300",
          isFocused && "shadow-[0_0_30px_-10px_rgba(79,209,197,0.4)]"
        )}
      >
        {/* Animated gradient border when focused */}
        {isFocused && (
          <div 
            className="absolute -inset-[1px] rounded-2xl opacity-75"
            style={{
              background: 'linear-gradient(90deg, rgba(79,209,197,0.5), rgba(56,178,172,1), rgba(79,209,197,0.5))',
              backgroundSize: '200% 100%',
              animation: 'gradient-shift 2s ease infinite',
            }}
          />
        )}
        
        {/* Inner container */}
        <div className={cn(
          "relative flex items-end gap-2 p-3 rounded-2xl",
          "bg-zinc-800",
          "border",
          isFocused ? "border-transparent" : "border-zinc-700"
        )}>
          {/* Attachment button */}
          <button
            type="button"
            onClick={handleAttachClick}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              "text-zinc-400 hover:text-teal-400",
              "hover:bg-zinc-700 active:bg-zinc-600 active:scale-95",
              "transition-all duration-200",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
            disabled={disabled}
            title="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={config.placeholder || 'Напишите сообщение...'}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full bg-transparent resize-none outline-none",
                "text-sm text-white placeholder:text-zinc-500",
                "max-h-[120px] py-2 pr-2",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojis(!showEmojis)}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              "transition-all duration-200",
              "disabled:opacity-40 disabled:pointer-events-none",
              showEmojis 
                ? "text-teal-400 bg-teal-400/10" 
                : "text-zinc-400 hover:text-teal-400 hover:bg-zinc-700 active:bg-zinc-600"
            )}
            disabled={disabled}
            title="Эмодзи"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Voice button */}
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              "transition-all duration-200",
              "disabled:opacity-40 disabled:pointer-events-none",
              isRecording 
                ? "text-red-400 bg-red-400/10 animate-pulse" 
                : "text-zinc-400 hover:text-teal-400 hover:bg-zinc-700 active:bg-zinc-600"
            )}
            disabled={disabled}
            title={isRecording ? "Остановить запись" : "Голосовое сообщение"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!hasContent || disabled}
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              "transition-all duration-300",
              "disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-95",
              hasContent ? [
                "bg-gradient-to-r from-teal-500 to-teal-600",
                "text-white",
                "shadow-lg shadow-teal-500/25",
                "hover:shadow-xl hover:shadow-teal-500/40 hover:from-teal-400 hover:to-teal-500",
                "hover:scale-105 active:scale-95",
              ] : [
                "bg-zinc-700",
                "text-zinc-500",
              ]
            )}
            title="Отправить (Enter)"
          >
            <Send className={cn(
              "w-5 h-5 transition-transform duration-300",
              hasContent && "-rotate-45"
            )} />
          </button>
        </div>
      </div>

      {/* Hint */}
      <div className="flex items-center justify-center gap-2 mt-3">
        <p className="text-[10px] text-zinc-500">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">Enter</kbd> отправить, <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[9px]">Shift+Enter</kbd> новая строка
        </p>
      </div>

      {/* Gradient animation keyframes */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
