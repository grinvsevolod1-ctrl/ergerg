"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatHeader } from "./chat-header"
import { ChatInput } from "./chat-input"
import { ChatMessage } from "./chat-message"
import { ChatWelcome } from "./chat-welcome"
import { TypingIndicator } from "./typing-indicator"
import { generateSessionId } from "./utils"
import { responses, matchResponse } from "./responses"
import type { Message } from "./types"

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (section: string) => void
}

export function AIChat({ isOpen, onClose, onNavigate }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [operatorConnected, setOperatorConnected] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const [isFirstMessage, setIsFirstMessage] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Send notification to Telegram
  const sendTelegramNotification = useCallback(async (message: string, isFirst: boolean) => {
    if (!message || !message.trim()) return
    try {
      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isFirst ? "chat_started" : "chat_message",
          data: { sessionId, message, from: "user" },
        }),
      })
    } catch {
      // Non-critical error
    }
  }, [sessionId])

  // Save message to database for admin history
  const saveMessageToDb = useCallback(async (message: string, senderType: 'user' | 'bot' | 'operator') => {
    // Validate message before saving
    if (!message || !message.trim() || !sessionId) return
    
    try {
      await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: message.trim(), senderType }),
      })
    } catch {
      // Non-critical error
    }
  }, [sessionId])

  // Poll for operator messages
  const pollForMessages = useCallback(async () => {
    if (!operatorConnected) return
    try {
      const res = await fetch(`/api/chat/poll?sessionId=${sessionId}`)
      const data = await res.json()
      if (data.messages?.length) {
        const newMsgs = data.messages.map((m: { id: string; message: string; created_at: string }) => ({
          id: m.id,
          role: "operator" as const,
          content: m.message,
          timestamp: new Date(m.created_at),
        }))
        setMessages(prev => [...prev, ...newMsgs])
      }
    } catch {
      // Polling error - non-critical
    }
  }, [sessionId, operatorConnected])

  // Setup polling when operator connected
  useEffect(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    if (isOpen && operatorConnected) {
      pollIntervalRef.current = setInterval(pollForMessages, 3000)
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }
    }
  }, [isOpen, operatorConnected, pollForMessages])

  // Nexik AI Mode - использовать AI вместо keyword-matching
  const [useAI, setUseAI] = useState(true)

  // Get AI response from Nexik backend
  const getAIResponse = useCallback(async (userText: string): Promise<{
    text: string
    buttons?: { label: string; action: string }[]
    navigate?: string
  }> => {
    try {
      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId,
          message: userText,
          context: {
            companyName: 'NetNext',
            companyDescription: 'Веб-студия разработки в Минске. Создаём сайты, мобильные приложения, SaaS-платформы.',
          },
          stream: false,
        }),
      })
      const data = await res.json()

      // Если оператор подключен
      if (data.operatorMode) {
        return {
          text: data.message || 'Оператор подключен, ожидайте ответ',
          buttons: [],
        }
      }

      return {
        text: data.text || 'Извините, не могу ответить. Попробуйте переформулировать вопрос.',
        buttons: data.buttons || [],
        navigate: data.navigate,
      }
    } catch (error) {
      console.error('[AI Chat] Error:', error)
      // Fallback to keyword matching
      return getAutoResponse(userText)
    }
  }, [sessionId])

  // Get auto-response (tries DB first, then local)
  const getAutoResponse = useCallback(async (userText: string, action?: string) => {
    // Try database auto-responses first
    try {
      const res = await fetch('/api/chat/auto-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: action || userText }),
      })
      const data = await res.json()

      if (data.found) {
        return {
          text: data.text,
          buttons: data.buttons,
          navigate: undefined,
        }
      }
    } catch {
      // Fall through to local responses
    }

    // Fallback to local responses
    const key = action || matchResponse(userText)
    return responses[key] || responses.unknown
  }, [])

  // Handle sending message
  const handleSend = useCallback(async (content: string, action?: string) => {
    const userText = content.trim()

    // Don't process empty messages without action
    if (!userText && !action) return

    // Add user message if there's text
    if (userText) {
      const userMsg: Message = {
        id: `u_${Date.now()}`,
        role: "user",
        content: userText,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, userMsg])
      setInput("")

      // Save user message to database
      saveMessageToDb(userText, 'user')

      // Telegram notification
      if (isFirstMessage) {
        sendTelegramNotification(userText, true)
        setIsFirstMessage(false)
      } else {
        sendTelegramNotification(userText, false)
      }
    }

    // If operator connected, don't auto-respond
    if (operatorConnected) return

    // Show typing indicator
    setIsTyping(true)

    // Handle operator request first
    if (action === "request_operator") {
      setOperatorConnected(true)
      setIsTyping(false)
      setMessages(prev => [
        ...prev,
        {
          id: `s_${Date.now()}`,
          role: "system",
          content: "Оператор подключён к чату",
          timestamp: new Date(),
        },
      ])
      
      // Добавляем сообщение от бота
      const operatorMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: "Подключаю живого оператора. Обычно отвечаем в течение нескольких минут.\n\nПока ждёте, можете описать свой вопрос — оператор увидит всю переписку.",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, operatorMsg])
      saveMessageToDb(operatorMsg.content, 'bot')
      return
    }

    // Для действий (кнопок) используем keyword-matching
    if (action) {
      const resp = await getAutoResponse(userText, action)
      
      if (resp.navigate) {
        onNavigate(resp.navigate)
      }

      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: resp.text,
        timestamp: new Date(),
        buttons: resp.buttons,
      }
      
      setIsTyping(false)
      setMessages(prev => [...prev, assistantMsg])
      
      if (resp.text) {
        saveMessageToDb(resp.text, 'bot')
      }
      return
    }

    // Для обычных сообщений используем AI (Nexik)
    try {
      const resp = useAI 
        ? await getAIResponse(userText)
        : await getAutoResponse(userText)

      if (resp.navigate) {
        onNavigate(resp.navigate)
      }

      const assistantMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: resp.text,
        timestamp: new Date(),
        buttons: resp.buttons,
      }
      
      setIsTyping(false)
      setMessages(prev => [...prev, assistantMsg])

      // AI уже сохраняет в БД, но для fallback сохраняем тут
      if (!useAI && resp.text) {
        saveMessageToDb(resp.text, 'bot')
      }
    } catch (error) {
      console.error('[Chat] Error getting response:', error)
      setIsTyping(false)
      
      const errorMsg: Message = {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: "Извините, произошла ошибка. Попробуйте ещё раз или свяжитесь с оператором.",
        timestamp: new Date(),
        buttons: [{ label: "Позвать оператора", action: "request_operator" }],
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }, [isFirstMessage, operatorConnected, onNavigate, sendTelegramNotification, saveMessageToDb, getAutoResponse, getAIResponse, useAI])

  // Handle button click
  const handleButtonClick = useCallback((action: string) => {
    handleSend("", action)
  }, [handleSend])

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-card border border-border/50 shadow-2xl overflow-hidden transition-all duration-300 ease-out",
        // Mobile: full screen with safe areas
        "inset-0 md:inset-auto",
        // Desktop: bottom right corner
        "md:bottom-6 md:right-6 md:w-[400px] md:h-[580px] md:rounded-2xl",
        isOpen
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none md:translate-y-8"
      )}
    >
      <ChatHeader operatorConnected={operatorConnected} onClose={onClose} />

      <ScrollArea className="flex-1 overflow-y-auto">
        <div ref={scrollRef} className="flex flex-col gap-3 px-4 py-4">
          {messages.length === 0 ? (
            <ChatWelcome onSend={handleSend} />
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onButtonClick={handleButtonClick}
                />
              ))}
              {isTyping && <TypingIndicator />}
            </>
          )}
        </div>
      </ScrollArea>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        operatorConnected={operatorConnected}
        showQuickActions={messages.length === 0}
        isOpen={isOpen}
      />
    </div>
  )
}

// Also export as default for lazy loading compatibility
export default AIChat
