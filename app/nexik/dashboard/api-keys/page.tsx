"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Key, Plus, Trash2, Shield, Server, Code, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiKey {
  id: string
  name: string
  key: string
  created: Date
  lastUsed?: Date
  permissions: string[]
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production Server",
      key: "nxk_live_a1b2c3d4e5f6g7h8i9j0",
      created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      permissions: ["read", "write", "install"]
    }
  ])
  const [newKeyName, setNewKeyName] = useState("")
  const [showNewKey, setShowNewKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const generateApiKey = () => {
    if (!newKeyName.trim()) return
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `nxk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      created: new Date(),
      permissions: ["read", "write", "install"]
    }
    
    setApiKeys([...apiKeys, newKey])
    setShowNewKey(newKey.key)
    setNewKeyName("")
  }

  const copyKey = async (key: string) => {
    await navigator.clipboard.writeText(key)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const deleteKey = (id: string) => {
    setApiKeys(apiKeys.filter(k => k.id !== id))
  }

  const maskKey = (key: string) => {
    return key.slice(0, 12) + "..." + key.slice(-4)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-0.5 bg-primary" />
            <span className="text-primary font-mono text-sm">{"// API Ключи"}</span>
          </div>
          <h1 className="text-3xl font-bold">API ключи</h1>
          <p className="text-muted-foreground mt-1">
            Управление ключами для автоматической интеграции
          </p>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">Автоматическая интеграция</h3>
            <p className="text-muted-foreground mb-4">
              Дайте нам доступ к вашему серверу, и мы автоматически интегрируем Nexik.
              Просто добавьте API ключ в конфигурацию NPM пакета.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-sm">Автоустановка</span>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                <span className="text-sm">Автосинхронизация</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm">Безопасно</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create New Key */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Создать новый ключ</h2>
        </div>
        <div className="p-6">
          <div className="flex gap-3">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Название ключа (например: Production Server)"
              className="flex-1 bg-secondary/30 border-border"
            />
            <Button onClick={generateApiKey} className="gap-2">
              <Plus className="w-4 h-4" />
              Создать
            </Button>
          </div>
          
          {/* Show new key */}
          {showNewKey && (
            <div className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="font-medium text-green-500">Ключ создан!</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Скопируйте ключ сейчас - он больше не будет показан полностью.
              </p>
              <div className="flex gap-2">
                <Input
                  value={showNewKey}
                  readOnly
                  className="flex-1 font-mono text-sm bg-secondary/30 border-border"
                />
                <Button variant="outline" onClick={() => copyKey(showNewKey)} className="bg-transparent">
                  {copiedKey === showNewKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="ghost" onClick={() => setShowNewKey(null)} className="mt-3 text-sm">
                Готово, скрыть
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Existing Keys */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Активные ключи</h2>
        </div>
        <div className="divide-y divide-border">
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>У вас пока нет API ключей</p>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="p-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {maskKey(apiKey.key)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Создан: {apiKey.created.toLocaleDateString()}
                    {apiKey.lastUsed && ` • Использован: ${apiKey.lastUsed.toLocaleTimeString()}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {apiKey.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyKey(apiKey.key)}
                    className="w-8 h-8"
                  >
                    {copiedKey === apiKey.key ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKey(apiKey.id)}
                    className="w-8 h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Example */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Использование</h2>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Добавьте API ключ в конфигурацию NPM пакета для автоматической интеграции:
          </p>
          
          <div className="rounded-xl border border-border bg-[#0a0a0f] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs text-muted-foreground font-mono">components/NexikWidget.tsx</span>
            </div>
            <pre className="p-4 overflow-x-auto text-sm font-mono">
              <code className="text-muted-foreground">{`import { NexikChat } from '@nexik/react'

export function NexikWidget() {
  return (
    <NexikChat
      clientId="your-client-id"
      serverAccess={{
        enabled: true,
        apiKey: "nxk_live_...", // Ваш API ключ
        autoSync: true // Автосинхронизация настроек
      }}
    />
  )
}`}</code>
            </pre>
          </div>

          <div className="p-4 rounded-xl bg-secondary/30 border border-border">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Что дает Server Access?
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Автосинхронизация</strong> - настройки из dashboard применяются автоматически</li>
              <li>• <strong>Автообновления</strong> - виджет обновляется без изменения кода</li>
              <li>• <strong>Расширенная аналитика</strong> - детальная статистика по серверу</li>
              <li>• <strong>Автоустановка</strong> - мы сами интегрируем виджет (скоро)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
