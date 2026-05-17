import { describe, it, expect, beforeEach } from 'vitest'
import { 
  addDocument, 
  addFAQs, 
  search, 
  getRAGContext, 
  clearKnowledge,
  getDocuments 
} from '@/lib/ai/knowledge/store'

describe('Knowledge Base', () => {
  const testClientId = 'test-client'

  beforeEach(async () => {
    await clearKnowledge(testClientId)
  })

  describe('addDocument', () => {
    it('should add a document and return it with id', async () => {
      const doc = await addDocument(testClientId, {
        type: 'document',
        title: 'Test Document',
        content: 'This is test content for the document.',
      })

      expect(doc.id).toBeDefined()
      expect(doc.clientId).toBe(testClientId)
      expect(doc.title).toBe('Test Document')
      expect(doc.content).toContain('test content')
    })

    it('should store documents per client', async () => {
      await addDocument(testClientId, {
        type: 'document',
        title: 'Doc 1',
        content: 'Content 1',
      })

      await addDocument('other-client', {
        type: 'document',
        title: 'Doc 2',
        content: 'Content 2',
      })

      const docs = await getDocuments(testClientId)
      expect(docs).toHaveLength(1)
      expect(docs[0].title).toBe('Doc 1')
    })
  })

  describe('addFAQs', () => {
    it('should add multiple FAQs', async () => {
      const faqs = await addFAQs(testClientId, [
        { question: 'What is your name?', answer: 'NetNext', category: 'General' },
        { question: 'What services do you provide?', answer: 'Web development', category: 'Services' },
      ])

      expect(faqs).toHaveLength(2)
      expect(faqs[0].type).toBe('faq')
      expect(faqs[0].content).toContain('What is your name?')
      expect(faqs[0].content).toContain('NetNext')
    })
  })

  describe('search', () => {
    beforeEach(async () => {
      await addFAQs(testClientId, [
        { question: 'What is your pricing?', answer: 'Starting from 2500 Br for a landing page.', category: 'Pricing' },
        { question: 'How long does development take?', answer: 'A landing page takes 1-2 weeks.', category: 'Timeline' },
        { question: 'What technologies do you use?', answer: 'React, Next.js, TypeScript, Tailwind.', category: 'Tech' },
      ])
    })

    it('should find relevant documents by keyword', async () => {
      const results = await search(testClientId, 'pricing')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].chunk.content).toContain('2500')
    })

    it('should return empty array for no matches', async () => {
      const results = await search(testClientId, 'xyznonexistent123')
      expect(results).toHaveLength(0)
    })

    it('should respect topK option', async () => {
      const results = await search(testClientId, 'landing', { topK: 1 })
      expect(results.length).toBeLessThanOrEqual(1)
    })
  })

  describe('getRAGContext', () => {
    beforeEach(async () => {
      await addFAQs(testClientId, [
        { question: 'What is your pricing?', answer: 'Starting from 2500 Br.', category: 'Pricing' },
      ])
    })

    it('should return formatted context for LLM', async () => {
      const context = await getRAGContext(testClientId, 'pricing')
      
      expect(context.query).toBe('pricing')
      expect(context.results.length).toBeGreaterThan(0)
      expect(context.formattedContext).toContain('2500')
    })

    it('should return empty context for no matches', async () => {
      const context = await getRAGContext(testClientId, 'xyznonexistent123')
      
      expect(context.results).toHaveLength(0)
      expect(context.formattedContext).toBe('')
    })
  })

  describe('clearKnowledge', () => {
    it('should remove all documents for a client', async () => {
      await addDocument(testClientId, {
        type: 'document',
        title: 'Test',
        content: 'Content',
      })

      await clearKnowledge(testClientId)
      
      const docs = await getDocuments(testClientId)
      expect(docs).toHaveLength(0)
    })
  })
})
