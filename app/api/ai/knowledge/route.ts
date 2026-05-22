/**
 * Nexik Knowledge Base API
 * Управление базой знаний
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  addDocument, 
  addFAQs, 
  getDocuments, 
  removeDocument,
  search,
  clearKnowledge,
} from '@/lib/ai/knowledge'

// GET - получить документы
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') || 'netnext'
  const query = searchParams.get('query')

  try {
    // Если есть query — поиск
    if (query) {
      const results = await search(clientId, query, { topK: 5 })
      return NextResponse.json({
        query,
        results: results.map(r => ({
          documentId: r.document.id,
          title: r.document.title,
          content: r.chunk.content,
          score: r.score,
          section: r.chunk.metadata?.section,
        })),
      })
    }

    // Иначе — список документов
    const documents = await getDocuments(clientId)
    return NextResponse.json({
      clientId,
      documents: documents.map(d => ({
        id: d.id,
        type: d.type,
        title: d.title,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        metadata: d.metadata,
      })),
      total: documents.length,
    })
  } catch (error) {
    console.error('[Knowledge API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to get knowledge' },
      { status: 500 }
    )
  }
}

// POST - добавить документ или FAQ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId = 'netnext', type, ...data } = body

    if (type === 'faq') {
      // Добавление FAQ
      const { faqs } = data
      if (!Array.isArray(faqs)) {
        return NextResponse.json(
          { error: 'faqs must be an array' },
          { status: 400 }
        )
      }

      const docs = await addFAQs(clientId, faqs)
      return NextResponse.json({
        success: true,
        added: docs.length,
        documents: docs.map(d => ({ id: d.id, title: d.title })),
      })
    }

    // Добавление документа
    const { title, content, metadata } = data
    if (!title || !content) {
      return NextResponse.json(
        { error: 'title and content are required' },
        { status: 400 }
      )
    }

    const doc = await addDocument(clientId, {
      type: type || 'document',
      title,
      content,
      metadata,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: doc.id,
        title: doc.title,
        type: doc.type,
        createdAt: doc.createdAt,
      },
    })
  } catch (error) {
    console.error('[Knowledge API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to add knowledge' },
      { status: 500 }
    )
  }
}

// DELETE - удалить документ или очистить базу
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId') || 'netnext'
  const documentId = searchParams.get('documentId')
  const clearAll = searchParams.get('clearAll') === 'true'

  try {
    if (clearAll) {
      await clearKnowledge(clientId)
      return NextResponse.json({
        success: true,
        message: `Knowledge base cleared for client: ${clientId}`,
      })
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    const removed = await removeDocument(clientId, documentId)
    
    if (!removed) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Document ${documentId} removed`,
    })
  } catch (error) {
    console.error('[Knowledge API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}
