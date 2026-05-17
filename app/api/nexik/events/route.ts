/**
 * Nexik Real-time Events (Server-Sent Events)
 * Для live-обновлений в dashboard
 */

import { NextRequest } from 'next/server'

// Event types
type EventType = 'new_message' | 'new_conversation' | 'operator_joined' | 'stats_update'

interface NexikEvent {
  type: EventType
  data: Record<string, unknown>
  timestamp: number
}

// In-memory event store (в production использовать Redis pub/sub)
const eventQueues = new Map<string, NexikEvent[]>()
const listeners = new Map<string, Set<ReadableStreamDefaultController>>()

/**
 * Добавить событие в очередь
 */
export function pushEvent(orgId: string, event: Omit<NexikEvent, 'timestamp'>) {
  const fullEvent: NexikEvent = {
    ...event,
    timestamp: Date.now()
  }

  // Добавляем в очередь
  const queue = eventQueues.get(orgId) || []
  queue.push(fullEvent)
  
  // Храним только последние 100 событий
  if (queue.length > 100) {
    queue.shift()
  }
  eventQueues.set(orgId, queue)

  // Отправляем всем слушателям
  const orgListeners = listeners.get(orgId)
  if (orgListeners) {
    const message = `data: ${JSON.stringify(fullEvent)}\n\n`
    const encoder = new TextEncoder()
    
    orgListeners.forEach(controller => {
      try {
        controller.enqueue(encoder.encode(message))
      } catch {
        // Listener disconnected
        orgListeners.delete(controller)
      }
    })
  }
}

/**
 * SSE endpoint для получения событий
 */
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('org_id')
  
  if (!orgId) {
    return new Response('Missing org_id', { status: 400 })
  }

  // Проверяем авторизацию
  const token = req.cookies.get('nexik_token')?.value
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stream = new ReadableStream({
    start(controller) {
      // Регистрируем слушателя
      if (!listeners.has(orgId)) {
        listeners.set(orgId, new Set())
      }
      listeners.get(orgId)!.add(controller)

      // Отправляем initial событие
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`))

      // Heartbeat каждые 30 секунд
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          clearInterval(heartbeat)
        }
      }, 30000)

      // Cleanup при отключении
      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        listeners.get(orgId)?.delete(controller)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },

    cancel() {
      listeners.get(orgId)?.delete(this as unknown as ReadableStreamDefaultController)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
