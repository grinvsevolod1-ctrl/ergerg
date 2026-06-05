"use client"

/**
 * NetNextChat — главный чат NetNext (главная страница).
 *
 * Подключён к админ-панели через единое хранилище chat_sessions / chat_messages:
 *  - сообщения пользователя и AI пишутся в БД  → /api/chat/message  (их видит /admin/chats)
 *  - ответы оператора приходят через polling    → /api/chat/poll
 *  - запрос оператора и старт диалога уведомляют → /api/chat/operator (Telegram)
 *
 * Когда оператор подключён — AI отключается, диалог ведёт живой человек.
 * Работает одинаково на VPS и serverless (обычный HTTP + polling, без WebSocket).
 */

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  X,
  Headphones,
  RotateCcw,
  AlertCircle,
  Calendar,
  Calculator,
  MessageSquare,
  Check,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NexikLogo } from "@/components/nexik/logo"

type Role = "user" | "assistant" | "operator" | "system"
type Status = "sending" | "sent" | "error"

interface ChatMsg {
  id: string
  role: Role
  content: string
  status?: Status
  ts: number
}

interface NetNextChatProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

const SESSION_KEY = "netnext_chat_session"
const HISTORY_KEY = "netnext_chat_history"
const POLL_INTERVAL = 4000
const MAX_HISTORY = 50

const WELCOME =
  "Привет! Я Nexik — AI-ассистент NetNext. Помогу с услугами, ценами и запишу на консультацию. А если нужно — подключу живого оператора. Чем могу помочь?"

const QUICK_ACTIONS = [
  { id: "services", label: "Об услугах", icon: MessageSquare, message: "Расскажите об услугах NetNext" },
  { id: "prices", label: "Стоимость", icon: Calculator, message: "Сколько стоит разработка сайта?" },
  { id: "consult", label: "Консультация", icon: Calendar, message: "Хочу записаться на бесплатную консультацию" },
] as const

const genId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

function loadSessionId(): string {
  if (typeof window === "undefined") return genId()
  try {
    let s = localStorage.getItem(SESSION_KEY)
    if (!s) {
      s = genId()
      localStorage.setItem(SESSION_KEY, s)
    }
    return s
  } catch {
    return genId()
  }
}

export function NetNextChat({ isOpen, onOpenChange }: NetNextChatProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operatorConnected, setOperatorConnected] = useState(false)
  const [operatorRequested, setOperatorRequested] = useState(false)

  const sessionIdRef = useRef<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastFailedRef = useRef<string | null>(null)

  // --- init session + history ---
  useEffect(() => {
    sessionIdRef.current = loadSessionId()
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMsg[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed.slice(-MAX_HISTORY))
          return
        }
      }
    } catch {
      /* ignore */
    }
    setMessages([{ id: genId(), role: "assistant", content: WELCOME, ts: Date.now() }])
  }, [])

  // --- persist history ---
  useEffect(() => {
    if (messages.length === 0) return
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)))
    } catch {
      /* ignore */
    }
  }, [messages])

  // --- focus + scroll on open ---
  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 120)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping, isOpen])

  // --- poll operator messages while open ---
  useEffect(() => {
    if (!isOpen) return
    let active = true

    const poll = async () => {
      const sessionId = sessionIdRef.current
      if (!sessionId) return
      try {
        const res = await fetch(`/api/chat/poll?sessionId=${encodeURIComponent(sessionId)}`)
        if (!res.ok || !active) return
        const data = (await res.json()) as { messages?: string[]; operatorConnected?: boolean }

        if (active && typeof data.operatorConnected === "boolean") {
          setOperatorConnected(data.operatorConnected)
        }
        if (active && Array.isArray(data.messages) && data.messages.length > 0) {
          setIsTyping(false)
          setOperatorConnected(true)
          setMessages((prev) => [
            ...prev,
            ...data.messages!.map((m) => ({
              id: genId(),
              role: "operator" as const,
              content: m,
              ts: Date.now(),
            })),
          ])
        }
      } catch {
        /* network hiccup — ignore, next tick retries */
      }
    }

    poll()
    const interval = setInterval(poll, POLL_INTERVAL)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isOpen])

  // --- persist a single message to DB (admin visibility) ---
  const persistMessage = useCallback(async (senderType: "user" | "bot", message: string) => {
    try {
      await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sessionIdRef.current, message, senderType }),
      })
      return true
    } catch {
      return false
    }
  }, [])

  // --- notify Telegram / register session (dialog start + operator request) ---
  const notify = useCallback(
    async (type: "dialog_started" | "operator") => {
      try {
        await fetch("/api/chat/operator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            visitorId: sessionIdRef.current,
            type,
            currentPage: typeof window !== "undefined" ? window.location.pathname : "/",
            conversationHistory: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        })
      } catch {
        /* notification is best-effort */
      }
    },
    [messages],
  )

  const maybeNotifyStart = useCallback(() => {
    const flag = `netnext_chat_started_${sessionIdRef.current}`
    try {
      if (localStorage.getItem(flag)) return
      localStorage.setItem(flag, "1")
    } catch {
      /* ignore */
    }
    notify("dialog_started")
  }, [notify])

  const send = useCallback(
    async (raw: string) => {
      const content = raw.trim()
      if (!content || isTyping) return

      setError(null)
      lastFailedRef.current = null

      const userMsg: ChatMsg = { id: genId(), role: "user", content, status: "sending", ts: Date.now() }
      setMessages((prev) => [...prev, userMsg])
      setInput("")

      // announce dialog start once + persist user message
      maybeNotifyStart()
      const persisted = await persistMessage("user", content)
      setMessages((prev) =>
        prev.map((m) => (m.id === userMsg.id ? { ...m, status: persisted ? "sent" : "error" } : m)),
      )

      // When operator is handling the chat, AI stays silent — human replies via poll.
      if (operatorConnected) return

      setIsTyping(true)
      try {
        const res = await fetch("/api/chat/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            sessionId: sessionIdRef.current,
            visitorId: sessionIdRef.current,
            previousMessages: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          }),
        })
        if (!res.ok) throw new Error("Сервер недоступен")
        const data = await res.json()
        const text: string =
          data.response || data.text || data.message || "Извините, не удалось получить ответ."

        setMessages((prev) => [...prev, { id: genId(), role: "assistant", content: text, ts: Date.now() }])
        persistMessage("bot", text)
      } catch {
        setError("Не удалось получить ответ. Проверьте подключение и попробуйте снова.")
        lastFailedRef.current = content
      } finally {
        setIsTyping(false)
      }
    },
    [isTyping, operatorConnected, messages, persistMessage, maybeNotifyStart],
  )

  const retry = useCallback(() => {
    if (lastFailedRef.current) send(lastFailedRef.current)
  }, [send])

  const connectOperator = useCallback(async () => {
    if (operatorRequested || operatorConnected) return
    setOperatorRequested(true)
    setError(null)

    const sysId = genId()
    setMessages((prev) => [
      ...prev,
      { id: sysId, role: "system", content: "Подключаем живого оператора…", ts: Date.now() },
    ])

    try {
      const res = await fetch("/api/chat/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          visitorId: sessionIdRef.current,
          type: "operator",
          currentPage: typeof window !== "undefined" ? window.location.pathname : "/",
          conversationHistory: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json().catch(() => ({}))
      setMessages((prev) =>
        prev.map((m) =>
          m.id === sysId
            ? {
                ...m,
                content:
                  data.message ||
                  "Оператор получил уведомление и скоро ответит. Обычно это занимает 2–5 минут в рабочее время.",
              }
            : m,
        ),
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === sysId
            ? {
                ...m,
                content:
                  "Не получилось уведомить оператора автоматически. Напишите нам на hello@netnext.site — ответим быстро.",
              }
            : m,
        ),
      )
    }
  }, [operatorRequested, operatorConnected, messages])

  const resetChat = useCallback(() => {
    setMessages([{ id: genId(), role: "assistant", content: WELCOME, ts: Date.now() }])
    setError(null)
    setOperatorRequested(false)
    setOperatorConnected(false)
    lastFailedRef.current = null
    try {
      localStorage.removeItem(HISTORY_KEY)
      const newId = genId()
      localStorage.setItem(SESSION_KEY, newId)
      sessionIdRef.current = newId
    } catch {
      /* ignore */
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const showQuickActions = messages.filter((m) => m.role === "user").length === 0 && !isTyping

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Чат с ассистентом NetNext"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className={cn(
              "fixed z-[101] inset-3 md:inset-auto",
              "md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:w-[min(540px,92vw)] md:h-[min(680px,86vh)]",
              "flex flex-col overflow-hidden",
              "bg-card border border-border rounded-3xl",
              "shadow-[0_0_120px_-24px_var(--glow)]",
            )}
          >
            {/* Header */}
            <header className="relative flex items-center justify-between gap-3 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="absolute inset-0 rounded-2xl blur-md opacity-60"
                    style={{ background: "var(--glow)" }}
                    aria-hidden="true"
                  />
                  <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-secondary">
                    <NexikLogo size={30} animated />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span
                      className={cn(
                        "absolute inline-flex h-full w-full rounded-full opacity-75",
                        operatorConnected ? "bg-chart-4 animate-ping" : "bg-primary",
                      )}
                    />
                    <span
                      className={cn(
                        "relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-card",
                        operatorConnected ? "bg-chart-4" : "bg-primary",
                      )}
                    />
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-foreground leading-tight truncate">
                    {operatorConnected ? "Оператор NetNext" : "Nexik"}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate">
                    {operatorConnected
                      ? "Живой оператор на связи"
                      : isTyping
                        ? "печатает…"
                        : "AI-ассистент • онлайн"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={resetChat}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Очистить диалог"
                  title="Очистить диалог"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  aria-label="Закрыть чат"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Operator banner */}
            <AnimatePresence>
              {operatorConnected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-2 bg-chart-4/10 border-b border-chart-4/20"
                >
                  <p className="text-xs text-foreground flex items-center gap-2">
                    <Headphones className="w-3.5 h-3.5 text-chart-4" />
                    Вы общаетесь с живым оператором. AI-ассистент на паузе.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((msg) => {
                if (msg.role === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs text-muted-foreground bg-secondary/60 px-3 py-1.5 rounded-full text-center">
                        {msg.content}
                      </span>
                    </div>
                  )
                }
                const isUser = msg.role === "user"
                const isOperator = msg.role === "operator"
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", isUser ? "justify-end" : "justify-start")}
                  >
                    <div className="max-w-[85%]">
                      {isOperator && (
                        <span className="block mb-1 text-[10px] font-medium text-chart-4 px-1">
                          Оператор
                        </span>
                      )}
                      <div
                        className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : isOperator
                              ? "bg-chart-4/15 text-foreground rounded-bl-md border border-chart-4/20"
                              : "bg-secondary text-secondary-foreground rounded-bl-md",
                        )}
                      >
                        {msg.content}
                      </div>
                      {isUser && msg.status && (
                        <div className="flex justify-end mt-1 pr-1">
                          {msg.status === "sending" && (
                            <Loader2 className="w-3 h-3 text-muted-foreground animate-spin" />
                          )}
                          {msg.status === "sent" && <Check className="w-3 h-3 text-muted-foreground" />}
                          {msg.status === "error" && (
                            <AlertCircle className="w-3 h-3 text-destructive" />
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-1">
                      {[0, 150, 300].map((d) => (
                        <span
                          key={d}
                          className="w-2 h-2 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Quick actions */}
              {showQuickActions && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_ACTIONS.map((qa) => {
                    const Icon = qa.icon
                    return (
                      <button
                        key={qa.id}
                        type="button"
                        onClick={() => send(qa.message)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {qa.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Error with retry */}
              {error && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                    <span className="text-xs text-foreground">{error}</span>
                    <button
                      type="button"
                      onClick={retry}
                      className="text-xs font-semibold text-primary hover:underline ml-1"
                    >
                      Повторить
                    </button>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer: operator button + input */}
            <div className="border-t border-border px-4 py-3 space-y-2.5">
              {!operatorConnected && (
                <button
                  type="button"
                  onClick={connectOperator}
                  disabled={operatorRequested}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-colors",
                    operatorRequested
                      ? "bg-secondary/50 text-muted-foreground cursor-default"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  )}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  {operatorRequested ? "Оператор уведомлён, ожидайте ответа" : "Связаться с живым оператором"}
                </button>
              )}

              <div className="flex items-center gap-2 bg-input rounded-2xl px-4 py-2 border border-border focus-within:border-ring transition-colors">
                <label htmlFor="netnext-chat-input" className="sr-only">
                  Сообщение
                </label>
                <input
                  id="netnext-chat-input"
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={operatorConnected ? "Напишите оператору…" : "Напишите сообщение…"}
                  className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => send(input)}
                  disabled={!input.trim() || isTyping}
                  className={cn(
                    "p-2 rounded-xl transition-colors shrink-0",
                    input.trim() && !isTyping
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-muted-foreground cursor-not-allowed",
                  )}
                  aria-label="Отправить сообщение"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NetNextChat
