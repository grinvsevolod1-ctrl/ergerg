/**
 * Nexik Knowledge Base Types
 * Типы для системы базы знаний
 */

export interface KnowledgeDocument {
  id: string
  // ID клиента (для multi-tenant)
  clientId: string
  // Тип документа
  type: 'faq' | 'document' | 'webpage' | 'custom'
  // Заголовок
  title: string
  // Контент документа
  content: string
  // Метаданные
  metadata?: {
    url?: string
    category?: string
    tags?: string[]
    priority?: number
  }
  // Дата создания/обновления
  createdAt: Date
  updatedAt: Date
}

export interface KnowledgeChunk {
  id: string
  documentId: string
  clientId: string
  // Текст чанка
  content: string
  // Позиция в документе
  position: number
  // Embedding вектор (для векторного поиска)
  embedding?: number[]
  // Метаданные для поиска
  metadata?: {
    title?: string
    section?: string
  }
}

export interface SearchResult {
  chunk: KnowledgeChunk
  document: KnowledgeDocument
  score: number
}

export interface RAGContext {
  query: string
  results: SearchResult[]
  formattedContext: string
}
