// ============================================
// Nexik Universal Chat Types
// Mode: 'local' (NetNext) | 'nexik' (external clients)
// ============================================

export type ChatMode = 'local' | 'nexik'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isTyping?: boolean
  actions?: ChatAction[]
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
}

export interface ChatAction {
  id: string
  label: string
  icon?: string
  action: 'consultation' | 'call' | 'email' | 'operator' | 'custom'
  data?: Record<string, unknown>
}

export interface ChatConfig {
  // Mode
  mode: ChatMode
  
  // Nexik mode only
  clientId?: string
  
  // Branding
  companyName: string
  assistantName: string
  assistantAvatar?: string
  primaryColor?: string
  userName?: string
  
  // Behavior
  welcomeMessage: string
  quickActions?: ChatAction[]
  placeholder?: string
  
  // API - auto-determined by mode
  apiEndpoint?: string
  
  // Features
  showOperatorButton?: boolean
  showTimestamp?: boolean
  enableSounds?: boolean
  enableHistory?: boolean
  maxHistoryMessages?: number
}

export interface ChatDisplayConfig {
  mode: 'modal' | 'mini' | 'inline'
  modalSize: 'sm' | 'md' | 'lg' | 'xl' // 50%, 60%, 70%, 80%
  position: 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  mobileFullscreen: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isTyping: boolean
  isConnectedToOperator: boolean
  sessionId: string | null
  error: string | null
}

export interface UseChatOptions {
  config: ChatConfig
  displayConfig?: ChatDisplayConfig
  onMessageSent?: (message: ChatMessage) => void
  onMessageReceived?: (message: ChatMessage) => void
  onOperatorConnected?: () => void
  onError?: (error: string) => void
}

// Default configs
export const DEFAULT_DISPLAY_CONFIG: ChatDisplayConfig = {
  mode: 'modal',
  modalSize: 'lg', // 70%
  position: 'center',
  mobileFullscreen: true,
}

// Local mode config (for NetNext site)
export const LOCAL_CHAT_CONFIG: ChatConfig = {
  mode: 'local',
  companyName: 'NetNext',
  assistantName: 'Nexik',
  welcomeMessage: 'Привет! Я Nexik — AI-ассистент NetNext. Чем могу помочь?',
  placeholder: 'Напишите сообщение...',
  apiEndpoint: '/api/chat/ai',
  showOperatorButton: true,
  showTimestamp: false,
  enableSounds: false,
  enableHistory: true,
  maxHistoryMessages: 50,
  quickActions: [
    { id: '1', label: 'Узнать об услугах', action: 'custom', icon: 'MessageSquare' },
    { id: '2', label: 'Узнать стоимость', action: 'custom', icon: 'Calculator' },
    { id: '3', label: 'Записаться на консультацию', action: 'consultation', icon: 'Calendar' },
    { id: '4', label: 'Связаться с оператором', action: 'operator', icon: 'Headphones' },
  ],
}

// Nexik mode config (for external clients) - requires clientId
export function createNexikConfig(clientId: string, overrides?: Partial<ChatConfig>): ChatConfig {
  return {
    mode: 'nexik',
    clientId,
    companyName: overrides?.companyName || 'Company',
    assistantName: overrides?.assistantName || 'Nexik',
    welcomeMessage: overrides?.welcomeMessage || 'Привет! Чем могу помочь?',
    placeholder: 'Напишите сообщение...',
    apiEndpoint: '/api/nexik/chat',
    showOperatorButton: true,
    showTimestamp: false,
    enableSounds: false,
    enableHistory: true,
    maxHistoryMessages: 50,
    ...overrides,
  }
}

// Helper to get API endpoint based on mode
export function getChatApiEndpoint(config: ChatConfig): string {
  if (config.apiEndpoint) return config.apiEndpoint
  return config.mode === 'local' ? '/api/chat/ai' : '/api/nexik/chat'
}

// Helper to get storage key based on mode
export function getChatStorageKey(config: ChatConfig): string {
  if (config.mode === 'nexik' && config.clientId) {
    return `nexik_chat_${config.clientId}`
  }
  return 'netnext_chat_history'
}

export function getSessionStorageKey(config: ChatConfig): string {
  if (config.mode === 'nexik' && config.clientId) {
    return `nexik_session_${config.clientId}`
  }
  return 'netnext_chat_session'
}

// For backwards compatibility
export const DEFAULT_CHAT_CONFIG = LOCAL_CHAT_CONFIG
