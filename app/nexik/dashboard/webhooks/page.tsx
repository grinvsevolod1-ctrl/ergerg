"use client"

import { useState, useEffect, useCallback } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { 
  Webhook, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface WebhookItem {
  id: string
  url: string
  events: string[]
  isActive: boolean
  lastTriggeredAt: string | null
  lastStatus: number | null
  createdAt: string
}

const eventLabels: Record<string, string> = {
  "message.new": "Новое сообщение",
  "conversation.started": "Начало диалога",
  "conversation.resolved": "Диалог завершен",
  "operator.requested": "Запрос оператора",
}

export default function WebhooksPage() {
  const { session } = useNexikAuth()
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  
  // Form state
  const [newUrl, setNewUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["message.new"])

  const loadWebhooks = useCallback(async () => {
    try {
      const res = await fetch('/api/nexik/dashboard/webhooks')
      const data = await res.json()
      
      if (data.success) {
        setWebhooks(data.webhooks)
      }
    } catch {
      setError('Не удалось загрузить webhooks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWebhooks()
  }, [loadWebhooks])

  const createWebhook = async () => {
    if (!newUrl.trim()) return
    
    setCreating(true)
    setError(null)
    
    try {
      const res = await fetch('/api/nexik/dashboard/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: newUrl.trim(),
          events: selectedEvents 
        })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setWebhooks(prev => [data.webhook, ...prev])
        setNewUrl("")
        setSelectedEvents(["message.new"])
        setShowForm(false)
      } else {
        setError(data.error || 'Не удалось создать webhook')
      }
    } catch {
      setError('Ошибка создания webhook')
    } finally {
      setCreating(false)
    }
  }

  const toggleWebhook = async (id: string, isActive: boolean) => {
    try {
      await fetch('/api/nexik/dashboard/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive })
      })
      
      setWebhooks(prev => prev.map(w => 
        w.id === id ? { ...w, isActive } : w
      ))
    } catch {
      // Silent fail
    }
  }

  const deleteWebhook = async (id: string) => {
    if (!confirm('Удалить этот webhook?')) return
    
    try {
      await fetch(`/api/nexik/dashboard/webhooks?id=${id}`, {
        method: 'DELETE'
      })
      
      setWebhooks(prev => prev.filter(w => w.id !== id))
    } catch {
      // Silent fail
    }
  }

  const copySecret = async (id: string) => {
    // In real implementation, fetch secret from API
    await navigator.clipboard.writeText(`webhook_secret_${id}`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      if (selectedEvents.length > 1) {
        setSelectedEvents(prev => prev.filter(e => e !== event))
      }
    } else {
      setSelectedEvents(prev => [...prev, event])
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <Skeleton className="h-48 rounded-2xl bg-white/10 mb-4" />
        <Skeleton className="h-32 rounded-2xl bg-white/10" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Webhooks</h1>
          <p className="text-[#888] mt-1">
            Получайте уведомления о событиях в реальном времени
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить webhook
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
            &times;
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="rounded-2xl border border-[#00ffff]/30 bg-[#00ffff]/5 p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#00ffff]" />
            Новый webhook
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-[#888]">URL</Label>
              <Input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://your-server.com/webhook"
                className="mt-1 bg-[#0a0a0f] border-[#1a1a2e]"
              />
            </div>
            
            <div>
              <Label className="text-sm text-[#888] mb-2 block">События</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(eventLabels).map(([event, label]) => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm transition-colors",
                      selectedEvents.includes(event)
                        ? "bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30"
                        : "bg-[#1a1a2e] text-[#888] border border-transparent hover:border-[#2a2a3e]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={createWebhook}
                disabled={!newUrl.trim() || creating}
                className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
              >
                {creating ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Создать
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowForm(false)}
                className="border-[#1a1a2e]"
              >
                Отмена
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00ffff]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-[#00ffff]" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Безопасность</h3>
            <p className="text-sm text-[#888]">
              Все webhook запросы подписываются HMAC-SHA256. Проверяйте заголовок{" "}
              <code className="px-1.5 py-0.5 rounded bg-[#1a1a2e] text-[#00ffff]">X-Nexik-Signature</code>{" "}
              для верификации.
            </p>
          </div>
        </div>
      </div>

      {/* Webhooks List */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 overflow-hidden">
        {webhooks.length > 0 ? (
          <div className="divide-y divide-[#1a1a2e]">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Webhook className="w-4 h-4 text-[#00ffff]" />
                      <code className="text-sm truncate">{webhook.url}</code>
                      <a 
                        href={webhook.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#888] hover:text-white"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {webhook.events.map(event => (
                        <span 
                          key={event}
                          className="px-2 py-0.5 text-xs bg-[#1a1a2e] text-[#888] rounded"
                        >
                          {eventLabels[event] || event}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-[#666]">
                      {webhook.lastTriggeredAt && (
                        <span>
                          Последний вызов: {new Date(webhook.lastTriggeredAt).toLocaleString('ru-RU')}
                        </span>
                      )}
                      {webhook.lastStatus && (
                        <span className={webhook.lastStatus === 200 ? "text-green-400" : "text-red-400"}>
                          Статус: {webhook.lastStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={webhook.isActive}
                      onCheckedChange={(checked) => toggleWebhook(webhook.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copySecret(webhook.id)}
                      className="text-[#888] hover:text-white"
                    >
                      {copiedId === webhook.id ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-[#888] hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Webhook className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-[#888] mb-2">Нет webhooks</p>
            <p className="text-sm text-[#666]">
              Создайте webhook чтобы получать уведомления о событиях
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
