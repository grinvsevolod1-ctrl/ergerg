/**
 * Nexik Knowledge Search
 * Поиск по базе знаний (keyword + TF-IDF)
 * 
 * Для MVP используем простой текстовый поиск.
 * Для production можно добавить:
 * - Vector embeddings (OpenAI, Cohere)
 * - Postgres pgvector
 * - Pinecone / Weaviate
 */

import type { KnowledgeChunk, KnowledgeDocument, SearchResult } from './types'

/**
 * Токенизация текста
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sа-яё]/gi, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
}

/**
 * Вычисление TF (Term Frequency)
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>()
  const totalTokens = tokens.length

  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1)
  }

  // Нормализуем
  for (const [token, count] of tf) {
    tf.set(token, count / totalTokens)
  }

  return tf
}

/**
 * Вычисление IDF (Inverse Document Frequency)
 */
function computeIDF(
  documents: string[],
  vocabulary: Set<string>
): Map<string, number> {
  const idf = new Map<string, number>()
  const totalDocs = documents.length

  for (const term of vocabulary) {
    const docsWithTerm = documents.filter(doc => 
      doc.toLowerCase().includes(term)
    ).length
    
    // IDF с smoothing
    idf.set(term, Math.log((totalDocs + 1) / (docsWithTerm + 1)) + 1)
  }

  return idf
}

/**
 * Вычисление TF-IDF score между запросом и документом
 */
function computeTFIDFScore(
  queryTokens: string[],
  docTokens: string[],
  idf: Map<string, number>
): number {
  const queryTF = computeTF(queryTokens)
  const docTF = computeTF(docTokens)

  let score = 0

  for (const token of queryTokens) {
    const queryWeight = queryTF.get(token) || 0
    const docWeight = docTF.get(token) || 0
    const idfWeight = idf.get(token) || 1

    score += queryWeight * docWeight * idfWeight
  }

  return score
}

/**
 * Поиск по базе знаний
 */
export function searchKnowledge(
  query: string,
  chunks: KnowledgeChunk[],
  documents: Map<string, KnowledgeDocument>,
  options: {
    topK?: number
    minScore?: number
  } = {}
): SearchResult[] {
  const { topK = 5, minScore = 0.01 } = options

  if (chunks.length === 0) {
    return []
  }

  // Токенизируем запрос
  const queryTokens = tokenize(query)
  
  if (queryTokens.length === 0) {
    return []
  }

  // Собираем vocabulary из запроса
  const vocabulary = new Set(queryTokens)

  // Вычисляем IDF по всем чанкам
  const allContents = chunks.map(c => c.content)
  const idf = computeIDF(allContents, vocabulary)

  // Вычисляем scores для каждого чанка
  const results: { chunk: KnowledgeChunk; score: number }[] = []

  for (const chunk of chunks) {
    const docTokens = tokenize(chunk.content)
    const score = computeTFIDFScore(queryTokens, docTokens, idf)

    // Бонус за точное совпадение фразы
    const lowerContent = chunk.content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    if (lowerContent.includes(lowerQuery)) {
      results.push({ chunk, score: score + 0.5 })
    } else if (score >= minScore) {
      results.push({ chunk, score })
    }
  }

  // Сортируем по score и берём top K
  results.sort((a, b) => b.score - a.score)
  const topResults = results.slice(0, topK)

  // Добавляем документы
  return topResults.map(({ chunk, score }) => ({
    chunk,
    document: documents.get(chunk.documentId)!,
    score,
  })).filter(r => r.document)
}

/**
 * Форматирование результатов поиска в контекст для LLM
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return ''
  }

  const sections = results.map((result, index) => {
    const { chunk, document } = result
    const header = document.title || `Документ ${index + 1}`
    const section = chunk.metadata?.section 
      ? ` (${chunk.metadata.section})` 
      : ''
    
    return `### ${header}${section}\n${chunk.content}`
  })

  return sections.join('\n\n---\n\n')
}
