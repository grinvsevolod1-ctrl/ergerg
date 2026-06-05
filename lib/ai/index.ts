/**
 * Nexik AI Module
 * 100% Self-hosted через Ollama
 */

// Config
export { getConfig, OLLAMA_MODELS, type OllamaConfig, type OllamaModel } from './config'

// Ollama Client
export { getOllamaClient, OllamaClient, type OllamaMessage } from './providers'

// Router (main API)
export { 
  routedChat,
  getAIResponse,
  checkHealth, 
  getAIInfo,
  selectServer,
  AI_SERVERS,
  type ServerType,
  type TaskType
} from './router'

// Knowledge Base / RAG
export * from './knowledge'
