/**
 * Nexik Text Splitter
 * Разбивка документов на чанки для RAG
 */

export interface SplitterOptions {
  chunkSize?: number
  chunkOverlap?: number
  separators?: string[]
}

const DEFAULT_OPTIONS: Required<SplitterOptions> = {
  chunkSize: 500,
  chunkOverlap: 50,
  separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '],
}

/**
 * Рекурсивный сплиттер текста
 * Сохраняет семантическую целостность предложений и параграфов
 */
export function splitText(
  text: string,
  options: SplitterOptions = {}
): string[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const { chunkSize, chunkOverlap, separators } = opts

  // Очистка текста
  const cleanText = text.trim().replace(/\s+/g, ' ')

  if (cleanText.length <= chunkSize) {
    return [cleanText]
  }

  // Рекурсивное разбиение
  return recursiveSplit(cleanText, separators, chunkSize, chunkOverlap)
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number
): string[] {
  if (text.length <= chunkSize) {
    return [text.trim()].filter(Boolean)
  }

  // Находим подходящий разделитель
  let separator = ''
  for (const sep of separators) {
    if (text.includes(sep)) {
      separator = sep
      break
    }
  }

  // Если разделитель не найден, просто режем по размеру
  if (!separator) {
    return splitBySize(text, chunkSize, chunkOverlap)
  }

  // Разбиваем по разделителю
  const parts = text.split(separator)
  const chunks: string[] = []
  let currentChunk = ''

  for (const part of parts) {
    const potentialChunk = currentChunk
      ? currentChunk + separator + part
      : part

    if (potentialChunk.length <= chunkSize) {
      currentChunk = potentialChunk
    } else {
      // Текущий чанк готов
      if (currentChunk) {
        chunks.push(currentChunk.trim())
      }

      // Если часть больше чанка, рекурсивно разбиваем
      if (part.length > chunkSize) {
        const subChunks = recursiveSplit(
          part,
          separators.slice(1),
          chunkSize,
          chunkOverlap
        )
        chunks.push(...subChunks)
        currentChunk = ''
      } else {
        currentChunk = part
      }
    }
  }

  // Добавляем последний чанк
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // Добавляем overlap между чанками
  return addOverlap(chunks, chunkOverlap)
}

function splitBySize(
  text: string,
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end).trim())
    start = end - chunkOverlap
  }

  return chunks.filter(Boolean)
}

function addOverlap(chunks: string[], overlap: number): string[] {
  if (chunks.length <= 1 || overlap <= 0) {
    return chunks
  }

  return chunks.map((chunk, index) => {
    if (index === 0) return chunk

    // Добавляем конец предыдущего чанка
    const prevChunk = chunks[index - 1]
    const overlapText = prevChunk.slice(-overlap)

    // Не добавляем если overlap уже есть
    if (chunk.startsWith(overlapText)) {
      return chunk
    }

    return overlapText + ' ' + chunk
  })
}

/**
 * Разбить документ с сохранением метаданных секций
 */
export function splitDocument(
  content: string,
  options: SplitterOptions = {}
): { content: string; section?: string }[] {
  // Пытаемся найти заголовки секций (markdown)
  const sectionRegex = /^#{1,3}\s+(.+)$/gm
  const sections: { title: string; content: string; start: number }[] = []
  
  let match
  let lastEnd = 0

  while ((match = sectionRegex.exec(content)) !== null) {
    if (lastEnd < match.index) {
      // Контент до этой секции
      const prevContent = content.slice(lastEnd, match.index).trim()
      if (prevContent && sections.length > 0) {
        sections[sections.length - 1].content += '\n' + prevContent
      } else if (prevContent) {
        sections.push({ title: '', content: prevContent, start: lastEnd })
      }
    }

    sections.push({
      title: match[1].trim(),
      content: '',
      start: match.index + match[0].length,
    })
    lastEnd = match.index + match[0].length
  }

  // Последняя секция
  if (lastEnd < content.length) {
    const remaining = content.slice(lastEnd).trim()
    if (sections.length > 0) {
      sections[sections.length - 1].content = remaining
    } else {
      sections.push({ title: '', content: remaining, start: lastEnd })
    }
  }

  // Если секций нет, просто разбиваем весь текст
  if (sections.length === 0) {
    return splitText(content, options).map(chunk => ({ content: chunk }))
  }

  // Разбиваем каждую секцию
  const result: { content: string; section?: string }[] = []

  for (const section of sections) {
    if (!section.content.trim()) continue

    const chunks = splitText(section.content, options)
    for (const chunk of chunks) {
      result.push({
        content: chunk,
        section: section.title || undefined,
      })
    }
  }

  return result
}
