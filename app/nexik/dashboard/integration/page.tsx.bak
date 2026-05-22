"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { 
  Copy, 
  Check, 
  Globe, 
  Code, 
  HelpCircle,
  ExternalLink,
  Play,
  ChevronRight,
  MessageSquare,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Link2,
  Settings,
  ArrowRight,
  AlertCircle,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Platform integration instructions with OAuth support
const platformInstructions: Record<string, {
  name: string
  icon: string
  hasOAuth: boolean
  oauthBeta?: boolean
  steps: string[]
  videoUrl?: string
  docsUrl?: string
}> = {
  shopify: {
    name: "Shopify",
    icon: "S",
    hasOAuth: true,
    steps: [
      "Нажмите кнопку «Подключить Shopify»",
      "Войдите в ваш магазин Shopify",
      "Разрешите Nexik доступ к вашему магазину",
      "Виджет будет автоматически установлен!"
    ],
    docsUrl: "https://help.shopify.com/en/manual/online-store/themes/theme-structure/extend/edit-theme-code"
  },
  wix: {
    name: "Wix",
    icon: "W",
    hasOAuth: true,
    oauthBeta: true,
    steps: [
      "Откройте редактор Wix",
      "Нажмите на «Настройки» → «Отслеживание и аналитика»",
      "Нажмите «+ New Tool» → «Custom»",
      "Вставьте код виджета в поле «Paste the code snippet here»",
      "Выберите место: Body - end",
      "Сохраните и опубликуйте сайт"
    ],
    docsUrl: "https://support.wix.com/en/article/embedding-custom-code-on-your-site"
  },
  squarespace: {
    name: "Squarespace",
    icon: "S",
    hasOAuth: true,
    oauthBeta: true,
    steps: [
      "Откройте настройки сайта в Squarespace",
      "Перейдите в Settings → Developer Tools → Code Injection",
      "Вставьте код в поле «Footer»",
      "Сохраните изменения"
    ],
    docsUrl: "https://support.squarespace.com/hc/en-us/articles/205815908"
  },
  wordpress: {
    name: "WordPress",
    icon: "W",
    hasOAuth: true,
    oauthBeta: true,
    steps: [
      "Войдите в админ-панель WordPress",
      "Установите плагин «WPCode» (бесплатный)",
      "Перейдите в Code Snippets → Header & Footer",
      "Вставьте код в поле «Footer»",
      "Сохраните изменения"
    ],
    docsUrl: "https://developer.wordpress.org/plugins/hooks/actions/"
  },
  tilda: {
    name: "Tilda",
    icon: "T",
    hasOAuth: false,
    steps: [
      "Откройте настройки сайта в Tilda",
      "Перейдите в раздел «Еще» → «HTML-код для вставки»",
      "В поле «Код перед </body>» вставьте код виджета",
      "Нажмите «Сохранить» и «Опубликовать сайт»"
    ],
    docsUrl: "https://help.tilda.cc/html-code"
  },
  bitrix: {
    name: "Битрикс",
    icon: "B",
    hasOAuth: false,
    steps: [
      "Войдите в админ-панель Битрикс",
      "Перейдите в Настройки → Настройки продукта → Сайты → Шаблоны сайтов",
      "Откройте ваш шаблон и найдите footer.php",
      "Вставьте код виджета перед </body>",
      "Сохраните изменения"
    ]
  },
  html: {
    name: "HTML / Любой сайт",
    icon: "</>",
    hasOAuth: false,
    steps: [
      "Откройте HTML-файл вашего сайта в редакторе",
      "Найдите закрывающий тег </body>",
      "Вставьте код виджета прямо перед этим тегом",
      "Сохраните файл и загрузите на сервер"
    ]
  },
  nextjs: {
    name: "Next.js / React",
    icon: "N",
    hasOAuth: false,
    steps: [
      "Установите пакет: npm install @nexik/next",
      "Импортируйте компонент в layout.tsx",
      "Добавьте <NexikWidget clientId=\"your-id\" />",
      "Перезапустите dev-сервер"
    ]
  }
}

// DNS registrar instructions
const registrarInstructions: Record<string, {
  name: string
  dnsUrl: string
  steps: string[]
}> = {
  "reg.ru": {
    name: "REG.RU",
    dnsUrl: "https://www.reg.ru/user/account/#/dns/",
    steps: [
      "Войдите в личный кабинет REG.RU",
      "Перейдите в раздел «Мои домены»",
      "Нажмите на нужный домен → «Управление DNS»",
      "Нажмите «Добавить запись» → выберите CNAME",
      "В поле «Имя» введите: chat",
      "В поле «Значение» введите: widget.nexik.io",
      "TTL оставьте по умолчанию (3600)",
      "Нажмите «Добавить»"
    ]
  },
  "beget": {
    name: "Beget",
    dnsUrl: "https://cp.beget.com/dns",
    steps: [
      "Войдите в панель управления Beget",
      "Перейдите в раздел «DNS»",
      "Выберите домен из списка",
      "Прокрутите вниз до «CNAME записи»",
      "Нажмите «Добавить»",
      "Субдомен: chat",
      "Каноническое имя: widget.nexik.io",
      "Нажмите «Изменить»"
    ]
  },
  "timeweb": {
    name: "TimeWeb",
    dnsUrl: "https://hosting.timeweb.ru/domains",
    steps: [
      "Войдите в панель TimeWeb",
      "Перейдите в раздел «Домены»",
      "Нажмите на домен → «DNS-записи»",
      "Нажмите «Добавить запись»",
      "Тип: CNAME",
      "Имя: chat",
      "Значение: widget.nexik.io",
      "Сохраните изменения"
    ]
  },
  "godaddy": {
    name: "GoDaddy",
    dnsUrl: "https://dcc.godaddy.com/manage/dns",
    steps: [
      "Войдите в аккаунт GoDaddy",
      "Перейдите в My Products → Domains",
      "Нажмите DNS рядом с доменом",
      "В разделе Records нажмите Add",
      "Type: CNAME",
      "Name: chat",
      "Value: widget.nexik.io",
      "TTL: 1 Hour",
      "Save"
    ]
  },
  "namecheap": {
    name: "Namecheap",
    dnsUrl: "https://ap.www.namecheap.com/domains/list",
    steps: [
      "Войдите в Namecheap Dashboard",
      "Нажмите Domain List → Manage на домене",
      "Перейдите в Advanced DNS",
      "Нажмите Add New Record",
      "Type: CNAME Record",
      "Host: chat",
      "Value: widget.nexik.io",
      "Save All Changes"
    ]
  },
  "cloudflare": {
    name: "Cloudflare",
    dnsUrl: "https://dash.cloudflare.com/",
    steps: [
      "Войдите в Cloudflare Dashboard",
      "Выберите ваш домен",
      "Пер��йдите в DNS → Records",
      "Нажмите Add record",
      "Type: CNAME",
      "Name: chat",
      "Target: widget.nexik.io",
      "Proxy status: DNS only (серая иконка облака)",
      "Save"
    ]
  },
  "nic.ru": {
    name: "NIC.RU (RU-CENTER)",
    dnsUrl: "https://www.nic.ru/manager/services/",
    steps: [
      "Войдите в личный кабинет RU-CENTER",
      "Выберите домен → «Управление зоной»",
      "Нажмите «Добавить запись»",
      "Тип: CNAME",
      "Имя: chat",
      "Значение: widget.nexik.io.",
      "Обратите внимание: точка в конце обязательна!",
      "Сохраните"
    ]
  },
  "r01": {
    name: "R01 (Relcom)",
    dnsUrl: "https://r01.ru/domain/",
    steps: [
      "Войдите в панель R01",
      "Перейдите в «Домены» → выберите домен",
      "Нажмите «DNS-зона»",
      "Добавьте CNAME запись:",
      "Поддомен: chat",
      "Хост: widget.nexik.io",
      "Примените изменения"
    ]
  }
}

export default function IntegrationPage() {
  const searchParams = useSearchParams()
  const [widgetId, setWidgetId] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>("tilda")
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [integrationStatus, setIntegrationStatus] = useState<"unknown" | "installed" | "not_found">("unknown")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null)
  const [showCnameInstructions, setShowCnameInstructions] = useState(false)
  const [selectedRegistrar, setSelectedRegistrar] = useState<string | null>(null)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [showHelpForm, setShowHelpForm] = useState(false)
  const [helpFormData, setHelpFormData] = useState({ name: "", email: "", website: "", message: "" })
  const [helpFormSubmitted, setHelpFormSubmitted] = useState(false)

  // Check for OAuth callback success/error
  useEffect(() => {
    const success = searchParams.get("success")
    const error = searchParams.get("error")
    const platform = searchParams.get("platform")

    if (success === "true" && platform) {
      setIntegrationStatus("installed")
      setDetectedPlatform(platform)
    }

    if (error) {
      // Show error notification
      console.error("OAuth error:", error)
    }
  }, [searchParams])

  useEffect(() => {
    const id = localStorage.getItem('nexik_widget_id') || 'nxk_demo123'
    setWidgetId(id)
  }, [])

  const widgetCode = `<script src="https://nexik.io/widget.js" data-id="${widgetId}"></script>`

  const copyCode = () => {
    navigator.clipboard.writeText(widgetCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const checkInstallation = async () => {
    if (!websiteUrl) return
    
    setCheckingStatus(true)
    setIntegrationStatus("unknown")
    
    try {
      const res = await fetch("/api/nexik/check-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl, widgetId })
      })
      
      const data = await res.json()
      
      if (data.installed) {
        setIntegrationStatus("installed")
      } else {
        setIntegrationStatus("not_found")
      }
      
      if (data.platform) {
        setDetectedPlatform(data.platform)
        setSelectedPlatform(data.platform)
      }
    } catch {
      setIntegrationStatus("not_found")
    } finally {
      setCheckingStatus(false)
    }
  }

  // Start OAuth flow
  const startOAuth = async (platform: string) => {
    setOauthLoading(platform)
    
    try {
      const shop = platform === "shopify" ? prompt("Введите имя вашего магазина (например: my-store)") : null
      
      if (platform === "shopify" && !shop) {
        setOauthLoading(null)
        return
      }

      const params = new URLSearchParams({ widget_id: widgetId })
      if (shop) params.set("shop", shop)

      const res = await fetch(`/api/nexik/integrations/oauth/${platform}?${params}`)
      const data = await res.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else if (data.fallback === "manual") {
        alert("OAuth интеграция пока недоступна для этой платформы. Используйте ручную установку кода.")
        setOauthLoading(null)
      } else {
        alert(data.error || "Не удалось начать интеграцию")
        setOauthLoading(null)
      }
    } catch (error) {
      alert("Ошибка подключения")
      setOauthLoading(null)
    }
  }

  // Submit help request
  const submitHelpForm = async () => {
    try {
      await fetch("/api/nexik/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...helpFormData,
          widgetId,
          type: "integration_help"
        })
      })
      setHelpFormSubmitted(true)
    } catch {
      alert("Ошибка отправки. Попробуйте написать на support@nexik.io")
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-0.5 bg-[#00ffff]" />
          <span className="text-[#00ffff] font-mono text-sm">{"// Интеграция"}</span>
        </div>
        <h1 className="text-3xl font-bold">Установка виджета</h1>
        <p className="text-zinc-400 mt-1">
          Добавьте Nexik на ваш сайт за пару минут
        </p>
      </div>

      {/* Success/Error messages from OAuth */}
      {searchParams.get("success") === "true" && (
        <div className="mb-6 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
          <div>
            <p className="font-medium text-[#00ff88]">Интеграция успешна!</p>
            <p className="text-sm text-zinc-400">Виджет установлен на ваш сайт через {searchParams.get("platform")}</p>
          </div>
        </div>
      )}

      {searchParams.get("error") && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <div>
            <p className="font-medium text-red-500">Ошибка интеграции</p>
            <p className="text-sm text-zinc-400">{searchParams.get("error")}</p>
          </div>
        </div>
      )}

      {/* Widget Code */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Код виджета</h2>
            <p className="text-sm text-zinc-500">Добавьте этот код на ваш сайт перед {"</body>"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 font-mono">ID: {widgetId}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyCode}
              className="gap-2 border-[#2a2a3e] hover:bg-[#1a1a2e]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#00ff88]" />
                  Скопировано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Копировать
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="rounded-xl bg-[#12121a] border border-[#2a2a3e] p-4 font-mono text-sm text-[#00ff88] overflow-x-auto">
          {widgetCode}
        </div>
      </div>

      {/* Check Installation */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Проверить установку</h2>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://your-site.com"
              className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#00ffff]/50"
            />
          </div>
          <Button 
            onClick={checkInstallation}
            disabled={!websiteUrl || checkingStatus}
            className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90 gap-2"
          >
            {checkingStatus ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Проверяю...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Проверить
              </>
            )}
          </Button>
        </div>
        
        {integrationStatus === "installed" && (
          <div className="mt-4 p-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
            <div>
              <p className="font-medium text-[#00ff88]">Виджет установлен!</p>
              <p className="text-sm text-zinc-400">Nexik успешно работает на вашем сайте</p>
            </div>
          </div>
        )}
        
        {integrationStatus === "not_found" && (
          <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-amber-500" />
            <div>
              <p className="font-medium text-amber-500">Виджет не найден</p>
              <p className="text-sm text-zinc-400">Убедитесь что код добавлен и сайт опубликован</p>
            </div>
          </div>
        )}
        
        {detectedPlatform && (
          <p className="mt-3 text-sm text-zinc-400">
            Обнаружена платформа: <span className="text-[#00ffff] font-medium">{platformInstructions[detectedPlatform]?.name || detectedPlatform}</span>
          </p>
        )}
      </div>

      {/* Platform Instructions */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 overflow-hidden mb-8">
        <div className="p-6 border-b border-[#1a1a2e]">
          <h2 className="text-lg font-semibold">Инструкции по установке</h2>
          <p className="text-sm text-zinc-500">Выберите вашу платформу</p>
        </div>
        
        {/* Platform selector */}
        <div className="p-4 border-b border-[#1a1a2e] flex flex-wrap gap-2">
          {Object.entries(platformInstructions).map(([key, platform]) => (
            <button
              key={key}
              onClick={() => setSelectedPlatform(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                selectedPlatform === key
                  ? "bg-[#00ffff] text-black"
                  : "bg-[#12121a] border border-[#2a2a3e] text-white hover:border-[#00ffff]/50"
              )}
            >
              <span className="w-6 h-6 rounded bg-white/10 flex items-center justify-center text-xs font-bold">
                {platform.icon}
              </span>
              {platform.name}
              {platform.hasOAuth && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88]" />
              )}
            </button>
          ))}
        </div>
        
        {/* Instructions */}
        {selectedPlatform && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Установка на {platformInstructions[selectedPlatform].name}
              </h3>
              
              {/* OAuth button for supported platforms */}
              {platformInstructions[selectedPlatform].hasOAuth && (
                <Button
                  onClick={() => startOAuth(selectedPlatform)}
                  disabled={oauthLoading === selectedPlatform}
                  className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90 gap-2"
                >
                  {oauthLoading === selectedPlatform ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Автоматически
                  {platformInstructions[selectedPlatform].oauthBeta && (
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">BETA</span>
                  )}
                </Button>
              )}
            </div>
            
            <div className="space-y-3 mb-6">
              {platformInstructions[selectedPlatform].steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#00ffff]/20 text-[#00ffff] flex items-center justify-center flex-shrink-0 text-sm font-medium">
                    {i + 1}
                  </span>
                  <p className="text-zinc-300 pt-0.5">{step}</p>
                </div>
              ))}
            </div>
            
            {platformInstructions[selectedPlatform].docsUrl && (
              <a 
                href={platformInstructions[selectedPlatform].docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#00ffff] text-sm hover:underline"
              >
                Официальная документация
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* CNAME Instructions */}
      <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 overflow-hidden mb-8">
        <button
          onClick={() => setShowCnameInstructions(!showCnameInstructions)}
          className="w-full p-6 flex items-center justify-between hover:bg-[#12121a]/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00ffff]/10 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#00ffff]" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-semibold">Настройка своего домена</h2>
              <p className="text-sm text-zinc-500">Используйте chat.ваш-сайт.com вместо nexik.io</p>
            </div>
          </div>
          <ChevronRight className={cn("w-5 h-5 text-zinc-500 transition-transform", showCnameInstructions && "rotate-90")} />
        </button>

        {showCnameInstructions && (
          <div className="p-6 pt-0 border-t border-[#1a1a2e] mt-0">
            <div className="bg-[#12121a] rounded-xl p-4 mb-6">
              <p className="text-sm text-zinc-300 mb-3">
                Добавьте CNAME запись в DNS вашего домена:
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-500">Тип записи:</span>
                  <span className="ml-2 text-[#00ffff] font-mono">CNAME</span>
                </div>
                <div>
                  <span className="text-zinc-500">Имя/Host:</span>
                  <span className="ml-2 text-[#00ffff] font-mono">chat</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500">Значение/Target:</span>
                  <span className="ml-2 text-[#00ffff] font-mono">widget.nexik.io</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-4">Выберите вашего регистратора для подробной инструкции:</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(registrarInstructions).map(([key, reg]) => (
                <button
                  key={key}
                  onClick={() => setSelectedRegistrar(selectedRegistrar === key ? null : key)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    selectedRegistrar === key
                      ? "bg-[#00ffff] text-black"
                      : "bg-[#12121a] border border-[#2a2a3e] text-white hover:border-[#00ffff]/50"
                  )}
                >
                  {reg.name}
                </button>
              ))}
            </div>

            {selectedRegistrar && (
              <div className="bg-[#12121a] rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{registrarInstructions[selectedRegistrar].name}</h4>
                  <a
                    href={registrarInstructions[selectedRegistrar].dnsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#00ffff] text-sm hover:underline"
                  >
                    Открыть DNS панель
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                
                <div className="space-y-2">
                  {registrarInstructions[selectedRegistrar].steps.map((step, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-[#00ffff]/20 text-[#00ffff] flex items-center justify-center flex-shrink-0 text-xs">
                        {i + 1}
                      </span>
                      <p className="text-zinc-300">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-[#0a0a0f] rounded-lg flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#00ffff] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-zinc-400">
                    Изменения DNS могут занять до 24 часов для полного применения. 
                    Обычно это происходит за 5-30 минут.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help Form */}
      <div className="rounded-2xl border border-[#ff00aa]/20 bg-gradient-to-br from-[#ff00aa]/5 to-transparent overflow-hidden">
        <button
          onClick={() => setShowHelpForm(!showHelpForm)}
          className="w-full p-6 flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#ff00aa]/20 flex items-center justify-center flex-shrink-0">
            <HelpCircle className="w-6 h-6 text-[#ff00aa]" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold mb-1">Помогите мне настроить</h3>
            <p className="text-zinc-400 text-sm">
              Мы можем установить виджет за вас бесплатно. Просто оставьте заявку.
            </p>
          </div>
          <ChevronRight className={cn("w-5 h-5 text-zinc-500 transition-transform mt-3", showHelpForm && "rotate-90")} />
        </button>

        {showHelpForm && (
          <div className="p-6 pt-0 border-t border-[#ff00aa]/20">
            {helpFormSubmitted ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-[#00ff88] mx-auto mb-4" />
                <h4 className="font-semibold text-lg mb-2">Заявка отправлена!</h4>
                <p className="text-zinc-400">Мы свяжемся с вами в течение 24 часов.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Ваше имя</label>
                    <input
                      type="text"
                      value={helpFormData.name}
                      onChange={(e) => setHelpFormData({ ...helpFormData, name: e.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff00aa]/50"
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={helpFormData.email}
                      onChange={(e) => setHelpFormData({ ...helpFormData, email: e.target.value })}
                      className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff00aa]/50"
                      placeholder="ivan@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Адрес сайта</label>
                  <input
                    type="url"
                    value={helpFormData.website}
                    onChange={(e) => setHelpFormData({ ...helpFormData, website: e.target.value })}
                    className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff00aa]/50"
                    placeholder="https://my-site.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Комментарий (необязательно)</label>
                  <textarea
                    value={helpFormData.message}
                    onChange={(e) => setHelpFormData({ ...helpFormData, message: e.target.value })}
                    rows={3}
                    className="w-full bg-[#12121a] border border-[#2a2a3e] rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#ff00aa]/50 resize-none"
                    placeholder="Платформа сайта, особенности, пожелания..."
                  />
                </div>
                <Button
                  onClick={submitHelpForm}
                  disabled={!helpFormData.email || !helpFormData.website}
                  className="w-full bg-[#ff00aa] text-white hover:bg-[#ff00aa]/90 gap-2"
                >
                  Отправить заявку
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* NPM Packages */}
      <div className="mt-8 rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 p-6">
        <h2 className="text-lg font-semibold mb-2">Для разработчиков</h2>
        <p className="text-sm text-zinc-500 mb-4">NPM пакеты для различных фреймворков</p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { name: "@nexik/react", framework: "React", cmd: "npm install @nexik/react" },
            { name: "@nexik/next", framework: "Next.js", cmd: "npm install @nexik/next" },
            { name: "@nexik/vue", framework: "Vue 3", cmd: "npm install @nexik/vue" },
          ].map((pkg) => (
            <div key={pkg.name} className="p-4 rounded-xl bg-[#12121a] border border-[#2a2a3e]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-sm text-[#00ffff]">{pkg.name}</span>
                <span className="text-xs text-zinc-500">{pkg.framework}</span>
              </div>
              <div className="flex items-center justify-between">
                <code className="text-xs text-zinc-400">{pkg.cmd}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pkg.cmd)
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 rounded-xl bg-[#12121a] border border-[#2a2a3e]">
          <h4 className="font-medium mb-2">Пример использования (Next.js)</h4>
          <pre className="text-xs text-[#00ff88] overflow-x-auto">
{`// app/layout.tsx
import { NexikWidget } from '@nexik/next'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <NexikWidget clientId="${widgetId}" />
      </body>
    </html>
  )
}`}
          </pre>
        </div>
      </div>
    </div>
  )
}
