/**
 * Global type declarations for Nexik widget
 */

export interface NexikWidgetConfig {
  id: string
  theme?: 'light' | 'dark' | 'auto'
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  greeting?: string
  placeholder?: string
  offlineMessage?: string
  collectEmail?: boolean
  collectPhone?: boolean
  language?: string
  autoOpen?: boolean
  autoOpenDelay?: number
}

export interface NexikWidgetAPI {
  // Core methods
  init: (config: NexikWidgetConfig) => void
  destroy: () => void
  
  // UI controls
  open: () => void
  close: () => void
  toggle: () => void
  minimize: () => void
  isOpen: () => boolean
  
  // Messaging
  sendMessage: (message: string) => Promise<void>
  clearHistory: () => void
  
  // User identification
  identify: (userData: {
    id?: string
    email?: string
    name?: string
    phone?: string
    metadata?: Record<string, unknown>
  }) => void
  
  // Events
  on: (event: NexikEventType, callback: NexikEventCallback) => void
  off: (event: NexikEventType, callback: NexikEventCallback) => void
  
  // State
  getState: () => NexikWidgetState
  
  // Version
  version: string
}

export type NexikEventType = 
  | 'ready'
  | 'open'
  | 'close'
  | 'message:sent'
  | 'message:received'
  | 'error'
  | 'operator:connected'
  | 'operator:disconnected'

export type NexikEventCallback = (data?: unknown) => void

export interface NexikWidgetState {
  isOpen: boolean
  isMinimized: boolean
  isConnected: boolean
  hasOperator: boolean
  unreadCount: number
  conversationId: string | null
}

declare global {
  interface Window {
    Nexik?: NexikWidgetAPI
    NexikConfig?: NexikWidgetConfig
    __nexik_initialized?: boolean
  }
}

export {}
