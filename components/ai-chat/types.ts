// --- AI Chat Types ---

export interface Message {
  id: string
  role: "user" | "assistant" | "operator" | "system"
  content: string
  timestamp: Date
  buttons?: QuickButton[]
}

export interface QuickButton {
  label: string
  action: string
}

export interface QuickAction {
  label: string
  action: string
  icon: React.ReactNode
}

export interface ResponseData {
  text: string
  buttons?: QuickButton[]
  navigate?: string
}

export interface KeywordRule {
  keywords: string[]
  response: string
}
