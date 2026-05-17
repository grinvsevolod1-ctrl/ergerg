"use client"

import { useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChatConfig, ChatDisplayConfig, ChatAction, DEFAULT_CHAT_CONFIG, DEFAULT_DISPLAY_CONFIG } from './types'
import { useChat } from './hooks/use-chat'
import { useChatUI } from './hooks/use-chat-ui'
import { ChatContainer } from './chat-container'
import { ChatHeader } from './chat-header'
import { ChatMessages } from './chat-messages'
import { ChatInput } from './chat-input'

// Re-export types and hooks
export * from './types'
export { useChat } from './hooks/use-chat'
export { useChatUI } from './hooks/use-chat-ui'

interface ChatProps {
  config?: Partial<ChatConfig>
  displayConfig?: Partial<ChatDisplayConfig>
  isOpen?: boolean
  onOpenChange?: (isOpen: boolean) => void
  className?: string
}

export function Chat({
  config: configOverride,
  displayConfig: displayConfigOverride,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
}: ChatProps) {
  // Merge configs with defaults
  const config: ChatConfig = { ...DEFAULT_CHAT_CONFIG, ...configOverride }
  const initialDisplayConfig: ChatDisplayConfig = { ...DEFAULT_DISPLAY_CONFIG, ...displayConfigOverride }

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(false)

  // Chat logic
  const {
    messages,
    isTyping,
    isConnectedToOperator,
    sendMessage,
    connectToOperator,
    clearHistory,
    resetSession,
  } = useChat({ config })

  // UI state
  const {
    displayConfig,
    isOpen: internalIsOpen,
    openChat,
    closeChat,
    switchMode,
    updateDisplayConfig,
  } = useChatUI(initialDisplayConfig)

  // Support controlled and uncontrolled mode
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  
  // Play sound effect
  const playSound = useCallback((type: 'send' | 'receive' | 'open') => {
    if (!soundEnabled || typeof window === 'undefined') return
    
    // Simple beep sounds using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.value = type === 'send' ? 880 : type === 'receive' ? 660 : 440
      gainNode.gain.value = 0.1
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Ignore audio errors
    }
  }, [soundEnabled])

  // Play sound on new message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant') {
        playSound('receive')
      }
    }
  }, [messages.length, playSound])
  
  const handleClose = useCallback(() => {
    if (onOpenChange) {
      onOpenChange(false)
    } else {
      closeChat()
    }
  }, [onOpenChange, closeChat])

  const handleOpen = useCallback(() => {
    playSound('open')
    if (onOpenChange) {
      onOpenChange(true)
    } else {
      openChat()
    }
  }, [onOpenChange, openChat, playSound])

  const handleSendMessage = useCallback((content: string) => {
    playSound('send')
    sendMessage(content)
  }, [sendMessage, playSound])

  const handleQuickAction = useCallback((action: ChatAction) => {
    if (action.action === 'operator') {
      connectToOperator()
    } else if (action.action === 'consultation') {
      handleSendMessage('Хочу записаться на консультацию')
    } else {
      // Custom action - just send as message
      handleSendMessage(action.label)
    }
  }, [connectToOperator, handleSendMessage])

  const handleSwitchMode = useCallback((mode: ChatDisplayConfig['mode']) => {
    updateDisplayConfig({ mode })
    switchMode(mode)
  }, [updateDisplayConfig, switchMode])

  const handleToggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev)
  }, [])

  const handleExportChat = useCallback(() => {
    if (messages.length === 0) return
    
    const chatText = messages.map(m => {
      const time = new Date(m.timestamp).toLocaleString('ru-RU')
      const role = m.role === 'user' ? 'Вы' : m.role === 'assistant' ? config.assistantName : 'Система'
      return `[${time}] ${role}: ${m.content}`
    }).join('\n\n')
    
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [messages, config.assistantName])

  const handleConnectOperator = useCallback(() => {
    connectToOperator()
  }, [connectToOperator])

  return (
    <ChatContainer
      displayConfig={displayConfig}
      isOpen={isOpen}
      onClose={handleClose}
      className={className}
    >
      {/* Header */}
      <ChatHeader
        config={config}
        displayConfig={displayConfig}
        isTyping={isTyping}
        isConnectedToOperator={isConnectedToOperator}
        onClose={handleClose}
        onSwitchMode={handleSwitchMode}
        onClearHistory={clearHistory}
        onResetSession={resetSession}
        onConnectOperator={handleConnectOperator}
        onToggleSound={handleToggleSound}
        onExportChat={handleExportChat}
        soundEnabled={soundEnabled}
      />

      {/* Messages */}
      <ChatMessages
        messages={messages}
        config={config}
        isTyping={isTyping}
        onQuickAction={handleQuickAction}
        onSendMessage={handleSendMessage}
      />

      {/* Input */}
      <ChatInput
        config={config}
        onSend={handleSendMessage}
        disabled={isTyping}
      />
    </ChatContainer>
  )
}

// Convenience component for just the trigger button
interface ChatTriggerProps {
  onClick: () => void
  children: React.ReactNode
  className?: string
}

export function ChatTrigger({ onClick, children, className }: ChatTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40",
        className
      )}
    >
      {children}
    </button>
  )
}
