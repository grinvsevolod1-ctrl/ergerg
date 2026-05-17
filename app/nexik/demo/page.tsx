"use client"

import { useState } from "react"
import Script from "next/script"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check, ArrowLeft, Cpu, Palette } from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"

export default function NexikDemoPage() {
  const [config, setConfig] = useState({
    clientId: "demo",
    color: "#00ffff",
    position: "bottom-right",
    greeting: "Привет! Чем могу помочь?",
    botName: "Nexik AI",
  })
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<"code" | "api">("code")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""

  const embedCode = `<!-- Nexik AI Chat Widget -->
<script 
  src="${baseUrl}/nexik/widget.js"
  data-client-id="${config.clientId}"
  data-color="${config.color}"
  data-position="${config.position}"
  data-greeting="${config.greeting}"
  data-bot-name="${config.botName}"
  async
></script>`

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const features = [
    {
      icon: Cpu,
      title: "Быстрая интеграция",
      description: "Одна строка кода — и AI-чат работает на вашем сайте",
      accent: "#00ffff",
    },
    {
      icon: Cpu,
      title: "AI на базе LLM",
      description: "Умные ответы на вопросы посетителей 24/7",
      accent: "#00ff88",
    },
    {
      icon: Palette,
      title: "Кастомизация",
      description: "Настройте цвета, текст и поведение под ваш бренд",
      accent: "#ff00aa",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#ff00aa]/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 lg:px-20 py-4 flex items-center justify-between">
          <Link href="/nexik" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_var(--primary)]">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-xl">Nexik</span>
            <span className="text-sm text-muted-foreground font-mono ml-2">Demo</span>
          </Link>
          <Link href="/nexik">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <ArrowLeft className="w-4 h-4" />
              На главную
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 lg:px-20 py-12 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex items-center gap-3 justify-center mb-4">
              <div className="w-12 h-0.5 bg-primary" />
              <span className="text-primary font-mono text-sm">{"// Демонстрация"}</span>
              <div className="w-12 h-0.5 bg-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Демо Nexik AI Chat
            </h1>
            <p className="text-lg text-muted-foreground">
              Настройте виджет и протестируйте его прямо на этой странице
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Configuration */}
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold">Настройки виджета</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Измените параметры и посмотрите результат
                </p>
              </div>
              
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-sm text-muted-foreground">Client ID</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                    placeholder="your-client-id"
                    className="bg-secondary/30 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="botName" className="text-sm text-muted-foreground">Имя бота</Label>
                  <Input
                    id="botName"
                    value={config.botName}
                    onChange={(e) => setConfig({ ...config, botName: e.target.value })}
                    className="bg-secondary/30 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting" className="text-sm text-muted-foreground">Приветствие</Label>
                  <Input
                    id="greeting"
                    value={config.greeting}
                    onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                    className="bg-secondary/30 border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Цвет</Label>
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
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Позиция</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={config.position === "bottom-right" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ ...config, position: "bottom-right" })}
                      className={config.position !== "bottom-right" ? "bg-transparent" : ""}
                    >
                      Справа внизу
                    </Button>
                    <Button
                      variant={config.position === "bottom-left" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig({ ...config, position: "bottom-left" })}
                      className={config.position !== "bottom-left" ? "bg-transparent" : ""}
                    >
                      Слева внизу
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
                  Скопируйте и добавьте на ваш сайт перед {"</body>"}
                </p>
              </div>
              
              <div className="p-6">
                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 mb-4">
                  <button
                    onClick={() => setActiveTab("code")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      activeTab === "code" 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    HTML
                  </button>
                  <button
                    onClick={() => setActiveTab("api")}
                    className={cn(
                      "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                      activeTab === "api" 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    JS API
                  </button>
                </div>

                {activeTab === "code" ? (
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
                      <pre className="p-4 overflow-x-auto text-sm font-mono">
                        <code className="text-muted-foreground">
                          {embedCode.split('\n').map((line, i) => (
                            <div key={i}>
                              {line.includes('script') && <span className="text-[#ff00aa]">{line.match(/<\/?script[^>]*>/)?.[0]}</span>}
                              {line.includes('src=') && (
                                <>
                                  {"  "}
                                  <span className="text-[#ffaa00]">src</span>
                                  <span className="text-foreground">=</span>
                                  <span className="text-[#00ff88]">{line.match(/"[^"]+"/)?.[0]}</span>
                                </>
                              )}
                              {line.includes('data-') && !line.includes('script') && (
                                <>
                                  {"  "}
                                  <span className="text-[#ffaa00]">{line.match(/data-[a-z-]+/)?.[0]}</span>
                                  <span className="text-foreground">=</span>
                                  <span className="text-[#00ff88]">{line.match(/"[^"]+"/)?.[0]}</span>
                                </>
                              )}
                              {line.includes('async') && (
                                <>
                                  {"  "}
                                  <span className="text-[#ffaa00]">async</span>
                                </>
                              )}
                              {line.includes('<!--') && <span className="text-muted-foreground">{line}</span>}
                            </div>
                          ))}
                        </code>
                      </pre>
                    </div>
                    <Button
                      size="sm"
                      className="absolute top-12 right-2"
                      onClick={copyToClipboard}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Скопировано
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Копировать
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { code: "Nexik.open()", desc: "Открыть чат программно" },
                      { code: "Nexik.close()", desc: "Закрыть чат" },
                      { code: "Nexik.toggle()", desc: "Переключить состояние" },
                    ].map((item) => (
                      <div key={item.code} className="p-4 rounded-xl bg-secondary/30 border border-border">
                        <code className="text-primary font-mono">{item.code}</code>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div 
                key={feature.title}
                className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 group hover:border-border/80 transition-all duration-300"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl opacity-30"
                  style={{ background: `linear-gradient(90deg, transparent, ${feature.accent}, transparent)` }}
                />
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300"
                  style={{ background: `${feature.accent}15`, color: feature.accent }}
                >
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20 text-primary">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Нажмите на кнопку чата в правом нижнем углу, чтобы протестировать видж��т
            </div>
          </div>
        </div>
      </main>

      {/* Load the widget */}
      <Script
        src="/nexik/widget.js"
        data-client-id={config.clientId}
        data-color={config.color}
        data-position={config.position}
        data-greeting={config.greeting}
        data-bot-name={config.botName}
        data-api-url=""
        strategy="lazyOnload"
      />
    </div>
  )
}
