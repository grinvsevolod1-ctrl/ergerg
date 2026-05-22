"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, Eye, Code, Terminal, MessageSquare, Maximize2, Minimize2, Monitor, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface WidgetConfig {
  id: string
  name: string
  theme: {
    primaryColor: string
    position: string
  }
  greetingMessage: string
}

export default function WidgetSettingsPage() {
  const { session } = useNexikAuth()
  const [widget, setWidget] = useState<WidgetConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [config, setConfig] = useState({
    color: "#4fd1c5",
    position: "bottom-right",
    greeting: "Привет! Чем могу помочь?",
    botName: "Nexik AI",
    displayMode: "modal" as "modal" | "mini",
    modalSize: "lg" as "sm" | "md" | "lg" | "xl",
  })
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"html" | "react" | "api">("html")

  useEffect(() => {
    const loadWidget = async () => {
      try {
        const res = await fetch('/api/nexik/dashboard/widget')
        const data = await res.json()
        
        if (data.success && data.widget) {
          setWidget(data.widget)
          setConfig(prev => ({
            ...prev,
            color: data.widget.theme?.primaryColor || prev.color,
            position: data.widget.theme?.position || prev.position,
            greeting: data.widget.greetingMessage || prev.greeting,
            botName: data.widget.name || prev.botName,
          }))
        }
      } catch (err) {
        console.error('[Widget] Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadWidget()
  }, [])

  const saveSettings = async () => {
    if (!widget?.id) return
    
    setSaving(true)
    try {
      await fetch('/api/nexik/dashboard/widget', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetId: widget.id,
          name: config.botName,
          greetingMessage: config.greeting,
          theme: {
            ...widget.theme,
            primaryColor: config.color,
            position: config.position,
          }
        })
      })
    } catch (err) {
      console.error('[Widget] Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Use org slug or widget id for client identification
  const clientId = session?.org?.slug || widget?.id || 'demo'
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nexik.org"

  const embedCode = `<!-- Nexik AI Chat Widget -->
<script 
  src="${baseUrl}/nexik/widget.js"
  data-client-id="${clientId}"
  data-color="${config.color}"
  data-position="${config.position}"
  data-greeting="${config.greeting}"
  data-bot-name="${config.botName}"
  data-display-mode="${config.displayMode}"
  data-modal-size="${config.modalSize}"
  async
></script>`

  const reactCode = `import Script from 'next/script'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script
        src="${baseUrl}/nexik/widget.js"
        data-client-id="${clientId}"
        data-color="${config.color}"
        data-position="${config.position}"
        data-greeting="${config.greeting}"
        data-bot-name="${config.botName}"
        data-display-mode="${config.displayMode}"
        data-modal-size="${config.modalSize}"
        strategy="lazyOnload"
      />
    </>
  )
}`

  const copyToClipboard = async () => {
    const code = activeTab === "html" ? embedCode : reactCode
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modalSizePercent = {
    sm: "50%",
    md: "60%",
    lg: "70%",
    xl: "80%",
  }

  if (loading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 bg-white/10 mb-4" />
        <Skeleton className="h-4 w-96 bg-white/10 mb-8" />
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-2xl bg-white/10" />
          <Skeleton className="h-96 rounded-2xl bg-white/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Настройки виджета</h1>
          <p className="text-[#888] mt-1">
            Настройте внешний вид и получите код для вставки
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/nexik/demo" target="_blank">
            <Button variant="outline" className="border-[#1a1a2e] hover:bg-white/5 gap-2">
              <Eye className="w-4 h-4" />
              Предпросмотр
            </Button>
          </Link>
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Configuration */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
            <h2 className="text-lg font-semibold">Настройки</h2>
            <p className="text-sm text-[#888] mt-1">
              Кастомизируйте виджет под ваш бренд
            </p>
          </div>
          
          <div className="p-4 sm:p-6 space-y-5">
            {/* Client ID - read only */}
            <div className="space-y-2">
              <Label className="text-sm text-[#888]">ID вашего виджета</Label>
              <Input
                value={clientId}
                readOnly
                className="bg-[#1a1a2e]/50 border-[#2a2a3e] text-[#888] cursor-not-allowed"
              />
              <p className="text-xs text-[#555]">
                Уникальный идентификатор вашей организации
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Имя бота</Label>
              <Input
                value={config.botName}
                onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Приветственное сообщение</Label>
              <Input
                value={config.greeting}
                onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">Основной цвет</Label>
              
              {/* Preset colors */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { color: "#4fd1c5", name: "Teal" },
                  { color: "#6366f1", name: "Indigo" },
                  { color: "#ec4899", name: "Pink" },
                  { color: "#f59e0b", name: "Amber" },
                  { color: "#10b981", name: "Emerald" },
                  { color: "#ef4444", name: "Red" },
                  { color: "#8b5cf6", name: "Purple" },
                  { color: "#3b82f6", name: "Blue" },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    onClick={() => setConfig({ ...config, color: preset.color })}
                    className={cn(
                      "w-10 h-10 rounded-xl border-2 transition-all hover:scale-110",
                      config.color === preset.color 
                        ? "border-white shadow-lg scale-110" 
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
              
              {/* Custom color input */}
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  className="w-16 h-10 p-1 bg-secondary/30 border-border cursor-pointer"
                />
                <Input
                  value={config.color}
                  onChange={(e) => setConfig({ ...config, color: e.target.value })}
                  className="flex-1 bg-secondary/30 border-border font-mono"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Выберите один из готовых цветов или укажите свой
              </p>
            </div>

            {/* Display Mode - NEW */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Режим отображения</Label>
              <div className="flex gap-2">
                <Button
                  variant={config.displayMode === "modal" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, displayMode: "modal" })}
                  className={cn(
                    "flex-1 gap-2",
                    config.displayMode !== "modal" && "bg-transparent"
                  )}
                >
                  <Maximize2 className="w-4 h-4" />
                  Модальное окно
                </Button>
                <Button
                  variant={config.displayMode === "mini" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, displayMode: "mini" })}
                  className={cn(
                    "flex-1 gap-2",
                    config.displayMode !== "mini" && "bg-transparent"
                  )}
                >
                  <Minimize2 className="w-4 h-4" />
                  Мини-чат
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {config.displayMode === "modal" 
                  ? "Чат открывается на большую часть экрана" 
                  : "Компактный чат в углу экрана"
                }
              </p>
            </div>

            {/* Modal Size - Only show when modal mode */}
            {config.displayMode === "modal" && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Размер окна</Label>
                <div className="grid grid-cols-4 gap-2">
                  {(["sm", "md", "lg", "xl"] as const).map((size) => (
                    <Button
                      key={size}
                      variant={config.modalSize === size ? "default" : "outline"}
                      onClick={() => setConfig({ ...config, modalSize: size })}
                      className={cn(
                        "flex-col py-3 h-auto gap-1",
                        config.modalSize !== size && "bg-transparent"
                      )}
                    >
                      <Monitor className="w-4 h-4" />
                      <span className="text-xs">{modalSizePercent[size]}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Позиция кнопки</Label>
              <div className="flex gap-2">
                <Button
                  variant={config.position === "bottom-right" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, position: "bottom-right" })}
                  className={cn("flex-1", config.position !== "bottom-right" && "bg-transparent")}
                >
                  Справа
                </Button>
                <Button
                  variant={config.position === "bottom-left" ? "default" : "outline"}
                  onClick={() => setConfig({ ...config, position: "bottom-left" })}
                  className={cn("flex-1", config.position !== "bottom-left" && "bg-transparent")}
                >
                  Слева
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Код для вставки</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте этот код на ваш сайт перед {"</body>"}
            </p>
          </div>
          
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 mb-4">
              {[
                { id: "html", label: "HTML", icon: Code },
                { id: "react", label: "React/Next.js", icon: Terminal },
                { id: "api", label: "JS API", icon: MessageSquare },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    activeTab === tab.id 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {activeTab === "html" && (
              <div className="relative">
                <div className="rounded-xl border border-border bg-[#0a0a0f] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">index.html</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm font-mono max-h-60">
                    <code className="text-muted-foreground">{embedCode}</code>
                  </pre>
                </div>
                <Button size="sm" className="absolute top-12 right-2" onClick={copyToClipboard}>
                  {copied ? <><Check className="w-4 h-4 mr-1" /> Скопировано</> : <><Copy className="w-4 h-4 mr-1" /> Копировать</>}
                </Button>
              </div>
            )}

            {activeTab === "react" && (
              <div className="relative">
                <div className="rounded-xl border border-border bg-[#0a0a0f] overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">layout.tsx</span>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm font-mono max-h-60">
                    <code className="text-muted-foreground">{reactCode}</code>
                  </pre>
                </div>
                <Button size="sm" className="absolute top-12 right-2" onClick={copyToClipboard}>
                  {copied ? <><Check className="w-4 h-4 mr-1" /> Скопировано</> : <><Copy className="w-4 h-4 mr-1" /> Копировать</>}
                </Button>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-3">
                {[
                  { code: "Nexik.open()", desc: "Открыть чат программно" },
                  { code: "Nexik.close()", desc: "Закрыть чат" },
                  { code: "Nexik.toggle()", desc: "Переключить состояние" },
                  { code: "Nexik.setMode('modal')", desc: "Переключить в модальный режим" },
                  { code: "Nexik.setMode('mini')", desc: "Переключить в мини-режим" },
                  { code: "Nexik.updateColor('#6366f1')", desc: "Изменить цвет виджета динамически" },
                ].map((item) => (
                  <div key={item.code} className="p-4 rounded-xl bg-secondary/30 border border-border">
                    <code className="text-primary font-mono">{item.code}</code>
                    <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="font-medium text-primary mb-2">Инструкция</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Скопируйте код выше</li>
                <li>Вставьте его перед закрывающим тегом {"</body>"}</li>
                <li>Виджет появится автоматически</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold">Предпросмотр</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {config.displayMode === "modal" 
              ? "При клике чат откроется на " + modalSizePercent[config.modalSize] + " экрана"
              : "Компактный чат в углу экрана"
            }
          </p>
        </div>
        <div className="p-6">
          <div 
            className="relative h-64 rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(79, 209, 197, 0.05) 0%, rgba(99, 179, 237, 0.05) 100%)",
            }}
          >
            {/* Grid pattern */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
            
            {/* Modal preview */}
            {config.displayMode === "modal" && (
              <div className="absolute inset-4 flex items-center justify-center">
                <div 
                  className="bg-background/95 rounded-lg border border-border shadow-xl flex flex-col"
                  style={{ 
                    width: modalSizePercent[config.modalSize],
                    height: "80%",
                  }}
                >
                  <div 
                    className="h-12 rounded-t-lg flex items-center px-4 gap-3"
                    style={{ backgroundColor: config.color + "20" }}
                  >
                    <div 
                      className="w-8 h-8 rounded-full"
                      style={{ 
                        background: `linear-gradient(135deg, ${config.color}, ${config.color}80)`,
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium">{config.botName}</div>
                      <div className="text-xs text-muted-foreground">Онлайн</div>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                    Область чата
                  </div>
                </div>
              </div>
            )}
            
            {/* Mini chat preview */}
            {config.displayMode === "mini" && (
              <div
                className="absolute bg-background/95 rounded-lg border border-border shadow-xl w-80 h-96"
                style={{
                  bottom: "60px",
                  [config.position === "bottom-left" ? "left" : "right"]: "16px",
                }}
              >
                <div 
                  className="h-12 rounded-t-lg flex items-center px-4 gap-3"
                  style={{ backgroundColor: config.color + "20" }}
                >
                  <div 
                    className="w-8 h-8 rounded-full"
                    style={{ 
                      background: `linear-gradient(135deg, ${config.color}, ${config.color}80)`,
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium">{config.botName}</div>
                    <div className="text-xs text-muted-foreground">Онлайн</div>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm h-40">
                  Область чата
                </div>
              </div>
            )}

            {/* Chat button */}
            <div
              className="absolute bottom-4"
              style={{
                [config.position === "bottom-left" ? "left" : "right"]: "16px",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105"
                style={{ 
                  backgroundColor: config.color,
                  boxShadow: `0 4px 20px ${config.color}40`,
                }}
              >
                <svg className="w-7 h-7 fill-black" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              </div>
            </div>
            <div className="absolute top-4 left-4 text-sm text-muted-foreground">
              Ваш сайт
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
