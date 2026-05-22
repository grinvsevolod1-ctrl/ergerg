"use client"

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Mic, MicOff, X, Sparkles, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChatConfig } from './types'

interface ChatInputProps {
  config: ChatConfig
  onSend: (message: string) => void
  onAttach?: (file: File) => void
  disabled?: boolean
  className?: string
}

// Smart suggestions based on context
const SMART_SUGGESTIONS = [
  { text: 'Сколько стоит разработка сайта?', category: 'price' },
  { text: 'Расскажи про Nexik', category: 'product' },
  { text: 'Как работают AI-ассистенты?', category: 'tech' },
  { text: 'Хочу записаться на консультацию', category: 'action' },
  { text: 'Какие у вас сроки разработки?', category: 'info' },
]

export function ChatInput({ config, onSend, onAttach, disabled, className }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState(SMART_SUGGESTIONS)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (value.trim().length > 0 && value.trim().length < 30) {
      const lower = value.toLowerCase()
      const filtered = SMART_SUGGESTIONS.filter(s => 
        s.text.toLowerCase().includes(lower) ||
        (lower.includes('цен') && s.category === 'price') ||
        (lower.includes('стои') && s.category === 'price') ||
        (lower.includes('nexik') && s.category === 'product') ||
        (lower.includes('нексик') && s.category === 'product') ||
        (lower.includes('ai') && s.category === 'tech') ||
        (lower.includes('ии') && s.category === 'tech') ||
        (lower.includes('консульт') && s.category === 'action') ||
        (lower.includes('срок') && s.category === 'info')
      )
      setFilteredSuggestions(filtered.slice(0, 3))
      setShowSuggestions(filtered.length > 0 && isFocused)
    } else {
      setShowSuggestions(false)
    }
    setSelectedSuggestionIndex(-1)
  }, [value, isFocused])

  const handleSend = useCallback(() => {
    if (!value.trim() || disabled) return
    onSend(value.trim())
    setValue('')
    setShowSuggestions(false)
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, disabled, onSend])

  const handleSuggestionClick = useCallback((text: string) => {
    onSend(text)
    setValue('')
    setShowSuggestions(false)
  }, [onSend])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestion navigation
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        return
      }
      if (e.key === 'Tab' && selectedSuggestionIndex >= 0) {
        e.preventDefault()
        handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex].text)
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (selectedSuggestionIndex >= 0 && showSuggestions) {
        handleSuggestionClick(filteredSuggestions[selectedSuggestionIndex].text)
      } else {
        handleSend()
      }
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedSuggestionIndex(-1)
    }
  }

  const handleInput = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
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

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
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
      {/* Smart suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full left-4 right-4 mb-2 z-10"
          >
            <div className="rounded-xl bg-zinc-800/95 backdrop-blur-sm border border-zinc-700 shadow-xl overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-700/50 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Подсказки</span>
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.text}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm text-zinc-300 transition-all",
                    "hover:bg-zinc-700/50 flex items-center justify-between gap-2",
                    selectedSuggestionIndex === index && "bg-teal-500/10 text-teal-300"
                  )}
                >
                  <span className="truncate">{suggestion.text}</span>
                  <ArrowUpRight className={cn(
                    "w-3 h-3 flex-shrink-0 transition-colors",
                    selectedSuggestionIndex === index ? "text-teal-400" : "text-zinc-600"
                  )} />
                </motion.button>
              ))}
              <div className="px-3 py-1.5 border-t border-zinc-700/50">
                <p className="text-[9px] text-zinc-600">
                  <kbd className="px-1 py-0.5 rounded bg-zinc-700 text-zinc-400 font-mono">Tab</kbd> выбрать, 
                  <kbd className="px-1 py-0.5 rounded bg-zinc-700 text-zinc-400 font-mono ml-1">Esc</kbd> закрыть
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        <AnimatePresence>
          {isFocused && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.75 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-[1px] rounded-2xl"
              style={{
                background: 'linear-gradient(90deg, rgba(79,209,197,0.5), rgba(56,178,172,1), rgba(79,209,197,0.5))',
                backgroundSize: '200% 100%',
                animation: 'gradient-shift 2s ease infinite',
              }}
            />
          )}
        </AnimatePresence>
        
        {/* Inner container */}
        <div className={cn(
          "relative flex items-end gap-2 p-3 rounded-2xl",
          "bg-zinc-800",
          "border",
          isFocused ? "border-transparent" : "border-zinc-700"
        )}>
          {/* Attachment button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleAttachClick}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              "text-zinc-400 hover:text-teal-400",
              "hover:bg-zinc-700 active:bg-zinc-600",
              "transition-colors duration-200",
              "disabled:opacity-40 disabled:pointer-events-none"
            )}
            disabled={disabled}
            title="Прикрепить файл"
          >
            <Paperclip className="w-5 h-5" />
          </motion.button>

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false)
                // Delay hiding suggestions to allow click
                setTimeout(() => setShowSuggestions(false), 200)
              }}
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

          {/* Voice button */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecording}
            className={cn(
              "flex-shrink-0 p-2 rounded-xl",
              "transition-colors duration-200",
              "disabled:opacity-40 disabled:pointer-events-none",
              isRecording 
                ? "text-red-400 bg-red-400/10" 
                : "text-zinc-400 hover:text-teal-400 hover:bg-zinc-700"
            )}
            disabled={disabled}
            title={isRecording ? "Остановить запись" : "Голосовое сообщение"}
          >
            {isRecording ? (
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <MicOff className="w-5 h-5" />
              </motion.div>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </motion.button>

          {/* Send button */}
          <motion.button
            type="button"
            whileHover={hasContent && !disabled ? { scale: 1.1 } : {}}
            whileTap={hasContent && !disabled ? { scale: 0.9 } : {}}
            onClick={handleSend}
            disabled={!hasContent || disabled}
            className={cn(
              "flex-shrink-0 p-2.5 rounded-xl",
              "transition-all duration-300",
              "disabled:opacity-30 disabled:cursor-not-allowed",
              hasContent ? [
                "bg-gradient-to-r from-teal-500 to-teal-600",
                "text-white",
                "shadow-lg shadow-teal-500/25",
                "hover:shadow-xl hover:shadow-teal-500/40",
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
          </motion.button>
        </div>
      </div>

      {/* Hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 mt-3"
      >
        <p className="text-[10px] text-zinc-500">
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[9px]">Enter</kbd>
          <span className="mx-1">отправить</span>
          <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 font-mono text-[9px]">Shift+Enter</kbd>
          <span className="ml-1">новая строка</span>
        </p>
      </motion.div>

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
