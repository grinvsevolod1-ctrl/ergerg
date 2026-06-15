"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { 
  ChatMessage, 
  ChatConfig, 
  UseChatOptions, 
  DEFAULT_CHAT_CONFIG,
  getChatApiEndpoint,
  getChatStorageKey,
  getSessionStorageKey,
} from '../types'

const generateId = () => Math.random().toString(36).substring(2, 15)

export function useChat(options: UseChatOptions) {
  const config: ChatConfig = { ...DEFAULT_CHAT_CONFIG, ...options.config }
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isConnectedToOperator, setIsConnectedToOperator] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Get storage keys based on mode
  const storageKey = getChatStorageKey(config)
  const sessionKey = getSessionStorageKey(config)
  const apiEndpoint = getChatApiEndpoint(config)

  // Load history from localStorage
  useEffect(() => {
    if (!config.enableHistory) return
    
    try {
      const stored = localStorage.getItem(storageKey)
      const storedSession = localStorage.getItem(sessionKey)
      
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[]
        const limited = parsed.slice(-(config.maxHistoryMessages || 50))
        setMessages(limited.map(m => ({ ...m, timestamp: new Date(m.timestamp) })))
      }
      
      if (storedSession) {
        setSessionId(storedSession)
      } else {
        const newSession = generateId()
        setSessionId(newSession)
        localStorage.setItem(sessionKey, newSession)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [config.enableHistory, config.maxHistoryMessages, storageKey, sessionKey])

  // Save history to localStorage
  useEffect(() => {
    if (!config.enableHistory || messages.length === 0) return
    
    try {
      const limited = messages.slice(-(config.maxHistoryMessages || 50))
      localStorage.setItem(storageKey, JSON.stringify(limited))
    } catch {
      // Ignore localStorage errors
    }
  }, [messages, config.enableHistory, config.maxHistoryMessages, storageKey])

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return
    
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sending',
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)
    setError(null)
    
    options.onMessageSent?.(userMessage)
    
    try {
      abortControllerRef.current = new AbortController()
      
      // Build request body based on mode
      const requestBody: Record<string, unknown> = {
        message: content.trim(),
        sessionId,
        context: {
          companyName: config.companyName,
          assistantName: config.assistantName,
          isConnectedToOperator,
        },
        previousMessages: messages.slice(-10).map(m => ({
          role: m.role,
          content: m.content,
        })),
      }
      
      // Add clientId for nexik mode
      if (config.mode === 'nexik' && config.clientId) {
        requestBody.clientId = config.clientId
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })
      
      if (!response.ok) {
        throw new Error('Ошибка сервера')
      }
      
      const data = await response.json()
      
      // Update user message status
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'sent' as const } : m
      ))
      
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data.text || data.response || data.message || 'Извините, произошла ошибка.',
        timestamp: new Date(),
        actions: data.buttons || data.suggestedActions,
        status: 'delivered',
      }
      
      setMessages(prev => [...prev, assistantMessage])
      options.onMessageReceived?.(assistantMessage)
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
      setError(errorMessage)
      options.onError?.(errorMessage)
      
      // Update user message status to error
      setMessages(prev => prev.map(m => 
        m.id === userMessage.id ? { ...m, status: 'error' as const } : m
      ))
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'assistant',
        content: 'Извините, произошла ошибка. Попробуйте позже или свяжитесь с нами напрямую.',
        timestamp: new Date(),
        status: 'delivered',
      }])
    } finally {
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }, [config, sessionId, isConnectedToOperator, messages, options, apiEndpoint])

  const connectToOperator = useCallback(async () => {
    setIsConnectedToOperator(true)
    options.onOperatorConnected?.()
    
    // Show connecting message
    const connectingMessage: ChatMessage = {
      id: generateId(),
      role: 'system',
      content: 'Подключаем оператора...',
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, connectingMessage])
    
    try {
      // Determine API endpoint based on mode
      const operatorEndpoint = config.mode === 'nexik' 
        ? '/api/nexik/operator' 
        : '/api/chat/operator'
      
      const response = await fetch(operatorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: config.clientId,
          sessionId,
          visitorId: sessionId,
          conversationHistory: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
          })),
          currentPage: typeof window !== 'undefined' ? window.location.pathname : '/'
        }),
      })
      
      const data = await response.json()
      
      // Update message with result
      setMessages(prev => prev.map(m => 
        m.id === connectingMessage.id 
          ? { ...m, content: data.message || 'Оператор получил уведомление. Ожидайте ответа (2-5 минут).' }
          : m
      ))
      
    } catch {
      // Update with fallback message
      setMessages(prev => prev.map(m => 
        m.id === connectingMessage.id 
          ? { ...m, content: 'Оператор скоро ответит. Если долго нет ответа, напишите на hello@netnext.site' }
          : m
      ))
    }
  }, [options, config, sessionId, messages])

  const clearHistory = useCallback(() => {
    setMessages([])
    try {
      localStorage.removeItem(storageKey)
    } catch {
      // Ignore
    }
  }, [storageKey])

  const resetSession = useCallback(() => {
    clearHistory()
    setIsConnectedToOperator(false)
    setError(null)
    
    const newSession = generateId()
    setSessionId(newSession)
    try {
      localStorage.setItem(sessionKey, newSession)
    } catch {
      // Ignore
    }
  }, [clearHistory, sessionKey])

  return {
    messages,
    isTyping,
    isConnectedToOperator,
    sessionId,
    error,
    sendMessage,
    connectToOperator,
    clearHistory,
    resetSession,
    config,
  }
}
