/**
 * Nexik AI Configuration
 * 100% Self-hosted через Ollama - никаких внешних API
 */

export interface OllamaConfig {
  // URL Ollama сервера на VPS
  baseUrl: string
  // Модель для использования
  model: string
  // Fallback модель (если основная недоступна)
  fallbackModel?: string
  // Параметры генерации
  maxTokens: number
  temperature: number
  // Таймаут запроса в мс
  timeout: number
  // Количество попыток при ошибке
  retries: number
}

// Доступные модели (от лучшей к быстрой)
export const OLLAMA_MODELS = {
  // Лучшее качество (нужно ~48GB VRAM или квантование)
  'llama3.1:70b': {
    name: 'Llama 3.1 70B',
    description: 'Топовое качество, требует мощный GPU',
    vram: '48GB+',
    speed: 'slow',
  },
  // Отличный баланс (нужно ~24GB VRAM)  
  'qwen2.5:32b': {
    name: 'Qwen 2.5 32B',
    description: 'Отличное качество, хороший русский',
    vram: '24GB+',
    speed: 'medium',
  },
  // Хорошее качество (нужно ~16GB VRAM)
  'llama3.1:8b': {
    name: 'Llama 3.1 8B',
    description: 'Быстрая, хорошее качество для чата',
    vram: '16GB',
    speed: 'fast',
  },
  'qwen2.5:7b': {
    name: 'Qwen 2.5 7B', 
    description: 'Быстрая, отличный русский язык',
    vram: '16GB',
    speed: 'fast',
  },
  'mistral:7b': {
    name: 'Mistral 7B',
    description: 'Быстрая, хороший баланс',
    vram: '16GB',
    speed: 'fast',
  },
  // Легкие модели (8GB VRAM или CPU)
  'llama3.2:3b': {
    name: 'Llama 3.2 3B',
    description: 'Очень быстрая, базовое качество',
    vram: '8GB',
    speed: 'very-fast',
  },
  'qwen2.5:3b': {
    name: 'Qwen 2.5 3B',
    description: 'Очень быстрая, понимает русский',
    vram: '8GB', 
    speed: 'very-fast',
  },
} as const

export type OllamaModel = keyof typeof OLLAMA_MODELS

// Конфигурация по умолчанию
export const DEFAULT_CONFIG: OllamaConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: (process.env.OLLAMA_MODEL as OllamaModel) || 'qwen2.5:7b',
  fallbackModel: 'qwen2.5:3b',
  maxTokens: 1024,
  temperature: 0.7,
  timeout: 60000, // 60 секунд
  retries: 2,
}

// Получить конфигурацию
export function getConfig(): OllamaConfig {
  return {
    ...DEFAULT_CONFIG,
    baseUrl: process.env.OLLAMA_BASE_URL || DEFAULT_CONFIG.baseUrl,
    model: (process.env.OLLAMA_MODEL as OllamaModel) || DEFAULT_CONFIG.model,
  }
}

// Проверить доступность модели
export function isModelAvailable(model: string): boolean {
  return model in OLLAMA_MODELS
}
