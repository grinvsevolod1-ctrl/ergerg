/**
 * Nexik Knowledge Base (RAG) Management
 */

import { query, queryOne, execute } from '@/lib/db'
import { 
  semanticSearch, 
  getRAGContext as getVectorRAGContext,
  indexDocument as indexDocumentVector 
} from './vector-search'

export interface KnowledgeDoc {
  id: string
  org_id: string
  title: string
  content: string
  source_type: 'manual' | 'url' | 'file' | 'faq'
  source_url: string | null
  status: 'pending' | 'processing' | 'ready' | 'failed'
  chunks_count: number
  metadata: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export interface KnowledgeChunk {
  id: string
  doc_id: string
  org_id: string
  content: string
  chunk_index: number
  tokens: string[]
  token_weights: Record<string, number>
  created_at: Date
}

export interface SearchResult {
  chunk_id: string
  doc_id: string
  doc_title: string
  content: string
  score: number
}

// Document CRUD
export async function createDocument(data: {
  org_id: string
  title: string
  content: string
  source_type?: KnowledgeDoc['source_type']
  source_url?: string
  metadata?: Record<string, unknown>
}): Promise<KnowledgeDoc> {
  const result = await query<KnowledgeDoc>(
    `INSERT INTO nexik_knowledge_docs (org_id, title, content, source_type, source_url, metadata, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending')
     RETURNING *`,
    [
      data.org_id,
      data.title,
      data.content,
      data.source_type || 'manual',
      data.source_url || null,
      JSON.stringify(data.metadata || {})
    ]
  )
  
  const doc = result[0]
  
  // Process immediately (in real production this would be a job queue)
  await processDocument(doc.id)
  
  return doc
}

export async function getDocument(id: string): Promise<KnowledgeDoc | null> {
  return queryOne<KnowledgeDoc>(
    'SELECT * FROM nexik_knowledge_docs WHERE id = $1',
    [id]
  )
}

export async function getOrgDocuments(orgId: string): Promise<KnowledgeDoc[]> {
  return query<KnowledgeDoc>(
    'SELECT * FROM nexik_knowledge_docs WHERE org_id = $1 ORDER BY created_at DESC',
    [orgId]
  )
}

export async function updateDocument(id: string, data: {
  title?: string
  content?: string
  metadata?: Record<string, unknown>
}): Promise<KnowledgeDoc | null> {
  const sets: string[] = ['updated_at = NOW()']
  const params: unknown[] = []
  let idx = 1

  if (data.title !== undefined) {
    sets.push(`title = $${idx++}`)
    params.push(data.title)
  }
  if (data.content !== undefined) {
    sets.push(`content = $${idx++}`)
    params.push(data.content)
    sets.push(`status = 'pending'`) // Needs reprocessing
  }
  if (data.metadata !== undefined) {
    sets.push(`metadata = $${idx++}`)
    params.push(JSON.stringify(data.metadata))
  }

  params.push(id)

  const result = await query<KnowledgeDoc>(
    `UPDATE nexik_knowledge_docs SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    params
  )

  const doc = result[0]
  if (doc && data.content !== undefined) {
    // Reprocess if content changed
    await processDocument(doc.id)
  }

  return doc || null
}

export async function deleteDocument(id: string): Promise<boolean> {
  // Chunks are deleted by CASCADE
  const count = await execute('DELETE FROM nexik_knowledge_docs WHERE id = $1', [id])
  return count > 0
}

// Document processing
export async function processDocument(docId: string): Promise<void> {
  const doc = await getDocument(docId)
  if (!doc) return

  try {
    // Update status
    await execute(
      "UPDATE nexik_knowledge_docs SET status = 'processing' WHERE id = $1",
      [docId]
    )

    // Delete existing chunks
    await execute('DELETE FROM nexik_knowledge_chunks WHERE doc_id = $1', [docId])

    // Split into chunks
    const chunks = splitIntoChunks(doc.content, 500, 50) // 500 chars, 50 overlap

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const { tokens, weights } = tokenize(chunk)

      await execute(
        `INSERT INTO nexik_knowledge_chunks (doc_id, org_id, content, chunk_index, tokens, token_weights)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [docId, doc.org_id, chunk, i, tokens, JSON.stringify(weights)]
      )
    }

    // Update document status
    await execute(
      "UPDATE nexik_knowledge_docs SET status = 'ready', chunks_count = $1, updated_at = NOW() WHERE id = $2",
      [chunks.length, docId]
    )

    // Index with vector embeddings (async, non-blocking)
    indexDocumentVector(docId).catch(err => {
      console.warn('[Nexik Knowledge] Vector indexing failed (non-critical):', err)
    })
  } catch (error) {
    console.error('[Nexik Knowledge] Processing failed:', error)
    await execute(
      "UPDATE nexik_knowledge_docs SET status = 'failed', updated_at = NOW() WHERE id = $1",
      [docId]
    )
  }
}

// Text splitting
function splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  const sentences = text.split(/(?<=[.!?])\s+/)
  
  let currentChunk = ''
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      // Keep overlap
      const words = currentChunk.split(' ')
      const overlapWords = words.slice(-Math.ceil(overlap / 5))
      currentChunk = overlapWords.join(' ') + ' '
    }
    currentChunk += sentence + ' '
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }
  
  return chunks
}

// Tokenization for TF-IDF
function tokenize(text: string): { tokens: string[]; weights: Record<string, number> } {
  // Simple tokenization - in production use proper NLP
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2)

  // Count frequencies
  const freq: Record<string, number> = {}
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1
  }

  // Calculate TF weights
  const maxFreq = Math.max(...Object.values(freq))
  const weights: Record<string, number> = {}
  for (const [word, count] of Object.entries(freq)) {
    weights[word] = count / maxFreq
  }

  return {
    tokens: Object.keys(freq),
    weights
  }
}

// Search
export async function searchKnowledge(
  orgId: string,
  queryText: string,
  topK = 5
): Promise<SearchResult[]> {
  const { tokens: queryTokens } = tokenize(queryText)
  
  if (queryTokens.length === 0) return []

  // TF-IDF style search using array overlap
  const results = await query<{
    id: string
    doc_id: string
    title: string
    content: string
    score: number
  }>(`
    WITH query_tokens AS (
      SELECT unnest($2::text[]) as token
    ),
    chunk_scores AS (
      SELECT 
        c.id,
        c.doc_id,
        d.title,
        c.content,
        -- Score based on token overlap and weights
        COALESCE(SUM((c.token_weights->>qt.token)::float), 0) as score
      FROM nexik_knowledge_chunks c
      JOIN nexik_knowledge_docs d ON c.doc_id = d.id
      LEFT JOIN query_tokens qt ON c.tokens @> ARRAY[qt.token]
      WHERE c.org_id = $1 AND d.status = 'ready'
      GROUP BY c.id, c.doc_id, d.title, c.content
    )
    SELECT * FROM chunk_scores
    WHERE score > 0
    ORDER BY score DESC
    LIMIT $3
  `, [orgId, queryTokens, topK])

  return results.map(r => ({
    chunk_id: r.id,
    doc_id: r.doc_id,
    doc_title: r.title,
    content: r.content,
    score: r.score
  }))
}

// Format context for AI prompt
export async function getRAGContextForPrompt(
  orgId: string,
  queryText: string,
  topK = 3
): Promise<string | null> {
  // Try vector search first (semantic)
  try {
    const vectorContext = await getVectorRAGContext(orgId, queryText, { topK })
    if (vectorContext) {
      return vectorContext
    }
  } catch (err) {
    console.warn('[Nexik Knowledge] Vector search failed, falling back to TF-IDF:', err)
  }

  // Fallback to TF-IDF search
  const results = await searchKnowledge(orgId, queryText, topK)
  
  if (results.length === 0) return null

  const contextParts = results.map((r, i) => 
    `[Источник ${i + 1}: ${r.doc_title}]\n${r.content}`
  )

  return `КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:\n\n${contextParts.join('\n\n---\n\n')}`
}

// Stats
export async function getKnowledgeStats(orgId: string): Promise<{
  total_docs: number
  total_chunks: number
  ready_docs: number
  pending_docs: number
}> {
  const result = await query<{
    total_docs: string
    total_chunks: string
    ready_docs: string
    pending_docs: string
  }>(`
    SELECT
      (SELECT COUNT(*) FROM nexik_knowledge_docs WHERE org_id = $1) as total_docs,
      (SELECT COUNT(*) FROM nexik_knowledge_chunks WHERE org_id = $1) as total_chunks,
      (SELECT COUNT(*) FROM nexik_knowledge_docs WHERE org_id = $1 AND status = 'ready') as ready_docs,
      (SELECT COUNT(*) FROM nexik_knowledge_docs WHERE org_id = $1 AND status = 'pending') as pending_docs
  `, [orgId])

  const row = result[0]
  return {
    total_docs: parseInt(row?.total_docs || '0', 10),
    total_chunks: parseInt(row?.total_chunks || '0', 10),
    ready_docs: parseInt(row?.ready_docs || '0', 10),
    pending_docs: parseInt(row?.pending_docs || '0', 10)
  }
}
