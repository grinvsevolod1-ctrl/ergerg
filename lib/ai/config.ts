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
    quantized: false,
  },
  // Отличный баланс (нужно ~24GB VRAM)  
  'qwen2.5:32b': {
    name: 'Qwen 2.5 32B',
    description: 'Отличное качество, хороший русский',
    vram: '24GB+',
    speed: 'medium',
    quantized: false,
  },
  // Хорошее качество (нужно ~16GB VRAM)
  'llama3.1:8b': {
    name: 'Llama 3.1 8B',
    description: 'Быстрая, хорошее качество для чата',
    vram: '16GB',
    speed: 'fast',
    quantized: false,
  },
  'qwen2.5:7b': {
    name: 'Qwen 2.5 7B', 
    description: 'Быстрая, отличный русский язык',
    vram: '16GB',
    speed: 'fast',
    quantized: false,
  },
  'mistral:7b': {
    name: 'Mistral 7B',
    description: 'Быстрая, хороший баланс',
    vram: '16GB',
    speed: 'fast',
    quantized: false,
  },
  // === QUANTIZED MODELS (Q4 - 4-bit) ===
  // Быстрее и меньше памяти, минимальная потеря качества
  'qwen2.5:7b-instruct-q4_K_M': {
    name: 'Qwen 2.5 7B Q4',
    description: 'Квантованная - быстрее, меньше памяти',
    vram: '6GB',
    speed: 'fast',
    quantized: true,
  },
  'llama3.1:8b-instruct-q4_K_M': {
    name: 'Llama 3.1 8B Q4',
    description: 'Квантованная версия 8B',
    vram: '6GB',
    speed: 'fast',
    quantized: true,
  },
  'mistral:7b-instruct-q4_K_M': {
    name: 'Mistral 7B Q4',
    description: 'Квантованная версия Mistral',
    vram: '6GB',
    speed: 'fast',
    quantized: true,
  },
  // Легкие модели (8GB VRAM или CPU)
  'llama3.2:3b': {
    name: 'Llama 3.2 3B',
    description: 'Очень быстрая, базовое качество',
    vram: '8GB',
    speed: 'very-fast',
    quantized: false,
  },
  'qwen2.5:3b': {
    name: 'Qwen 2.5 3B',
    description: 'Очень быстрая, понимает русский',
    vram: '8GB', 
    speed: 'very-fast',
    quantized: false,
  },
  // === ULTRA-LIGHTWEIGHT (для простых задач) ===
  'qwen2.5:1.5b': {
    name: 'Qwen 2.5 1.5B',
    description: 'Моментальная, для классификации',
    vram: '4GB',
    speed: 'instant',
    quantized: false,
  },
  'qwen2.5:0.5b': {
    name: 'Qwen 2.5 0.5B',
    description: 'Минимальная, для простых задач',
    vram: '2GB',
    speed: 'instant',
    quantized: false,
  },
  'tinyllama': {
    name: 'TinyLlama 1.1B',
    description: 'Крошечная, последний резерв',
    vram: '2GB',
    speed: 'instant',
    quantized: false,
  },
} as const

// Рекомендации по выбору модели
export const MODEL_RECOMMENDATIONS = {
  // Для сложных задач (чат, RAG)
  complex: ['qwen2.5:7b', 'qwen2.5:7b-instruct-q4_K_M', 'llama3.1:8b'],
  // Для простых задач (классификация, короткие ответы)
  simple: ['qwen2.5:1.5b', 'qwen2.5:0.5b', 'tinyllama'],
  // Для слабых VPS (4-8GB RAM, без GPU)
  lowResource: ['qwen2.5:1.5b', 'qwen2.5:0.5b', 'tinyllama'],
  // Для средних VPS (8-16GB RAM)
  mediumResource: ['qwen2.5:3b', 'llama3.2:3b', 'qwen2.5:7b-instruct-q4_K_M'],
  // Для мощных VPS (16GB+ RAM, GPU)
  highResource: ['qwen2.5:7b', 'llama3.1:8b', 'mistral:7b'],
}

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
