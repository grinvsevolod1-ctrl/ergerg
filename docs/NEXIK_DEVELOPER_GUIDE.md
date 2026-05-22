# Nexik — Инструкция для разработчика

## Что такое Nexik

Nexik — AI бизнес-директор, который интегрируется на любой сайт одной строкой кода. Это часть студии NetNext: клиенты получают Nexik бесплатно при заказе сайта, или могут подключить к своему существующему ресурсу по подписке.

**Ключевые принципы:**
- Простота — запуск за 2 минуты без программистов
- Универсальность — работает с любым бизнесом (от кондиционеров до юридических услуг)
- Self-hosted AI — 100% на своих серверах, без внешних API (Ollama)
- Гибридный режим — AI отвечает когда владелец недоступен, владелец может подключиться в любой момент

---

## Текущий статус (ВСЁ СДЕЛАНО)

### Полностью готово:
- [x] Landing page с демо (`/nexik`)
- [x] Онбординг через чат-интерфейс (`/nexik/start`)
- [x] Dashboard UI — все страницы в cyber-стиле
- [x] Widget.js — полный функционал, авто-инициализация
- [x] API v1 — chat, messages, widget endpoints
- [x] DB схема — полная SQL миграция с pgvector
- [x] AI роутер — Ollama клиент с fallback
- [x] RAG система — TF-IDF + векторный поиск (pgvector)
- [x] Авторизация — login/register + JWT + middleware
- [x] Schedule — проверка расписания в chat service
- [x] Пароли — bcrypt хеширование
- [x] Real-time обновления — SSE events в dashboard
- [x] Telegram уведомления — при новых сообщениях/диалогах
- [x] Векторный поиск — pgvector с HNSW индексом

### Требует настройки инфраструктуры:
- [ ] PostgreSQL + pgvector — добавить `DATABASE_URL` в env
- [ ] Ollama сервер — добавить `OLLAMA_BASE_URL` в env
- [ ] Telegram бот (опционально) — добавить токен в настройках организации

---

## Быстрый старт

### 1. Переменные окружения

```env
# База данных (обязательно)
DATABASE_URL=postgresql://user:password@host:5432/netnext

# Ollama (обязательно для AI)
OLLAMA_BASE_URL=http://your-vps-ip:11434
OLLAMA_MODEL=qwen2.5:7b

# JWT секрет (обязательно)
NEXIK_JWT_SECRET=your-secret-key-32-chars-minimum

# Base URL для ссылок в Telegram (опционально)
NEXT_PUBLIC_BASE_URL=https://netnext.site
```

### 2. Миграция базы данных

```bash
# Установить pgvector на сервере PostgreSQL
# Для Supabase/Neon pgvector уже включён

# Применить миграцию
psql $DATABASE_URL -f scripts/nexik-schema.sql
```

### 3. Ollama с embeddings

```bash
# На VPS с Ollama
ollama pull qwen2.5:7b
ollama pull nomic-embed-text  # Для векторного поиска
```

### 4. Проверка

```bash
# Ollama
curl http://your-vps-ip:11434/api/tags

# API
curl http://localhost:3000/api/nexik/onboarding \
  -X POST -H "Content-Type: application/json" \
  -d '{"action":"analyze_business","data":{"description":"Продаю цветы"}}'
```

---

## Структура проекта

```
/app/nexik/
├── page.tsx                    # Landing page
├── login/page.tsx              # Страница входа
├── start/page.tsx              # Онбординг
├── demo/page.tsx               # Демо виджета
└── dashboard/                  # Защищённый раздел
    ├── layout.tsx
    ├── page.tsx                # Статистика + real-time
    ├── chats/page.tsx          # Диалоги
    ├── knowledge/page.tsx      # База знаний
    ├── schedule/page.tsx       # Расписание
    ├── widget/page.tsx         # Настройки виджета
    ├── analytics/page.tsx      # Аналитика
    └── settings/page.tsx       # Настройки

/app/api/nexik/
├── auth/
│   ├── login/route.ts          # POST — вход
│   └── logout/route.ts         # POST — выход
├── events/route.ts             # GET — SSE real-time события
├── onboarding/route.ts         # POST — создание виджета
├── dashboard/stats/route.ts    # GET — статистика
└── v1/
    ├── chat/route.ts           # POST — сообщение
    ├── messages/route.ts       # GET — история
    └── widget/route.ts         # GET — конфигурация

/lib/nexik/
├── db/
│   ├── schema.ts               # SQL схема
│   ├── organizations.ts
│   ├── widgets.ts
│   ├── conversations.ts
│   ├── knowledge.ts            # TF-IDF + vector fallback
│   └── vector-search.ts        # pgvector семантический поиск
├── hooks/
│   └── useNexikEvents.ts       # React hook для SSE
└── services/
    ├── auth.ts                 # JWT, bcrypt
    ├── chat.ts                 # AI + schedule + notifications
    └── telegram.ts             # Telegram уведомления

/lib/ai/
├── config.ts                   # Ollama конфиг
├── providers.ts                # OllamaClient
├── router.ts                   # generateResponse
└── knowledge/                  # RAG

/public/nexik/
└── widget.js                   # Embed скрипт

/scripts/
└── nexik-schema.sql            # SQL миграция с pgvector

/middleware.ts                  # Защита /nexik/dashboard/*
```

---

## Ключевые файлы для изучения

| Приоритет | Файл | Описание |
|-----------|------|----------|
| 1 | `/scripts/nexik-schema.sql` | SQL схема — все таблицы + pgvector |
| 2 | `/lib/nexik/services/chat.ts` | Логика сообщений + schedule + уведомления |
| 3 | `/lib/nexik/db/vector-search.ts` | Семантический поиск (pgvector) |
| 4 | `/lib/nexik/services/telegram.ts` | Telegram уведомления |
| 5 | `/app/api/nexik/events/route.ts` | SSE real-time события |
| 6 | `/lib/nexik/hooks/useNexikEvents.ts` | React hook для SSE |
| 7 | `/lib/ai/providers.ts` | Ollama HTTP клиент |
| 8 | `/app/api/nexik/v1/chat/route.ts` | Главный API для виджета |
| 9 | `/public/nexik/widget.js` | Embed скрипт |
| 10 | `/middleware.ts` | Авторизация dashboard |

---

## Real-time обновления (SSE)

### Как работает:
1. Dashboard подключается к `/api/nexik/events?org_id=xxx`
2. При новом сообщении/диалоге — `pushEvent()` отправляет в SSE
3. Dashboard получает событие через `useNexikEvents()` hook
4. UI обновляется без перезагрузки

### События:
- `new_message` — новое сообщение в диалоге
- `new_conversation` — новый диалог
- `stats_update` — обновление статистики

### Использование в компоненте:
```tsx
import { useNexikEvents } from '@/lib/nexik/hooks/useNexikEvents'

const { isConnected } = useNexikEvents({
  orgId: 'xxx',
  onMessage: (data) => console.log('New message:', data),
  onNewConversation: (data) => console.log('New chat:', data)
})
```

---

## Telegram уведомления

### Настройка:
1. Создать бота через @BotFather
2. Получить chat_id (например через @userinfobot)
3. Добавить в настройки организации:

```sql
UPDATE nexik_organizations 
SET settings = jsonb_set(
  COALESCE(settings, '{}'),
  '{telegram_bot_token}',
  '"123456:ABC..."'
)
WHERE id = 'org_id';

UPDATE nexik_organizations 
SET settings = jsonb_set(
  settings,
  '{telegram_chat_id}',
  '"123456789"'
)
WHERE id = 'org_id';
```

### Уведомления:
- `notifyNewMessage()` — новое сообщение
- `notifyNewConversation()` — новый диалог
- `notifyOperatorRequest()` — запрос оператора
- `sendDailySummary()` — ежедневная сводка

---

## Векторный поиск (pgvector)

### Архитектура:
1. Документы разбиваются на чанки
2. Каждый чанк индексируется через `nomic-embed-text` (Ollama)
3. Embeddings хранятся в PostgreSQL с pgvector
4. При поиске — cosine similarity через HNSW индекс

### Функции:
- `getEmbedding(text)` — получить вектор из Ollama
- `indexDocument(docId)` — проиндексировать документ
- `semanticSearch(orgId, query)` — семантический поиск
- `reindexOrganization(orgId)` — переиндексировать всё

### Fallback:
Если pgvector недоступен или embedding не получен — автоматически fallback на TF-IDF поиск.

---

## Авторизация

### Как работает:
1. Пользователь проходит онбординг → создаётся org + member + widget
2. Генерируется пароль, показывается один раз
3. JWT токен сохраняется в httpOnly cookie `nexik_token`
4. `middleware.ts` проверяет токен для `/nexik/dashboard/*`

### Демо-режим:
```
Email: test@test.com
Password: test123
```

### Endpoints:
- `POST /api/nexik/auth/login` — вход
- `POST /api/nexik/auth/logout` — выход

---

## Расписание (Schedule)

### Режимы:
- `ai_only` — AI отвечает всегда
- `operator_only` — Только оператор
- `hybrid` — AI вне рабочих часов, оператор в рабочие

### Как работает:
В `/lib/nexik/services/chat.ts`:
1. Получаем schedule для org/widget
2. Проверяем `isWithinSchedule()`
3. Если оператор должен отвечать — отправляем "Оператор скоро ответит" + Telegram
4. Если AI — генерируем ответ

---

## Виджет

### Простая интеграция:
```html
<script src="https://netnext.site/nexik/widget.js" data-id="nxk_xxx" async></script>
```

### Программная:
```javascript
window.NexikQueue = window.NexikQueue || [];
NexikQueue.push(['init', {
  widgetId: 'nxk_xxx',
  apiKey: 'nxk_live_xxx'
}]);
```

### JS API:
```javascript
Nexik.open()
Nexik.close()
Nexik.toggle()
Nexik.send('Привет')
```

---

## Тестирование

### Анализ бизнеса:
```bash
curl -X POST http://localhost:3000/api/nexik/onboarding \
  -H "Content-Type: application/json" \
  -d '{"action":"analyze_business","data":{"description":"Автосервис в Минске"}}'
```

### Вход:
```bash
curl -X POST http://localhost:3000/api/nexik/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

### Отправка сообщения:
```bash
curl -X POST http://localhost:3000/api/nexik/v1/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: nxk_live_xxx" \
  -d '{"widget_id":"nxk_xxx","session_id":"v123","message":"Привет"}'
```

### SSE события:
```bash
curl -N "http://localhost:3000/api/nexik/events?org_id=xxx" \
  -H "Cookie: nexik_token=xxx"
```

---

## Контакты

Проект: NetNext Studio  
Сайт: https://netnext.site
