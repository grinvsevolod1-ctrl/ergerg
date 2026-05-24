"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Loader2, Settings, MessageSquare, Volume2, Image, Sticker, Clock, 
  Ban, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, Save
} from "lucide-react"

interface TelegramSettings {
  respond_to_all: boolean
  respond_to_questions_only: boolean
  respond_to_mentions: boolean
  process_text: boolean
  process_voice: boolean
  process_photos: boolean
  process_stickers: boolean
  typing_delay_ms: number
  response_delay_ms: number
  auto_reply_enabled: boolean
  notify_on_new_chat: boolean
  notify_on_keywords: string[]
}

interface TelegramException {
  id: string
  exception_type: string
  value: string
  mode: string
  description: string
  is_active: boolean
}

interface Integration {
  id: string
  platform_id: string
  platform_name: string
  is_active: boolean
  is_connected: boolean
}

interface TelegramSettingsPanelProps {
  integrationId: string
  onClose?: () => void
}

const defaultSettings: TelegramSettings = {
  respond_to_all: true,
  respond_to_questions_only: false,
  respond_to_mentions: true,
  process_text: true,
  process_voice: true,
  process_photos: false,
  process_stickers: false,
  typing_delay_ms: 1000,
  response_delay_ms: 2000,
  auto_reply_enabled: true,
  notify_on_new_chat: true,
  notify_on_keywords: []
}

export default function TelegramSettingsPanel({ integrationId, onClose }: TelegramSettingsPanelProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [integration, setIntegration] = useState<Integration | null>(null)
  const [settings, setSettings] = useState<TelegramSettings>(defaultSettings)
  const [exceptions, setExceptions] = useState<TelegramException[]>([])
  const [activeTab, setActiveTab] = useState<"response" | "filters" | "exceptions">("response")
  
  // New exception form
  const [showAddException, setShowAddException] = useState(false)
  const [newException, setNewException] = useState({
    exception_type: "user",
    value: "",
    mode: "ignore",
    description: ""
  })
  const [addingException, setAddingException] = useState(false)
  
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/nexik/integrations/telegram/settings?integration_id=${integrationId}`)
      const data = await res.json()
      if (data.integration) setIntegration(data.integration)
      if (data.settings) setSettings(data.settings)
      if (data.exceptions) setExceptions(data.exceptions)
    } catch (e) {
      console.error("Failed to fetch telegram settings:", e)
    } finally {
      setLoading(false)
    }
  }, [integrationId])
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch("/api/nexik/integrations/telegram/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integration_id: integrationId, settings })
      })
    } catch (e) {
      console.error("Failed to save settings:", e)
    } finally {
      setSaving(false)
    }
  }
  
  const addException = async () => {
    if (!newException.value.trim()) return
    setAddingException(true)
    try {
      await fetch("/api/nexik/integrations/telegram/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newException, integration_id: integrationId })
      })
      await fetchData()
      setShowAddException(false)
      setNewException({ exception_type: "user", value: "", mode: "ignore", description: "" })
    } catch (e) {
      console.error("Failed to add exception:", e)
    } finally {
      setAddingException(false)
    }
  }
  
  const toggleException = async (id: string, isActive: boolean) => {
    try {
      await fetch("/api/nexik/integrations/telegram/exceptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !isActive })
      })
      setExceptions(prev => prev.map(e => e.id === id ? { ...e, is_active: !isActive } : e))
    } catch (e) {
      console.error("Failed to toggle exception:", e)
    }
  }
  
  const deleteException = async (id: string) => {
    if (!confirm("Удалить исключение?")) return
    try {
      await fetch(`/api/nexik/integrations/telegram/exceptions?id=${id}`, { method: "DELETE" })
      setExceptions(prev => prev.filter(e => e.id !== id))
    } catch (e) {
      console.error("Failed to delete exception:", e)
    }
  }
  
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? "bg-cyan-500" : "bg-zinc-700"}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-6" : "left-1"}`} />
    </button>
  )
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
      </div>
    )
  }
  
  return (
    <div className="bg-zinc-900 rounded-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            </svg>
          </div>
          <div>
            <p className="font-medium">Настройки Telegram</p>
            <p className="text-sm text-white/40">{integration?.platform_id || "Аккаунт"}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab("response")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "response" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/50 hover:text-white/70"}`}
        >
          <MessageSquare className="w-4 h-4 inline mr-2" />
          Ответы
        </button>
        <button 
          onClick={() => setActiveTab("filters")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "filters" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/50 hover:text-white/70"}`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Фильтры
        </button>
        <button 
          onClick={() => setActiveTab("exceptions")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "exceptions" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-white/50 hover:text-white/70"}`}
        >
          <Ban className="w-4 h-4 inline mr-2" />
          Исключения ({exceptions.length})
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === "response" && (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Автоответы включены</p>
                  <p className="text-sm text-white/40">Бот будет автоматически отвечать на сообщения</p>
                </div>
                <Toggle checked={settings.auto_reply_enabled} onChange={v => setSettings(s => ({ ...s, auto_reply_enabled: v }))} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Отвечать на все сообщения</p>
                  <p className="text-sm text-white/40">Отвечать на любое входящее сообщение</p>
                </div>
                <Toggle checked={settings.respond_to_all} onChange={v => setSettings(s => ({ ...s, respond_to_all: v, respond_to_questions_only: v ? false : s.respond_to_questions_only }))} />
              </div>
              
              {!settings.respond_to_all && (
                <div className="flex items-center justify-between pl-4 border-l-2 border-white/10">
                  <div>
                    <p className="font-medium">Только на вопросы</p>
                    <p className="text-sm text-white/40">Отвечать только если сообщение содержит вопрос</p>
                  </div>
                  <Toggle checked={settings.respond_to_questions_only} onChange={v => setSettings(s => ({ ...s, respond_to_questions_only: v }))} />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Отвечать при упоминании</p>
                  <p className="text-sm text-white/40">Отвечать когда вас упоминают в группах</p>
                </div>
                <Toggle checked={settings.respond_to_mentions} onChange={v => setSettings(s => ({ ...s, respond_to_mentions: v }))} />
              </div>
            </div>
            
            <div className="pt-4 border-t border-white/10 space-y-4">
              <p className="text-white/50 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4" /> Задержки ответа
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Задержка "печатает..." (мс)</label>
                  <input 
                    type="number" 
                    value={settings.typing_delay_ms} 
                    onChange={e => setSettings(s => ({ ...s, typing_delay_ms: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Задержка ответа (мс)</label>
                  <input 
                    type="number" 
                    value={settings.response_delay_ms} 
                    onChange={e => setSettings(s => ({ ...s, response_delay_ms: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/10 rounded-lg text-white"
                  />
                </div>
              </div>
              <p className="text-xs text-white/30">Рекомендуется: 1000-3000 мс для естественного эффекта</p>
            </div>
          </>
        )}
        
        {activeTab === "filters" && (
          <div className="space-y-4">
            <p className="text-white/50 text-sm">Выберите типы сообщений для обработки</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-white/40" />
                <div>
                  <p className="font-medium">Текстовые сообщения</p>
                  <p className="text-sm text-white/40">Обычные текстовые сообщения</p>
                </div>
              </div>
              <Toggle checked={settings.process_text} onChange={v => setSettings(s => ({ ...s, process_text: v }))} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-white/40" />
                <div>
                  <p className="font-medium">Голосовые сообщения</p>
                  <p className="text-sm text-white/40">Распознавание и ответ на голосовые</p>
                </div>
              </div>
              <Toggle checked={settings.process_voice} onChange={v => setSettings(s => ({ ...s, process_voice: v }))} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image className="w-5 h-5 text-white/40" />
                <div>
                  <p className="font-medium">Фотографии</p>
                  <p className="text-sm text-white/40">Обработка изображений (экспериментально)</p>
                </div>
              </div>
              <Toggle checked={settings.process_photos} onChange={v => setSettings(s => ({ ...s, process_photos: v }))} />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sticker className="w-5 h-5 text-white/40" />
                <div>
                  <p className="font-medium">Стикеры</p>
                  <p className="text-sm text-white/40">Реагировать на стикеры</p>
                </div>
              </div>
              <Toggle checked={settings.process_stickers} onChange={v => setSettings(s => ({ ...s, process_stickers: v }))} />
            </div>
          </div>
        )}
        
        {activeTab === "exceptions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white/50 text-sm">Игнорировать определённых пользователей, чаты или слова</p>
              <button 
                onClick={() => setShowAddException(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30"
              >
                <Plus className="w-4 h-4" /> Добавить
              </button>
            </div>
            
            {showAddException && (
              <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Тип</label>
                    <select 
                      value={newException.exception_type}
                      onChange={e => setNewException(ex => ({ ...ex, exception_type: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white"
                    >
                      <option value="user">Пользователь</option>
                      <option value="chat">Чат/Группа</option>
                      <option value="keyword">Ключевое слово</option>
                      <option value="phrase">Фраза</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/60 mb-1 block">Режим</label>
                    <select 
                      value={newException.mode}
                      onChange={e => setNewException(ex => ({ ...ex, mode: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white"
                    >
                      <option value="ignore">Игнорировать</option>
                      <option value="notify">Только уведомить</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">
                    {newException.exception_type === "user" && "Username или ID пользователя"}
                    {newException.exception_type === "chat" && "ID чата или username группы"}
                    {newException.exception_type === "keyword" && "Ключевое слово"}
                    {newException.exception_type === "phrase" && "Фраза для поиска"}
                    {newException.exception_type === "regex" && "Регулярное выражение"}
                  </label>
                  <input 
                    type="text"
                    value={newException.value}
                    onChange={e => setNewException(ex => ({ ...ex, value: e.target.value }))}
                    placeholder={
                      newException.exception_type === "user" ? "@username или 123456789" :
                      newException.exception_type === "chat" ? "-100123456789 или @groupname" :
                      newException.exception_type === "keyword" ? "спам" :
                      newException.exception_type === "phrase" ? "подпишись на канал" :
                      "^реклама.*$"
                    }
                    className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/60 mb-1 block">Описание (опционально)</label>
                  <input 
                    type="text"
                    value={newException.description}
                    onChange={e => setNewException(ex => ({ ...ex, description: e.target.value }))}
                    placeholder="Почему добавлено это исключение"
                    className="w-full px-3 py-2 bg-zinc-700 border border-white/10 rounded-lg text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={addException}
                    disabled={addingException || !newException.value.trim()}
                    className="flex-1 py-2 bg-cyan-500 text-black rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {addingException ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Добавить"}
                  </button>
                  <button 
                    onClick={() => setShowAddException(false)}
                    className="px-4 py-2 bg-zinc-700 text-white/70 rounded-lg hover:bg-zinc-600"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
            
            {exceptions.length === 0 && !showAddException ? (
              <div className="text-center py-8 text-white/40">
                <Ban className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Нет исключений</p>
                <p className="text-sm">Добавьте пользователей или слова для игнорирования</p>
              </div>
            ) : (
              <div className="space-y-2">
                {exceptions.map(exc => (
                  <div 
                    key={exc.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${exc.is_active ? "bg-zinc-800" : "bg-zinc-800/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                        exc.exception_type === "user" ? "bg-blue-500/20 text-blue-400" :
                        exc.exception_type === "chat" ? "bg-green-500/20 text-green-400" :
                        exc.exception_type === "keyword" ? "bg-yellow-500/20 text-yellow-400" :
                        exc.exception_type === "phrase" ? "bg-orange-500/20 text-orange-400" :
                        "bg-purple-500/20 text-purple-400"
                      }`}>
                        {exc.exception_type === "user" ? "U" :
                         exc.exception_type === "chat" ? "C" :
                         exc.exception_type === "keyword" ? "K" :
                         exc.exception_type === "phrase" ? "P" : "R"}
                      </div>
                      <div>
                        <p className={`font-medium ${!exc.is_active ? "text-white/50 line-through" : ""}`}>
                          {exc.value}
                        </p>
                        <p className="text-xs text-white/40">
                          {exc.exception_type === "user" ? "Пользователь" :
                           exc.exception_type === "chat" ? "Чат" :
                           exc.exception_type === "keyword" ? "Слово" :
                           exc.exception_type === "phrase" ? "Фраза" : "Regex"} 
                          {" "}
                          {exc.mode === "ignore" ? "- игнорировать" : "- уведомлять"}
                          {exc.description && ` | ${exc.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleException(exc.id, exc.is_active)}
                        className="p-2 hover:bg-white/10 rounded-lg"
                      >
                        {exc.is_active ? (
                          <ToggleRight className="w-5 h-5 text-cyan-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      <button 
                        onClick={() => deleteException(exc.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between p-4 border-t border-white/10 bg-zinc-800/50">
        <p className="text-xs text-white/40">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Изменения применяются сразу после сохранения
        </p>
        <button 
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-black rounded-lg font-medium hover:bg-cyan-400 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Сохранить
        </button>
      </div>
    </div>
  )
}
