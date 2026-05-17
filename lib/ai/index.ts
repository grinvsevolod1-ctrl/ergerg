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
  generateResponse, 
  streamResponse, 
  checkHealth, 
  getAIInfo,
  type ChatContext, 
  type GenerateOptions 
} from './router'

// Knowledge Base / RAG
export * from './knowledge'
