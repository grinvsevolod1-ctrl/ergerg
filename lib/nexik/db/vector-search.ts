/**
 * Nexik Vector Search with pgvector
 * Семантический поиск по базе знаний
 */

import { query as dbQuery } from '@/lib/db'
import { getOllamaClient } from '@/lib/ai/providers'

// Embedding dimensions (depends on model)
const EMBEDDING_DIMENSIONS = 384 // nomic-embed-text, all-MiniLM-L6-v2

/**
 * SQL для создания расширения и индексов pgvector
 */
export const PGVECTOR_SETUP_SQL = `
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to knowledge chunks
ALTER TABLE nexik_knowledge_chunks 
ADD COLUMN IF NOT EXISTS embedding vector(${EMBEDDING_DIMENSIONS});

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS nexik_chunks_embedding_idx 
ON nexik_knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION nexik_semantic_search(
  p_org_id UUID,
  p_query_embedding vector,
  p_limit INTEGER DEFAULT 5,
  p_min_similarity FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as chunk_id,
    c.document_id,
    c.content,
    c.metadata,
    1 - (c.embedding <=> p_query_embedding) as similarity
  FROM nexik_knowledge_chunks c
  JOIN nexik_knowledge_docs d ON d.id = c.document_id
  WHERE d.org_id = p_org_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_query_embedding) >= p_min_similarity
  ORDER BY c.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
`

/**
 * Получить embedding для текста через Ollama
 */
export async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const client = getOllamaClient()
    
    // Используем Ollama embeddings API
    const response = await fetch(`${client.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'nomic-embed-text', // или all-minilm, mxbai-embed-large
        prompt: text
      })
    })
    
    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data.embedding
  } catch (error) {
    console.error('[Vector Search] Embedding error:', error)
    return null
  }
}

/**
 * Сохранить embedding для чанка
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
 * Индексировать документ (создать embeddings для всех чанков)
 */
export async function indexDocument(documentId: string): Promise<number> {
  try {
    // Получаем все чанки документа
    const chunks = await dbQuery<{ id: string; content: string }>(
      `SELECT id, content FROM nexik_knowledge_chunks WHERE document_id = $1`,
      [documentId]
    )
    
    let indexed = 0
    
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.content)
      
      if (embedding) {
        await saveChunkEmbedding(chunk.id, embedding)
        indexed++
      }
      
      // Небольшая пауза чтобы не перегружать Ollama
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    return indexed
  } catch (error) {
    console.error('[Vector Search] Index document error:', error)
    return 0
  }
}

/**
 * Семантический поиск по базе знаний
 */
export async function semanticSearch(
  orgId: string,
  queryText: string,
  options: {
    limit?: number
    minSimilarity?: number
  } = {}
): Promise<Array<{
  chunkId: string
  documentId: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}>> {
  const { limit = 5, minSimilarity = 0.5 } = options
  
  try {
    // Получаем embedding для запроса
    const queryEmbedding = await getEmbedding(queryText)
    
    if (!queryEmbedding) {
      console.warn('[Vector Search] Failed to get query embedding, falling back to keyword search')
      return fallbackKeywordSearch(orgId, queryText, limit)
    }
    
    // Выполняем семантический поиск
    const results = await dbQuery<{
      chunk_id: string
      document_id: string
      content: string
      metadata: Record<string, unknown>
      similarity: number
    }>(
      `SELECT * FROM nexik_semantic_search($1, $2::vector, $3, $4)`,
      [orgId, `[${queryEmbedding.join(',')}]`, limit, minSimilarity]
    )
    
    return results.map(r => ({
      chunkId: r.chunk_id,
      documentId: r.document_id,
      content: r.content,
      metadata: r.metadata,
      similarity: r.similarity
    }))
  } catch (error) {
    console.error('[Vector Search] Search error:', error)
    return fallbackKeywordSearch(orgId, queryText, limit)
  }
}

/**
 * Fallback на keyword search если pgvector недоступен
 */
async function fallbackKeywordSearch(
  orgId: string,
  queryText: string,
  limit: number
): Promise<Array<{
  chunkId: string
  documentId: string
  content: string
  metadata: Record<string, unknown>
  similarity: number
}>> {
  try {
    // Простой поиск по ключевым словам с ts_rank
    const keywords = queryText
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2)
      .join(' & ')
    
    const results = await dbQuery<{
      id: string
      document_id: string
      content: string
      metadata: Record<string, unknown>
      rank: number
    }>(
      `SELECT 
        c.id,
        c.document_id,
        c.content,
        c.metadata,
        ts_rank(to_tsvector('russian', c.content), plainto_tsquery('russian', $2)) as rank
       FROM nexik_knowledge_chunks c
       JOIN nexik_knowledge_docs d ON d.id = c.document_id
       WHERE d.org_id = $1
         AND to_tsvector('russian', c.content) @@ plainto_tsquery('russian', $2)
       ORDER BY rank DESC
       LIMIT $3`,
      [orgId, queryText, limit]
    )
    
    return results.map(r => ({
      chunkId: r.id,
      documentId: r.document_id,
      content: r.content,
      metadata: r.metadata,
      similarity: Math.min(r.rank, 1) // Normalize to 0-1
    }))
  } catch (error) {
    console.error('[Vector Search] Fallback search error:', error)
    return []
  }
}

/**
 * Получить контекст для RAG
 */
export async function getRAGContext(
  orgId: string,
  query: string,
  options: { topK?: number } = {}
): Promise<string | null> {
  const results = await semanticSearch(orgId, query, { 
    limit: options.topK || 3,
    minSimilarity: 0.4
  })
  
  if (results.length === 0) {
    return null
  }
  
  // Форматируем контекст
  const context = results
    .map((r, i) => {
      const title = (r.metadata?.title as string) || `Источник ${i + 1}`
      return `### ${title}\n${r.content}`
    })
    .join('\n\n---\n\n')
  
  return `## Релевантная информация из базы знаний:\n\n${context}`
}

/**
 * Переиндексировать всю базу знаний организации
 */
export async function reindexOrganization(orgId: string): Promise<{
  documents: number
  chunks: number
  indexed: number
}> {
  const stats = { documents: 0, chunks: 0, indexed: 0 }
  
  try {
    // Получаем все документы организации
    const documents = await dbQuery<{ id: string }>(
      `SELECT id FROM nexik_knowledge_docs WHERE org_id = $1`,
      [orgId]
    )
    
    stats.documents = documents.length
    
    for (const doc of documents) {
      const indexed = await indexDocument(doc.id)
      stats.indexed += indexed
    }
    
    // Подсчитываем общее количество чанков
    const chunkCount = await dbQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM nexik_knowledge_chunks c
       JOIN nexik_knowledge_docs d ON d.id = c.document_id
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
