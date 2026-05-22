/**
 * Nexik Advanced RAG System
 * 
 * Features:
 * - Hybrid Search (Semantic + Keyword with RRF fusion)
 * - Re-ranking with multiple signals
 * - Smart chunking with overlap and semantic boundaries
 * - Better than Intercom/Tidio
 */

import { query as dbQuery } from '@/lib/db'
import { getOllamaClient } from '@/lib/ai/providers'

// =====================================================
// CONFIGURATION
// =====================================================

const CONFIG = {
  embedding: {
    dimensions: 384, // nomic-embed-text, all-MiniLM-L6-v2
    model: 'nomic-embed-text',
    batchSize: 10,
    retryAttempts: 3
  },
  search: {
    semanticWeight: 0.6,
    keywordWeight: 0.4,
    rrfK: 60, // RRF parameter (standard is 60)
    defaultLimit: 5,
    minSimilarity: 0.4
  },
  chunking: {
    maxChunkSize: 512,
    minChunkSize: 100,
    overlapSize: 50,
    overlapPercentage: 0.15
  },
  reranking: {
    queryTermBoost: 0.3,
    positionBoost: 0.1,
    recencyBoost: 0.1,
    densityBoost: 0.2,
    titleMatchBoost: 0.3
  }
}

// =====================================================
// TYPES
// =====================================================

export interface SearchResult {
  chunkId: string
  documentId: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
  semanticScore?: number
  keywordScore?: number
  rerankScore?: number
}

export interface ChunkingOptions {
  maxSize?: number
  minSize?: number
  overlap?: number
  preserveStructure?: boolean
}

export interface SearchOptions {
  limit?: number
  minSimilarity?: number
  useHybrid?: boolean
  useReranking?: boolean
  boostRecent?: boolean
}

// =====================================================
// PGVECTOR SETUP SQL
// =====================================================

export const PGVECTOR_SETUP_SQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge chunks
ALTER TABLE nexik_knowledge_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(${CONFIG.embedding.dimensions});

-- Add metadata column for smart chunking
ALTER TABLE nexik_knowledge_chunks
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add created_at for recency boost
ALTER TABLE nexik_knowledge_chunks
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS nexik_chunks_embedding_idx 
ON nexik_knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS nexik_chunks_fts_idx 
ON nexik_knowledge_chunks 
USING gin(to_tsvector('russian', content));

-- Create GIN index for English text search
CREATE INDEX IF NOT EXISTS nexik_chunks_fts_en_idx 
ON nexik_knowledge_chunks 
USING gin(to_tsvector('english', content));
`

// =====================================================
// EMBEDDINGS
// =====================================================

/**
 * Get embedding for text via Ollama with retry logic
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  const { retryAttempts, model } = CONFIG.embedding
  
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const client = getOllamaClient()
      
      const response = await fetch(`${client.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: text.slice(0, 8000) // Limit input size
        })
      })
      
      if (!response.ok) {
        throw new Error(`Embedding request failed: ${response.status}`)
      }
      
      const data = await response.json()
      return data.embedding
    } catch (error) {
      console.error(`[Vector Search] Embedding attempt ${attempt} failed:`, error)
      
      if (attempt < retryAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  
  return null
}

/**
 * Get embeddings for multiple texts in batch
 */
export async function getEmbeddingsBatch(texts: string[]): Promise<(number[] | null)[]> {
  const results: (number[] | null)[] = []
  const { batchSize } = CONFIG.embedding
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(text => getEmbedding(text)))
    results.push(...batchResults)
    
    // Small delay between batches
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  return results
}

// =====================================================
// SMART CHUNKING
// =====================================================

/**
 * Smart text chunking with semantic boundaries and overlap
 */
export function smartChunk(
  text: string,
  options: ChunkingOptions = {}
): Array<{ content: string; index: number; metadata: Record<string, unknown> }> {
  const {
    maxSize = CONFIG.chunking.maxChunkSize,
    minSize = CONFIG.chunking.minChunkSize,
    overlap = CONFIG.chunking.overlapSize,
    preserveStructure = true
  } = options
  
  const chunks: Array<{ content: string; index: number; metadata: Record<string, unknown> }> = []
  
  // Step 1: Split by semantic boundaries (headers, paragraphs, lists)
  const semanticBoundaries = preserveStructure
    ? splitBySemanticBoundaries(text)
    : [text]
  
  let globalIndex = 0
  
  for (const section of semanticBoundaries) {
    if (section.trim().length < minSize) {
      continue
    }
    
    // Step 2: If section is small enough, use as-is
    if (section.length <= maxSize) {
      chunks.push({
        content: section.trim(),
        index: globalIndex++,
        metadata: {
          charStart: text.indexOf(section),
          charEnd: text.indexOf(section) + section.length,
          isComplete: true
        }
      })
      continue
    }
    
    // Step 3: Split large sections with sliding window and overlap
    const sectionChunks = slidingWindowChunk(section, maxSize, overlap, minSize)
    
    for (const chunk of sectionChunks) {
      chunks.push({
        content: chunk.content,
        index: globalIndex++,
        metadata: {
          ...chunk.metadata,
          parentSection: section.slice(0, 50) + '...'
        }
      })
    }
  }
  
  return chunks
}

/**
 * Split text by semantic boundaries (headers, paragraphs, lists)
 */
function splitBySemanticBoundaries(text: string): string[] {
  const sections: string[] = []
  
  // Patterns for semantic boundaries
  const patterns = [
    /^#{1,6}\s+.+$/gm,           // Markdown headers
    /^[\*\-]\s+.+$/gm,            // List items
    /^\d+\.\s+.+$/gm,             // Numbered lists
    /\n{2,}/g,                     // Double newlines (paragraphs)
    /(?<=[.!?])\s+(?=[A-ZА-ЯЁ])/g // Sentence boundaries with capitalization
  ]
  
  // Split by headers first
  const headerSplit = text.split(/(?=^#{1,6}\s+)/gm)
  
  for (const section of headerSplit) {
    if (!section.trim()) continue
    
    // Further split by double newlines if section is large
    if (section.length > CONFIG.chunking.maxChunkSize * 2) {
      const paragraphs = section.split(/\n{2,}/)
      sections.push(...paragraphs.filter(p => p.trim()))
    } else {
      sections.push(section)
    }
  }
  
  return sections
}

/**
 * Sliding window chunking with overlap
 */
function slidingWindowChunk(
  text: string,
  maxSize: number,
  overlap: number,
  minSize: number
): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = []
  const sentences = splitIntoSentences(text)
  
  let currentChunk = ''
  let startIdx = 0
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]
    
    if (currentChunk.length + sentence.length <= maxSize) {
      currentChunk += sentence
    } else {
      // Save current chunk if it meets minimum size
      if (currentChunk.length >= minSize) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: {
            sentenceStart: startIdx,
            sentenceEnd: i - 1,
            hasOverlap: chunks.length > 0
          }
        })
      }
      
      // Start new chunk with overlap
      const overlapSentences = Math.ceil(overlap / (currentChunk.length / (i - startIdx) || 50))
      startIdx = Math.max(0, i - overlapSentences)
      currentChunk = sentences.slice(startIdx, i + 1).join('')
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length >= minSize) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        sentenceStart: startIdx,
        sentenceEnd: sentences.length - 1,
        isLast: true
      }
    })
  }
  
  return chunks
}

/**
 * Split text into sentences (Russian + English aware)
 */
function splitIntoSentences(text: string): string[] {
  // Handle abbreviations and edge cases
  const preprocessed = text
    .replace(/([A-ZА-ЯЁ]\.)\s+/g, '$1SENTBREAK')
    .replace(/(\d)\.\s+/g, '$1.NUMBREAK')
  
  const sentences = preprocessed
    .split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ]|$)/g)
    .map(s => s.replace(/SENTBREAK/g, ' ').replace(/NUMBREAK/g, ' '))
    .filter(s => s.trim())
  
  return sentences
}

// =====================================================
// HYBRID SEARCH (Semantic + Keyword)
// =====================================================

/**
 * Hybrid search combining semantic and keyword search with RRF
 */
export async function hybridSearch(
  orgId: string,
  queryText: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    limit = CONFIG.search.defaultLimit,
    minSimilarity = CONFIG.search.minSimilarity,
    useReranking = true,
    boostRecent = false
  } = options
  
  // Run both searches in parallel
  const [semanticResults, keywordResults] = await Promise.all([
    semanticSearchInternal(orgId, queryText, limit * 2, minSimilarity),
    keywordSearchInternal(orgId, queryText, limit * 2)
  ])
  
  // Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion(semanticResults, keywordResults, limit * 2)
  
  // Re-ranking if enabled
  let finalResults = fusedResults
  if (useReranking) {
    finalResults = rerank(fusedResults, queryText, { boostRecent })
  }
  
  return finalResults.slice(0, limit)
}

/**
 * Semantic search using pgvector
 */
async function semanticSearchInternal(
  orgId: string,
  queryText: string,
  limit: number,
  minSimilarity: number
): Promise<SearchResult[]> {
  try {
    const queryEmbedding = await getEmbedding(queryText)
    
    if (!queryEmbedding) {
      return []
    }
    
    const results = await dbQuery<{
      id: string
      doc_id: string
      content: string
      metadata: Record<string, unknown>
      similarity: number
    }>(
      `SELECT 
        c.id,
        c.doc_id,
        c.content,
        c.metadata,
        1 - (c.embedding <=> $2::vector) as similarity
       FROM nexik_knowledge_chunks c
       JOIN nexik_knowledge_docs d ON d.id = c.doc_id
       WHERE d.org_id = $1
         AND c.embedding IS NOT NULL
         AND 1 - (c.embedding <=> $2::vector) >= $3
       ORDER BY c.embedding <=> $2::vector
       LIMIT $4`,
      [orgId, `[${queryEmbedding.join(',')}]`, minSimilarity, limit]
    )
    
    return results.map(r => ({
      chunkId: r.id,
      documentId: r.doc_id,
      content: r.content,
      metadata: r.metadata || {},
      similarity: r.similarity,
      semanticScore: r.similarity
    }))
  } catch (error) {
    console.error('[Hybrid Search] Semantic search error:', error)
    return []
  }
}

/**
 * Keyword search using PostgreSQL full-text search with BM25-like ranking
 */
async function keywordSearchInternal(
  orgId: string,
  queryText: string,
  limit: number
): Promise<SearchResult[]> {
  try {
    // Prepare search query for both Russian and English
    const tsQuery = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .map(w => `${w}:*`)
      .join(' | ')
    
    if (!tsQuery) return []
    
    const results = await dbQuery<{
      id: string
      doc_id: string
      content: string
      metadata: Record<string, unknown>
      rank: number
    }>(
      `SELECT 
        c.id,
        c.doc_id,
        c.content,
        c.metadata,
        (
          ts_rank_cd(to_tsvector('russian', c.content), to_tsquery('russian', $2), 32) +
          ts_rank_cd(to_tsvector('english', c.content), to_tsquery('english', $2), 32)
        ) / 2.0 as rank
       FROM nexik_knowledge_chunks c
       JOIN nexik_knowledge_docs d ON d.id = c.doc_id
       WHERE d.org_id = $1
         AND (
           to_tsvector('russian', c.content) @@ to_tsquery('russian', $2)
           OR to_tsvector('english', c.content) @@ to_tsquery('english', $2)
         )
       ORDER BY rank DESC
       LIMIT $3`,
      [orgId, tsQuery, limit]
    )
    
    // Normalize ranks to 0-1 range
    const maxRank = Math.max(...results.map(r => r.rank), 0.001)
    
    return results.map(r => ({
      chunkId: r.id,
      documentId: r.doc_id,
      content: r.content,
      metadata: r.metadata || {},
      similarity: r.rank / maxRank,
      keywordScore: r.rank / maxRank
    }))
  } catch (error) {
    console.error('[Hybrid Search] Keyword search error:', error)
    return []
  }
}

/**
 * Reciprocal Rank Fusion - combines results from multiple search methods
 * Formula: RRF(d) = Σ 1/(k + rank(d))
 */
function reciprocalRankFusion(
  semanticResults: SearchResult[],
  keywordResults: SearchResult[],
  limit: number
): SearchResult[] {
  const k = CONFIG.search.rrfK
  const scoreMap = new Map<string, { result: SearchResult; score: number }>()
  
  // Score semantic results
  semanticResults.forEach((result, rank) => {
    const rrfScore = CONFIG.search.semanticWeight / (k + rank + 1)
    scoreMap.set(result.chunkId, {
      result: { ...result },
      score: rrfScore
    })
  })
  
  // Add/merge keyword results
  keywordResults.forEach((result, rank) => {
    const rrfScore = CONFIG.search.keywordWeight / (k + rank + 1)
    const existing = scoreMap.get(result.chunkId)
    
    if (existing) {
      existing.score += rrfScore
      existing.result.keywordScore = result.keywordScore
    } else {
      scoreMap.set(result.chunkId, {
        result: { ...result },
        score: rrfScore
      })
    }
  })
  
  // Sort by combined score
  const fusedResults = Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      ...item.result,
      similarity: item.score
    }))
  
  return fusedResults
}

// =====================================================
// RE-RANKING
// =====================================================

/**
 * Re-rank results using multiple signals
 */
function rerank(
  results: SearchResult[],
  query: string,
  options: { boostRecent?: boolean } = {}
): SearchResult[] {
  const queryTerms = extractQueryTerms(query)
  
  const rerankedResults = results.map((result, originalRank) => {
    let rerankScore = result.similarity
    
    // 1. Query term coverage boost
    const termCoverage = calculateTermCoverage(result.content, queryTerms)
    rerankScore += termCoverage * CONFIG.reranking.queryTermBoost
    
    // 2. Keyword density score
    const density = calculateKeywordDensity(result.content, queryTerms)
    rerankScore += density * CONFIG.reranking.densityBoost
    
    // 3. Position boost (terms appearing early rank higher)
    const positionScore = calculatePositionScore(result.content, queryTerms)
    rerankScore += positionScore * CONFIG.reranking.positionBoost
    
    // 4. Title/header match boost
    if (result.metadata?.title) {
      const titleMatch = calculateTermCoverage(result.metadata.title as string, queryTerms)
      rerankScore += titleMatch * CONFIG.reranking.titleMatchBoost
    }
    
    // 5. Recency boost (optional)
    if (options.boostRecent && result.metadata?.created_at) {
      const recencyScore = calculateRecencyScore(result.metadata.created_at as string)
      rerankScore += recencyScore * CONFIG.reranking.recencyBoost
    }
    
    return {
      ...result,
      rerankScore,
      similarity: rerankScore
    }
  })
  
  return rerankedResults.sort((a, b) => b.similarity - a.similarity)
}

/**
 * Extract meaningful query terms
 */
function extractQueryTerms(query: string): string[] {
  // Remove stop words (Russian + English)
  const stopWords = new Set([
    'и', 'в', 'на', 'с', 'по', 'для', 'что', 'как', 'это', 'или', 'не', 'а', 'но',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before',
    'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once'
  ])
  
  return query
    .toLowerCase()
    .replace(/[^\wа-яё]/gi, ' ')
    .split(/\s+/)
    .filter(term => term.length > 2 && !stopWords.has(term))
}

/**
 * Calculate what percentage of query terms appear in the content
 */
function calculateTermCoverage(content: string, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0
  
  const contentLower = content.toLowerCase()
  const matchedTerms = queryTerms.filter(term => contentLower.includes(term))
  
  return matchedTerms.length / queryTerms.length
}

/**
 * Calculate keyword density (term frequency normalized by content length)
 */
function calculateKeywordDensity(content: string, queryTerms: string[]): number {
  if (queryTerms.length === 0 || content.length === 0) return 0
  
  const contentLower = content.toLowerCase()
  let totalOccurrences = 0
  
  for (const term of queryTerms) {
    const regex = new RegExp(term, 'gi')
    const matches = contentLower.match(regex)
    totalOccurrences += matches ? matches.length : 0
  }
  
  // Normalize by content length (per 1000 chars)
  const density = (totalOccurrences / content.length) * 1000
  
  // Cap at 1.0
  return Math.min(density / 10, 1.0)
}

/**
 * Calculate position score (earlier mentions score higher)
 */
function calculatePositionScore(content: string, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0
  
  const contentLower = content.toLowerCase()
  let totalPositionScore = 0
  let matchedTerms = 0
  
  for (const term of queryTerms) {
    const position = contentLower.indexOf(term)
    if (position !== -1) {
      // Earlier position = higher score (1.0 at start, 0.0 at end)
      totalPositionScore += 1 - (position / content.length)
      matchedTerms++
    }
  }
  
  return matchedTerms > 0 ? totalPositionScore / matchedTerms : 0
}

/**
 * Calculate recency score (newer content scores higher)
 */
function calculateRecencyScore(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const daysSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  
  // Exponential decay: score = e^(-days/365)
  // Content older than 1 year gets minimal boost
  return Math.exp(-daysSinceCreation / 365)
}

// =====================================================
// MAIN SEARCH INTERFACE
// =====================================================

/**
 * Main search function - uses hybrid search by default
 */
export async function semanticSearch(
  orgId: string,
  queryText: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { useHybrid = true } = options
  
  if (useHybrid) {
    return hybridSearch(orgId, queryText, options)
  }
  
  // Fallback to semantic-only
  return semanticSearchInternal(
    orgId,
    queryText,
    options.limit || CONFIG.search.defaultLimit,
    options.minSimilarity || CONFIG.search.minSimilarity
  )
}

/**
 * Get RAG context for AI prompt
 */
export async function getRAGContext(
  orgId: string,
  query: string,
  options: { topK?: number; includeMetadata?: boolean } = {}
): Promise<string | null> {
  const results = await hybridSearch(orgId, query, {
    limit: options.topK || 3,
    minSimilarity: 0.3,
    useReranking: true
  })
  
  if (results.length === 0) {
    return null
  }
  
  // Format context with relevance scores
  const context = results
    .map((r, i) => {
      const title = (r.metadata?.title as string) || `Источник ${i + 1}`
      const relevance = Math.round(r.similarity * 100)
      
      if (options.includeMetadata) {
        return `### ${title} (релевантность: ${relevance}%)\n${r.content}`
      }
      return `### ${title}\n${r.content}`
    })
    .join('\n\n---\n\n')
  
  return `## Релевантная информация из базы знаний:\n\n${context}`
}

// =====================================================
// INDEXING
// =====================================================

/**
 * Save chunk embedding
 */
export async function saveChunkEmbedding(
  chunkId: string,
  embedding: number[]
): Promise<boolean> {
  try {
    await dbQuery(
      `UPDATE nexik_knowledge_chunks 
       SET embedding = $1::vector 
       WHERE id = $2`,
      [`[${embedding.join(',')}]`, chunkId]
    )
    return true
  } catch (error) {
    console.error('[Vector Search] Save embedding error:', error)
    return false
  }
}

/**
 * Index document (create embeddings for all chunks)
 */
export async function indexDocument(documentId: string): Promise<number> {
  try {
    const chunks = await dbQuery<{ id: string; content: string }>(
      `SELECT id, content FROM nexik_knowledge_chunks WHERE doc_id = $1`,
      [documentId]
    )
    
    let indexed = 0
    
    // Batch processing for efficiency
    const batchSize = CONFIG.embedding.batchSize
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      const embeddings = await getEmbeddingsBatch(batch.map(c => c.content))
      
      for (let j = 0; j < batch.length; j++) {
        if (embeddings[j]) {
          await saveChunkEmbedding(batch[j].id, embeddings[j]!)
          indexed++
        }
      }
    }
    
    return indexed
  } catch (error) {
    console.error('[Vector Search] Index document error:', error)
    return 0
  }
}

/**
 * Reindex entire organization's knowledge base
 */
export async function reindexOrganization(orgId: string): Promise<{
  documents: number
  chunks: number
  indexed: number
}> {
  const stats = { documents: 0, chunks: 0, indexed: 0 }
  
  try {
    const documents = await dbQuery<{ id: string }>(
      `SELECT id FROM nexik_knowledge_docs WHERE org_id = $1`,
      [orgId]
    )
    
    stats.documents = documents.length
    
    for (const doc of documents) {
      const indexed = await indexDocument(doc.id)
      stats.indexed += indexed
    }
    
    const chunkCount = await dbQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM nexik_knowledge_chunks c
       JOIN nexik_knowledge_docs d ON d.id = c.doc_id
       WHERE d.org_id = $1`,
      [orgId]
    )
    
    stats.chunks = parseInt(chunkCount[0]?.count || '0')
    
    return stats
  } catch (error) {
    console.error('[Vector Search] Reindex error:', error)
    return stats
  }
}
