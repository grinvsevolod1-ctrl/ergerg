"use client"

import { useEffect, useState, useCallback } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Key, Plus, Trash2, Shield, Server, RefreshCw, Loader2, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ApiKey {
  id: string
  name: string
  key: string
  keyPreview: string
  createdAt: string
  lastUsedAt?: string
  permissions: string[]
}

export default function ApiKeysPage() {
  const { session } = useNexikAuth()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/nexik/dashboard/api-keys')
      const data = await res.json()
      
      if (data.success) {
        setApiKeys(data.keys)
      }
    } catch (err) {
      console.error('Failed to load API keys:', err)
      setError('Не удалось загрузить ключи')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApiKeys()
  }, [loadApiKeys])

  const generateApiKey = async () => {
    if (!newKeyName.trim()) return
    
    setCreating(true)
    setError(null)
    
    try {
      const res = await fetch('/api/nexik/dashboard/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      })
      
      const data = await res.json()
      
      if (data.success) {
        setShowNewKey(data.key)
        setNewKeyName("")
        loadApiKeys()
      } else {
        setError(data.error || 'Не удалось создать ключ')
      }
    } catch (err) {
      console.error('Failed to create API key:', err)
      setError('Ошибка при создании ключа')
    } finally {
      setCreating(false)
    }
  }

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const deleteKey = async (id: string) => {
    if (!confirm('Удалить этот API ключ? Это действие нельзя отменить.')) return
    
    setDeleting(id)
    try {
      const res = await fetch(`/api/nexik/dashboard/api-keys?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (data.success) {
        setApiKeys(apiKeys.filter(k => k.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete API key:', err)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-2" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <Skeleton className="h-40 rounded-2xl bg-white/10 mb-8" />
        <Skeleton className="h-32 rounded-2xl bg-white/10 mb-8" />
        <Skeleton className="h-48 rounded-2xl bg-white/10" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">API ключи</h1>
        <p className="text-[#888] mt-1">
          Управление ключами для автоматической интеграции
        </p>
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

      {/* Info Card */}
      <div className="rounded-2xl border border-[#00ffff]/20 bg-[#00ffff]/5 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#00ffff]/20 flex items-center justify-center flex-shrink-0">
            <Server className="w-6 h-6 text-[#00ffff]" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Автоматическая интеграция</h3>
            <p className="text-[#888] mb-4">
              Используйте API ключ для программной интеграции Nexik в ваше приложение. 
              Ключ позволяет отправлять сообщения, получать историю чатов и управлять настройками.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00ffff]" />
                <span className="text-sm">REST API</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#00ffff]" />
                <span className="text-sm">Webhooks</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00ffff]" />
                <span className="text-sm">Безопасно</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Key */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
          <h2 className="text-lg font-semibold">Создать новый ключ</h2>
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Название ключа (например: Production Server)"
              className="flex-1 bg-[#1a1a2e]/50 border-[#2a2a3e]"
              onKeyDown={(e) => e.key === 'Enter' && generateApiKey()}
            />
            <Button 
              onClick={generateApiKey} 
              disabled={creating || !newKeyName.trim()}
              className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90 gap-2"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Создать
            </Button>
          </div>
          
          {/* Show new key */}
          {showNewKey && (
            <div className="mt-4 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-[#00ff88]" />
                <span className="font-medium text-[#00ff88]">Ключ создан!</span>
              </div>
              <p className="text-sm text-[#888] mb-3">
                Скопируйте ключ сейчас - он больше не будет показан полностью.
              </p>
              <div className="flex gap-2">
                <Input
                  value={showNewKey}
                  readOnly
                  className="flex-1 font-mono text-sm bg-[#1a1a2e]/50 border-[#2a2a3e]"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyKey(showNewKey)} 
                  className="border-[#2a2a3e] hover:bg-[#1a1a2e]"
                >
                  {copiedKey === showNewKey ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowNewKey(null)} 
                className="mt-3 text-sm text-[#888] hover:text-white"
              >
                Готово, скрыть
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Keys */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
          <h2 className="text-lg font-semibold">Активные ключи</h2>
        </div>
        <div className="divide-y divide-[#1a1a2e]">
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-[#555]">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет API ключей</p>
              <p className="text-sm mt-1">Создайте первый ключ для начала работы</p>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#00ffff]/10 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5 text-[#00ffff]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-[#888] font-mono">
                    {apiKey.keyPreview}
                  </div>
                  <div className="text-xs text-[#555] mt-1">
                    Создан: {new Date(apiKey.createdAt).toLocaleDateString('ru')}
                    {apiKey.lastUsedAt && ` • Использован: ${new Date(apiKey.lastUsedAt).toLocaleString('ru')}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex gap-1">
                    {apiKey.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded text-xs bg-[#00ffff]/10 text-[#00ffff]"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKey(apiKey.id)}
                    disabled={deleting === apiKey.id}
                    className="w-8 h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    {deleting === apiKey.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Example */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
          <h2 className="text-lg font-semibold">Использование API</h2>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <p className="text-sm text-[#888]">
            Используйте API ключ в заголовке Authorization для аутентификации запросов:
          </p>
          
          <div className="rounded-xl border border-[#1a1a2e] bg-[#0a0a0f] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a2e]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-[#888] font-mono">cURL</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono">
              <code className="text-[#888]">{`curl -X POST https://nexik.org/api/nexik/v1/chat \\
  -H "Authorization: Bearer nxk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Привет!", "visitor_id": "user123"}'`}</code>
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-[#1a1a2e]/50 border border-[#2a2a3e]">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#00ffff]" />
              Безопасность
            </h4>
            <ul className="text-sm text-[#888] space-y-1">
              <li>• Храните ключ в переменных окружения, не в коде</li>
              <li>• Не передавайте ключ на клиентскую сторону</li>
              <li>• Регулярно ротируйте ключи для безопасности</li>
              <li>• Используйте разные ключи для dev и production</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
