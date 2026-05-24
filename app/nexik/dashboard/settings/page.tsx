"use client"

import { useState, useEffect } from "react"
import { Loader2, Building2, Bot, Plug, Server, Bell, Send, CheckCircle, X, Settings, ChevronRight } from "lucide-react"
import TelegramSettingsPanel from "@/components/nexik/telegram-settings-panel"

type Tab = "company" | "bot" | "integrations" | "advanced" | "notifications"

interface TelegramAccount {
  id: string
  platform_id: string
  platform_name: string
  is_active: boolean
  is_connected: boolean
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("integrations")
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState({ name: "", industry: "", description: "" })
  const [bot, setBot] = useState({ name: "Nexik", greeting: "Привет! Чем могу помочь?", tone: "friendly" as const })
  
  // Telegram
  const [showTelegramModal, setShowTelegramModal] = useState(false)
  const [telegramPhone, setTelegramPhone] = useState("")
  const [telegramCode, setTelegramCode] = useState("")
  const [telegramPassword, setTelegramPassword] = useState("")
  const [telegramStep, setTelegramStep] = useState<"phone" | "code" | "2fa" | "verifying">("phone")
  const [telegramError, setTelegramError] = useState("")
  const [telegramConnected, setTelegramConnected] = useState(false)
  const [phoneCodeHash, setPhoneCodeHash] = useState("")
  const [sending, setSending] = useState(false)
  const [telegramAccounts, setTelegramAccounts] = useState<TelegramAccount[]>([])
  const [deletingPhone, setDeletingPhone] = useState("")
  
  // Telegram settings panel
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const res = await fetch("/api/nexik/integrations/telegram/list")
      const data = await res.json()
      if (data.integrations) {
        setTelegramAccounts(data.integrations)
        setTelegramConnected(data.integrations.length > 0)
      }
    } catch (e) {
      console.error("Failed to fetch integrations:", e)
    }
  }

  const deleteAccount = async (phone: string) => {
    if (!confirm("Удалить аккаунт " + phone + "?")) return
    setDeletingPhone(phone)
    await fetch("/api/nexik/integrations/telegram/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    })
    await fetchIntegrations()
    setDeletingPhone("")
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/nexik/dashboard/settings")
        if (res.ok) {
          const data = await res.json()
          setCompany({ name: data.companyName || "", industry: data.industry || "", description: data.businessDescription || "" })
          setBot({ name: data.botName || "Nexik", greeting: data.greeting || "Привет! Чем могу помочь?", tone: data.tone || "friendly" })
        }
        const intRes = await fetch("/api/nexik/integrations/telegram/status")
        if (intRes.ok) {
          const intData = await intRes.json()
          setTelegramConnected(intData.connected || false)
        }
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const sendTelegramCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramPhone) { setTelegramError("Введите номер телефона"); return }
    setTelegramError("")
    setSending(true)
    try {
      const res = await fetch("/api/nexik/integrations/telegram/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: telegramPhone })
      })
      const data = await res.json()
      if (!data.success) {
        setTelegramError(data.error || "Ошибка отправки кода")
        setSending(false)
        return
      }
      setPhoneCodeHash(data.phone_code_hash)
      setTelegramStep("code")
    } catch { setTelegramError("Ошибка сети") }
    finally { setSending(false) }
  }

  const verifyTelegramCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramCode) { setTelegramError("Введите код"); return }
    setTelegramError("")
    setTelegramStep("verifying")
    try {
      const res = await fetch("/api/nexik/integrations/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: telegramPhone, code: telegramCode, phone_code_hash: phoneCodeHash })
      })
      const data = await res.json()
      
      if (data.requires_2fa) {
        setTelegramStep("2fa")
        setTelegramError("")
        return
      }
      
      if (!data.success) {
        setTelegramError(data.error || "Неверный код")
        setTelegramStep("code")
        return
      }
      
      setTelegramConnected(true)
      fetchIntegrations()
      setShowTelegramModal(false)
      resetTelegramForm()
    } catch { setTelegramError("Ошибка сети"); setTelegramStep("code") }
  }

  const submit2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!telegramPassword) { setTelegramError("Введите пароль"); return }
    setTelegramError("")
    setTelegramStep("verifying")
    try {
      const res = await fetch("/api/nexik/integrations/telegram/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: telegramPhone, code: telegramCode, phone_code_hash: phoneCodeHash, password: telegramPassword })
      })
      const data = await res.json()
      
      if (!data.success) {
        setTelegramError(data.error || "Неверный пароль")
        setTelegramStep("2fa")
        return
      }
      
      setTelegramConnected(true)
      fetchIntegrations()
      setShowTelegramModal(false)
      resetTelegramForm()
    } catch { setTelegramError("Ошибка сети"); setTelegramStep("2fa") }
  }
  
  const resetTelegramForm = () => {
    setTelegramStep("phone")
    setTelegramPhone("")
    setTelegramCode("")
    setTelegramPassword("")
    setTelegramError("")
    setPhoneCodeHash("")
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-white/50" /></div>

  const tabs = [
    { id: "company" as Tab, label: "Компания", icon: Building2 },
    { id: "bot" as Tab, label: "Бот", icon: Bot },
    { id: "integrations" as Tab, label: "Интеграции", icon: Plug },
    { id: "advanced" as Tab, label: "Расширенные", icon: Server },
    { id: "notifications" as Tab, label: "Уведомления", icon: Bell }
  ]

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Настройки</h1><p className="text-white/50 mt-1">Управление аккаунтом и AI-ассистентом</p></div>
      <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${activeTab === tab.id ? "bg-white/10 text-white" : "text-white/50 hover:text-white/70"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "integrations" && (
        <div className="max-w-3xl space-y-4">
          {/* Telegram Section */}
          <div className="bg-zinc-900 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
                </div>
                <div><p className="font-medium">Telegram</p><p className="text-sm text-white/40">Автоматические ответы в Telegram</p></div>
              </div>
              {telegramConnected ? (
                <span className="flex items-center gap-2 text-green-400"><CheckCircle className="w-4 h-4" />Подключено: {telegramAccounts.length}</span>
              ) : (
                <button onClick={() => setShowTelegramModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm">Подключить</button>
              )}
            </div>
            
            {/* Список аккаунтов */}
            {telegramAccounts.length > 0 && (
              <div className="mt-4 space-y-2">
                {telegramAccounts.map((acc) => (
                  <div key={acc.id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${acc.is_connected ? "bg-green-400" : "bg-yellow-400"}`} />
                      <div>
                        <span className="text-white font-medium">{acc.platform_name || acc.platform_id}</span>
                        <span className="text-white/40 text-sm ml-2">{acc.platform_id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedAccountId(acc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                      >
                        <Settings className="w-4 h-4" />
                        Настройки
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteAccount(acc.platform_id)}
                        disabled={deletingPhone === acc.platform_id}
                        className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg text-sm disabled:opacity-50"
                      >
                        {deletingPhone === acc.platform_id ? "..." : "Удалить"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-3">
              <button onClick={() => setShowTelegramModal(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm w-full">
                + Подключить ещё аккаунт
              </button>
            </div>
          </div>
          
          {/* Telegram Settings Panel */}
          {selectedAccountId && (
            <TelegramSettingsPanel 
              integrationId={selectedAccountId} 
              onClose={() => setSelectedAccountId(null)}
            />
          )}
          
          {/* Other integrations placeholder */}
          <div className="bg-zinc-900 rounded-xl p-4 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
              </div>
              <div><p className="font-medium">Instagram</p><p className="text-sm text-white/40">Скоро</p></div>
            </div>
          </div>
          
          <div className="bg-zinc-900 rounded-xl p-4 opacity-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
              </div>
              <div><p className="font-medium">WhatsApp</p><p className="text-sm text-white/40">Скоро</p></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "company" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Название компании</label>
              <input 
                type="text" 
                value={company.name} 
                onChange={e => setCompany(c => ({ ...c, name: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white"
                placeholder="Моя компания"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Отрасль</label>
              <input 
                type="text" 
                value={company.industry} 
                onChange={e => setCompany(c => ({ ...c, industry: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white"
                placeholder="IT, Ритейл, Услуги..."
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Описание бизнеса</label>
              <textarea 
                value={company.description} 
                onChange={e => setCompany(c => ({ ...c, description: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white min-h-[100px]"
                placeholder="Расскажите о вашем бизнесе..."
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "bot" && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-zinc-900 rounded-xl p-6 space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Имя бота</label>
              <input 
                type="text" 
                value={bot.name} 
                onChange={e => setBot(b => ({ ...b, name: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white"
                placeholder="Nexik"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Приветственное сообщение</label>
              <textarea 
                value={bot.greeting} 
                onChange={e => setBot(b => ({ ...b, greeting: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white"
                placeholder="Привет! Чем могу помочь?"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Тон общения</label>
              <select 
                value={bot.tone} 
                onChange={e => setBot(b => ({ ...b, tone: e.target.value as typeof bot.tone }))}
                className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white"
              >
                <option value="friendly">Дружелюбный</option>
                <option value="professional">Профессиональный</option>
                <option value="casual">Неформальный</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно Telegram */}
      {showTelegramModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => { setShowTelegramModal(false); resetTelegramForm(); }}>
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Подключить Telegram</h3>
              <button onClick={() => { setShowTelegramModal(false); resetTelegramForm(); }} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {telegramStep === "phone" && (
              <form onSubmit={sendTelegramCode}>
                <p className="text-white/60 text-sm mb-4">Введите номер телефона в международном формате (например, +79161234567)</p>
                <input type="tel" value={telegramPhone} onChange={(e) => setTelegramPhone(e.target.value)} placeholder="+79161234567" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white mb-4 focus:outline-none focus:border-white/30" autoFocus />
                {telegramError && <p className="text-red-400 text-sm mb-4">{telegramError}</p>}
                <button type="submit" disabled={sending} className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}Отправить код
                </button>
              </form>
            )}

            {telegramStep === "code" && (
              <form onSubmit={verifyTelegramCode}>
                <p className="text-white/60 text-sm mb-4">Введите код, который пришёл в Telegram</p>
                <input type="text" value={telegramCode} onChange={(e) => setTelegramCode(e.target.value)} placeholder="123456" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white mb-4 text-center text-2xl tracking-widest focus:outline-none focus:border-white/30" maxLength={6} autoFocus />
                {telegramError && <p className="text-red-400 text-sm mb-4">{telegramError}</p>}
                <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90">Подтвердить</button>
                <button type="button" onClick={() => { setTelegramStep("phone"); setTelegramError(""); }} className="w-full py-2 mt-2 text-white/50 hover:text-white text-sm">
                  Изменить номер
                </button>
              </form>
            )}

            {telegramStep === "2fa" && (
              <form onSubmit={submit2FA}>
                <p className="text-white/60 text-sm mb-4">Введите облачный пароль Telegram (2FA)</p>
                <input type="password" value={telegramPassword} onChange={(e) => setTelegramPassword(e.target.value)} placeholder="Пароль 2FA" className="w-full px-4 py-3 bg-zinc-800 border border-white/10 rounded-xl text-white mb-4 focus:outline-none focus:border-white/30" autoFocus />
                {telegramError && <p className="text-red-400 text-sm mb-4">{telegramError}</p>}
                <button type="submit" className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90">Подтвердить</button>
              </form>
            )}

            {telegramStep === "verifying" && (
              <div className="flex flex-col items-center py-8"><Loader2 className="w-8 h-8 animate-spin text-white/50 mb-4" /><p className="text-white/60">Подключение...</p></div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
