/**
 * Nexik Knowledge Store
 * Хранилище базы знаний (in-memory + DB)
 */

import type { KnowledgeDocument, KnowledgeChunk, SearchResult, RAGContext } from './types'
import { splitDocument } from './splitter'
import { searchKnowledge, formatSearchResults } from './search'

// In-memory cache для быстрого поиска
// В production заменить на Redis или DB с pgvector
const documentsCache = new Map<string, Map<string, KnowledgeDocument>>()
const chunksCache = new Map<string, KnowledgeChunk[]>()

/**
 * Добавить документ в базу знаний
 */
export async function addDocument(
  clientId: string,
  document: Omit<KnowledgeDocument, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>
): Promise<KnowledgeDocument> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`
  const now = new Date()

  const doc: KnowledgeDocument = {
    id,
    clientId,
    ...document,
    createdAt: now,
    updatedAt: now,
  }

  // Инициализируем кеш для клиента
  if (!documentsCache.has(clientId)) {
    documentsCache.set(clientId, new Map())
    chunksCache.set(clientId, [])
  }

  // Сохраняем документ
  documentsCache.get(clientId)!.set(id, doc)

  // Разбиваем на чанки
  const splitResult = splitDocument(doc.content, {
    chunkSize: 500,
    chunkOverlap: 50,
  })

  const chunks: KnowledgeChunk[] = splitResult.map((chunk, index) => ({
    id: `chunk_${id}_${index}`,
    documentId: id,
    clientId,
    content: chunk.content,
    position: index,
    metadata: {
      title: doc.title,
      section: chunk.section,
    },
  }))

  // Добавляем чанки
  const clientChunks = chunksCache.get(clientId) || []
  clientChunks.push(...chunks)
  chunksCache.set(clientId, clientChunks)

  return doc
}

/**
 * Добавить несколько FAQ записей
 */
export async function addFAQs(
  clientId: string,
  faqs: { question: string; answer: string; category?: string }[]
): Promise<KnowledgeDocument[]> {
  const docs: KnowledgeDocument[] = []

  for (const faq of faqs) {
    const content = `Вопрос: ${faq.question}\n\nОтвет: ${faq.answer}`
    const doc = await addDocument(clientId, {
      type: 'faq',
      title: faq.question,
      content,
      metadata: {
        category: faq.category,
      },
    })
    docs.push(doc)
  }

  return docs
}

/**
 * Удалить документ
 */
export async function removeDocument(
  clientId: string,
  documentId: string
): Promise<boolean> {
  const clientDocs = documentsCache.get(clientId)
  if (!clientDocs?.has(documentId)) {
    return false
  }

  // Удаляем документ
  clientDocs.delete(documentId)

  // Удаляем связанные чанки
  const clientChunks = chunksCache.get(clientId) || []
  const filteredChunks = clientChunks.filter(c => c.documentId !== documentId)
  chunksCache.set(clientId, filteredChunks)

  return true
}

/**
 * Получить все документы клиента
 */
export async function getDocuments(clientId: string): Promise<KnowledgeDocument[]> {
  const clientDocs = documentsCache.get(clientId)
  if (!clientDocs) {
    return []
  }
  return Array.from(clientDocs.values())
}

/**
 * Поиск по базе знаний клиента
 */
export async function search(
  clientId: string,
  query: string,
  options: { topK?: number } = {}
): Promise<SearchResult[]> {
  const clientDocs = documentsCache.get(clientId)
  const clientChunks = chunksCache.get(clientId)

  if (!clientDocs || !clientChunks || clientChunks.length === 0) {
    return []
  }

  return searchKnowledge(query, clientChunks, clientDocs, options)
}

/**
 * Получить RAG контекст для LLM
 */
export async function getRAGContext(
  clientId: string,
  query: string,
  options: { topK?: number } = {}
): Promise<RAGContext> {
  const results = await search(clientId, query, options)
  const formattedContext = formatSearchResults(results)

  return {
    query,
    results,
    formattedContext,
  }
}

/**
 * Очистить базу знаний клиента
 */
export async function clearKnowledge(clientId: string): Promise<void> {
  documentsCache.delete(clientId)
  chunksCache.delete(clientId)
}

/**
 * Инициализировать базу знаний для NetNext (демо)
 */
export async function initializeDefaultKnowledge(): Promise<void> {
  const clientId = 'netnext'

  // Проверяем, инициализирована ли уже
  if (documentsCache.has(clientId)) {
    return
  }

  // Добавляем базовые FAQ
  await addFAQs(clientId, [
    {
      question: 'Какая сейчас акция?',
      answer: 'Акция месяца: продающий лендинг под ключ за 600 BYN вместо 1200 BYN — выгода 50%. В стоимость входит дизайн и адаптив под все устройства, тексты, формы заявок, подключение аналитики и запуск за 5 дней. Без скрытых доплат.',
      category: 'Акции',
    },
    {
      question: 'Какие услуги вы предоставляете?',
      answer: 'Мы предоставляем полный спектр услуг по веб-разработке: создание сайтов (лендинги, корпоративные сайты, интернет-магазины), мобильные приложения (iOS и Android), UI/UX дизайн, backend-разработка и DevOps.',
      category: 'Услуги',
    },
    {
      question: 'Сколько стоит разработка сайта?',
      answer: 'Стоимость зависит от сложности: Лендинг — от 1200 BYN (сейчас по акции 600 BYN), Корпоративный сайт — от 2500 BYN, Интернет-магазин — от 5000 BYN, Веб- или мобильное приложение — от 8000 BYN. Для точной оценки расскажите о вашем проекте.',
      category: 'Цены',
    },
    {
      question: 'Какие сроки разработки?',
      answer: 'Ориентировочные сроки: Лендинг — 1-2 недели, Корпоративный сайт — 3-5 недель, Интернет-магазин — 6-10 недель, Мобильное приложение — от 2 месяцев. Точные сроки фиксируем в договоре после оценки проекта.',
      category: 'Сроки',
    },
    {
      question: 'Какие технологии вы используете?',
      answer: 'Наш стек: Frontend — React, Next.js, Vue, TypeScript, Tailwind CSS. Backend — Node.js, Python, PostgreSQL, Redis. Mobile — React Native, Flutter. Cloud — AWS, Vercel, Docker. Выбираем технологии под конкретную задачу.',
      category: 'Технологии',
    },
    {
      question: 'Есть ли гарантия на работу?',
      answer: 'Да, мы предоставляем: фиксированную стоимость и сроки в договоре, исходный код в вашу собственность, 3 месяца бесплатной поддержки после запуска, бесплатное исправление багов, NDA по запросу.',
      category: 'Гарантии',
    },
    {
      question: 'Как с вами связаться?',
      answer: 'Телефон: +375 (29) 14-14-555, Email: hello@netnext.site, Telegram: @netnext_team. Также можете оставить заявку на сайте — ответим в течение 15 минут в рабочее время.',
      category: 'Контакты',
    },
    {
      question: 'Где вы находитесь?',
      answer: 'Мы находимся в Минске, Беларусь. Работаем с клиентами из СНГ и Европы удалённо. Возможны встречи в офисе по предварительной договорённости.',
      category: 'Контакты',
    },
    {
      question: 'Как происходит оплата?',
      answer: 'Работаем по договору. Стандартная схема: 50% предоплата, 50% после сдачи проекта. Для крупных проектов возможна поэтапная оплата. Принимаем оплату от юридических и физических лиц.',
      category: 'Оплата',
    },
    {
      question: 'Что такое Nexik?',
      answer: 'Nexik — это наш AI-ассистент для бизнеса. Он отвечает на вопросы клиентов 24/7, записывает на консультации и знает всё о вашей компании. Подключается к любому сайту за 5 минут. Тарифы: Старт — 200 BYN/мес, Бизнес — 500 BYN/мес, Корпорация — индивидуально.',
      category: 'Продукты',
    },
    {
      question: 'Делаете ли вы SEO-оптимизацию?',
      answer: 'Да, все наши сайты изначально оптимизированы для поисковых систем: техническая SEO-оптимизация, мета-теги, скорость загрузки, адаптивность. Комплексное SEO-продвижение — отдельная услуга.',
      category: 'Услуги',
    },
    {
      question: 'Можно ли доработать существующий сайт?',
      answer: 'Да, мы занимаемся доработкой и редизайном существующих сайтов. Можем добавить новые функции, улучшить дизайн, оптимизировать скорость или перенести на современный стек.',
      category: 'Услуги',
    },
  ])

  // Добавляем документ о компании
  await addDocument(clientId, {
    type: 'document',
    title: 'О компании NetNext',
    content: `# О компании NetNext

NetNext — это веб-студия разработки в Минске, Беларусь. Мы создаём цифровые продукты под ключ с 2019 года.

## Наша команда

В команде 12 специалистов:
- 4 fullstack-разработчика
- 2 мобильных разработчика
- 2 UI/UX дизайнера
- 1 DevOps-инженер
- 1 QA-инженер
- 1 проект-менеджер
- 1 бизнес-аналитик

## Как мы работаем

1. Брифинг — выясняем цели и требования
2. Оценка — готовим план и стоимость
3. Дизайн — прототипы, UI/UX, утверждение
4. Разработка — поэтапно, с еженедельными демо
5. Тестирование — QA, нагрузочное, кроссбраузерное
6. Запуск — деплой, мониторинг, обучение
7. Поддержка — техподдержка и развитие

## Наши преимущества

- Работаем по договору с фиксированной стоимостью
- Исходный код — собственность заказчика
- 3 месяца бесплатной поддержки
- Современный стек технологий
- Прозрачный процесс с еженедельными отчётами`,
  })
}
