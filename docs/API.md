# NetNext API Documentation

## Overview

NetNext provides REST APIs for the main website functionality and the Nexik AI chat platform.

**Base URL:** `https://netnext.site/api`

**Rate Limiting:**
- Standard endpoints: 30 requests/minute
- Auth endpoints: 10 requests/minute  
- Chat endpoints: 20 requests/minute
- Public endpoints: 100 requests/minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Unix timestamp when the window resets
- `Retry-After` - Seconds to wait (only when rate limited)

---

## NetNext Website APIs

### Health Check

```
GET /api/health
```

Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### Leads

#### Create Lead

```
POST /api/leads
```

Submit a new lead from the site generator.

**Request Body:**
```json
{
  "companyName": "string (required)",
  "phone": "string (required)",
  "email": "string (required)",
  "description": "string (optional)",
  "niche": "string (optional)",
  "selectedVariantUrl": "string (optional)",
  "variantsViewed": "number (optional)",
  "timeSpentSeconds": "number (optional)",
  "sessionId": "string (optional)",
  "utmSource": "string (optional)",
  "utmMedium": "string (optional)",
  "utmCampaign": "string (optional)",
  "consentGiven": "boolean (required)"
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "uuid"
}
```

**Errors:**
- `400` - Missing required fields or invalid format
- `429` - Rate limit exceeded
- `500` - Server error

---

### Contact Form

```
POST /api/leads/contact
```

Submit contact form data.

**Request Body:**
```json
{
  "name": "string (required)",
  "email": "string (required)",
  "phone": "string (optional)",
  "message": "string (required)",
  "consentGiven": "boolean (required)"
}
```

---

### AI Chat (Website)

```
POST /api/chat/ai
```

Send a message to the website AI assistant.

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "message": "string (required)",
  "context": {
    "companyName": "string (optional)",
    "companyDescription": "string (optional)"
  },
  "stream": "boolean (optional, default: false)"
}
```

**Response (non-streaming):**
```json
{
  "text": "AI response text",
  "source": "demo | ai",
  "buttons": []
}
```

**Response (streaming):**
Server-sent events stream with text chunks.

---

### AI Status

```
GET /api/ai/status
```

Check AI service availability.

**Response:**
```json
{
  "healthy": true,
  "model": "qwen2.5:7b",
  "modelAvailable": true,
  "availableModels": ["qwen2.5:7b", "llama3.1:8b"]
}
```

---

### Analytics

```
POST /api/analytics
```

Track analytics events.

**Request Body:**
```json
{
  "sessionId": "string (required)",
  "eventType": "string (required)",
  "eventData": "object (optional)",
  "leadId": "uuid (optional)"
}
```

---

## Nexik APIs

Nexik is a multi-tenant AI chat platform. APIs require authentication.

### Authentication

#### Login

```
POST /api/nexik/auth/login
```

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "name": "string",
    "role": "owner | admin | member"
  },
  "org": {
    "id": "uuid",
    "name": "string"
  }
}
```

Sets HTTP-only cookies:
- `nexik_token` - JWT authentication token
- `nexik_org_id` - Organization ID

---

#### Register

```
POST /api/nexik/auth/register
```

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required, min 6 chars)"
}
```

**Response:** Same as login.

---

#### Logout

```
POST /api/nexik/auth/logout
```

Clears authentication cookies.

---

### Nexik Chat (Widget)

#### Send Message

```
POST /api/nexik/chat
```

Public endpoint for widget chat messages.

**Request Body:**
```json
{
  "clientId": "string (required)",
  "sessionId": "string (required)",
  "message": "string (required)",
  "context": {
    "companyName": "string (optional)",
    "assistantName": "string (optional)",
    "isConnectedToOperator": "boolean (optional)"
  },
  "previousMessages": [
    { "role": "user | assistant", "content": "string" }
  ]
}
```

**Response:**
```json
{
  "text": "Response text",
  "source": "template | ai",
  "category": "greeting | thanks | operator | etc (for templates)",
  "clientId": "string",
  "buttons": []
}
```

**Response sources:**
- `template` - Fast response from predefined templates (common questions)
- `ai` - Generated response from AI model (complex questions)

---

### Nexik V1 API (Production)

Requires API key authentication.

#### Chat Message

```
POST /api/nexik/v1/chat
```

**Headers:**
```
X-API-Key: your_api_key
X-Widget-ID: widget_uuid (optional)
```

**Request Body:**
```json
{
  "visitor_id": "string (required)",
  "message": "string (required)",
  "visitor_info": {
    "name": "string (optional)",
    "email": "string (optional)"
  },
  "page_url": "string (optional)",
  "page_title": "string (optional)"
}
```

**Response:**
```json
{
  "conversation_id": "uuid",
  "message": {
    "id": "uuid",
    "content": "string",
    "sender": "visitor",
    "timestamp": "ISO8601"
  },
  "ai_response": {
    "id": "uuid",
    "content": "string",
    "sender": "ai | operator",
    "timestamp": "ISO8601",
    "quick_replies": []
  },
  "quota": {
    "remaining": 950,
    "limited": false
  },
  "latency_ms": 245
}
```

**Errors:**
- `401` - Missing or invalid API key
- `403` - Domain not allowed for widget
- `404` - Widget not found
- `429` - Quota exceeded

---

### Dashboard Stats

```
GET /api/nexik/dashboard/stats
```

Requires authentication. Returns organization statistics.

**Response:**
```json
{
  "conversations": {
    "total": 1250,
    "today": 45,
    "active": 12
  },
  "messages": {
    "total": 8500,
    "ai": 6200,
    "operator": 2300
  },
  "quota": {
    "used": 500,
    "limit": 1000,
    "percentage": 50
  }
}
```

---

## Admin APIs

Admin APIs require admin authentication via `admin_session` cookie.

### Admin Login

```
POST /api/admin/auth/login
```

**Request Body:**
```json
{
  "token": "ADMIN_API_TOKEN"
}
```

---

### Leads Management

```
GET /api/admin/leads
GET /api/admin/leads/:id
PATCH /api/admin/leads/:id
DELETE /api/admin/leads/:id
```

---

### Chats Management

```
GET /api/admin/chats
GET /api/admin/chats/:id
PATCH /api/admin/chats/:id
```

---

### Mailings

```
GET /api/admin/mailings
POST /api/admin/mailings
```

---

### Analytics

```
GET /api/admin/analytics
```

---

## Webhooks

### Telegram Webhook

```
POST /api/telegram/webhook
```

Receives updates from Telegram bot.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE (optional)"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## CORS

Widget APIs (`/api/nexik/*`) support CORS:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, X-API-Key, X-Widget-ID`

Other APIs are same-origin only.
