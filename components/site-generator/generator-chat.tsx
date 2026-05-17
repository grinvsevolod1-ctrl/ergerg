"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, ArrowRight, Check, Palette, Layout, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  type ChatStep, 
  type UserInput, 
  type ColorScheme, 
  type StyleOption,
  colorSchemes, 
  styleOptions 
} from "./generator-types"

interface GeneratorChatProps {
  onComplete: (input: UserInput) => void
  onStepChange?: (step: ChatStep) => void
  initialBusiness?: string
}

interface Message {
  id: string
  role: "assistant" | "user"
  content: string
  component?: React.ReactNode
}

const TYPING_DELAY = 30
const MESSAGE_DELAY = 600

export function GeneratorChat({ onComplete, onStepChange, initialBusiness }: GeneratorChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState(initialBusiness || "")
  const [step, setStep] = useState<ChatStep>("greeting")
  const [userInput, setUserInput] = useState<UserInput>({})
  const [isTyping, setIsTyping] = useState(false)
  const [typingText, setTypingText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, typingText, scrollToBottom])

  // Typing animation effect
  const typeMessage = useCallback(async (text: string): Promise<void> => {
    setIsTyping(true)
    setTypingText("")
    
    for (let i = 0; i <= text.length; i++) {
      await new Promise(r => setTimeout(r, TYPING_DELAY))
      setTypingText(text.slice(0, i))
    }
    
    setIsTyping(false)
    setTypingText("")
  }, [])

  const addAssistantMessage = useCallback(async (content: string, component?: React.ReactNode) => {
    await typeMessage(content)
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "assistant",
      content,
      component
    }])
  }, [typeMessage])

  const addUserMessage = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content
    }])
  }, [])

  // Initialize conversation
  useEffect(() => {
    const initChat = async () => {
      await new Promise(r => setTimeout(r, 500))
      await addAssistantMessage(
        "Привет! Я помогу создать образец сайта для вашего бизнеса за пару минут. Расскажите, чем вы занимаетесь?"
      )
      setStep("business")
      onStepChange?.("business")
    }
    initChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput("")
    addUserMessage(userMessage)

    await new Promise(r => setTimeout(r, MESSAGE_DELAY))

    if (step === "business") {
      setUserInput(prev => ({ ...prev, businessDescription: userMessage }))
      setStep("style")
      onStepChange?.("style")
      await addAssistantMessage(
        "Отлично! Теперь выберите стиль, который лучше всего подходит вашему бренду:"
      )
    }
  }

  const handleStyleSelect = async (style: StyleOption) => {
    if (isTyping) return
    
    addUserMessage(styleOptions[style].name)
    setUserInput(prev => ({ ...prev, style }))
    
    await new Promise(r => setTimeout(r, MESSAGE_DELAY))
    setStep("color")
    onStepChange?.("color")
    await addAssistantMessage(
      "Превосходно! Выберите основной цвет для вашего сайта:"
    )
  }

  const handleColorSelect = async (color: ColorScheme) => {
    if (isTyping) return
    
    addUserMessage(colorSchemes[color].name)
    setUserInput(prev => ({ ...prev, colorScheme: color }))
    
    await new Promise(r => setTimeout(r, MESSAGE_DELAY))
    setStep("generating")
    onStepChange?.("generating")
    
    // Complete with all collected data
    onComplete({ ...userInput, colorScheme: color })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
        {messages.map((message) => (
          <div key={message.id} className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-3",
              message.role === "user" 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/5 border border-white/10 text-white"
            )}>
              <p className="text-sm leading-relaxed">{message.content}</p>
              {message.component}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && typingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white/5 border border-white/10">
              <p className="text-sm leading-relaxed text-white">
                {typingText}
                <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 animate-pulse" />
              </p>
            </div>
          </div>
        )}

        {/* Style picker */}
        {step === "style" && !isTyping && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {(Object.entries(styleOptions) as [StyleOption, typeof styleOptions[StyleOption]][]).map(([key, style]) => (
              <button
                key={key}
                onClick={() => handleStyleSelect(key)}
                className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/[0.08] transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Layout className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-white text-sm">{style.name}</span>
                </div>
                <p className="text-xs text-white/50">{style.description}</p>
                <ArrowRight className="absolute top-4 right-4 w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>
        )}

        {/* Color picker */}
        {step === "color" && !isTyping && (
          <div className="grid grid-cols-3 gap-3 mt-4">
            {(Object.entries(colorSchemes) as [ColorScheme, typeof colorSchemes[ColorScheme]][]).map(([key, color]) => (
              <button
                key={key}
                onClick={() => handleColorSelect(key)}
                className="group relative p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 transition-all flex flex-col items-center gap-2"
              >
                <div 
                  className="w-10 h-10 rounded-full transition-transform group-hover:scale-110"
                  style={{ background: color.primary }}
                />
                <span className="text-xs text-white/70">{color.name}</span>
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" 
                  style={{ boxShadow: `0 0 20px ${color.primary}`, opacity: 0.1 }} 
                />
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area - only show for text input steps */}
      {(step === "business" || step === "sections") && (
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={step === "business" 
                ? "Например: кофейня в центре Минска..." 
                : "Опишите что важно показать..."
              }
              className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-primary/50 transition-colors"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Generating state */}
      {step === "generating" && (
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 text-white/60">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Генерируем ваш сайт...</span>
          </div>
        </div>
      )}
    </div>
  )
}
