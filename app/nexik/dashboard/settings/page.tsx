"use client"

import { useState, useEffect } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Users, Save, Loader2, CheckCircle2 } from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const { session } = useNexikAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  
  const [settings, setSettings] = useState({
    notifyEmail: "",
    notifyTelegram: true,
    autoOperator: true,
    autoOperatorTimeout: 30,
    welcomeEnabled: true,
    systemPrompt: "Ты AI-ассистент компании. Помогай посетителям с вопросами об услугах, ценах и сроках.",
    aiEnabled: true,
  })

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/nexik/dashboard/widget')
        const data = await res.json()
        
        if (data.success && data.widget) {
          setSettings(prev => ({
            ...prev,
            notifyEmail: session?.member?.email || prev.notifyEmail,
            autoOperator: data.widget.autoAssignOperator ?? prev.autoOperator,
            autoOperatorTimeout: data.widget.operatorTimeoutSeconds ?? prev.autoOperatorTimeout,
            systemPrompt: data.widget.systemPrompt || prev.systemPrompt,
            aiEnabled: data.widget.aiEnabled ?? prev.aiEnabled,
          }))
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [session?.member?.email])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    
    try {
      // Get widget ID first
      const widgetRes = await fetch('/api/nexik/dashboard/widget')
      const widgetData = await widgetRes.json()
      
      if (widgetData.success && widgetData.widget) {
        await fetch('/api/nexik/dashboard/widget', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            widgetId: widgetData.widget.id,
            autoAssignOperator: settings.autoOperator,
            operatorTimeoutSeconds: settings.autoOperatorTimeout,
            systemPrompt: settings.systemPrompt,
            aiEnabled: settings.aiEnabled,
          })
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {
      // Silent fail
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-4" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <div className="space-y-6 max-w-2xl">
          <Skeleton className="h-48 rounded-2xl bg-white/10" />
          <Skeleton className="h-48 rounded-2xl bg-white/10" />
          <Skeleton className="h-64 rounded-2xl bg-white/10" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Настройки</h1>
        <p className="text-[#888] mt-1">
          Конфигурация AI-ассистента для {session?.org?.name}
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#00ffff]" />
              <h2 className="text-lg font-semibold">Уведомления</h2>
            </div>
            <p className="text-sm text-[#888] mt-1">
              Настройте уведомления о новых чатах
            </p>
          </div>
          
          <div className="p-4 sm:p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-[#888]">Email для уведомлений</Label>
              <Input
                type="email"
                value={settings.notifyEmail}
                onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
                className="bg-[#1a1a2e]/50 border-[#2a2a3e]"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2e]/30 border border-[#2a2a3e]">
              <div>
                <p className="font-medium">Telegram уведомления</p>
                <p className="text-sm text-[#888]">
                  Получать уведомления в Telegram
                </p>
              </div>
              <Switch
                checked={settings.notifyTelegram}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyTelegram: checked })}
              />
            </div>
          </div>
        </div>

        {/* Operator */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#ff00aa]" />
              <h2 className="text-lg font-semibold">Подключение оператора</h2>
            </div>
            <p className="text-sm text-[#888] mt-1">
              Настройки передачи чата живому оператору
            </p>
          </div>
          
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2e]/30 border border-[#2a2a3e]">
              <div>
                <p className="font-medium">Авто-подключение</p>
                <p className="text-sm text-[#888]">
                  Автоматически подключать оператора при сложных вопросах
                </p>
              </div>
              <Switch
                checked={settings.autoOperator}
                onCheckedChange={(checked) => setSettings({ ...settings, autoOperator: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#888]">Таймаут ожидания (секунды)</Label>
              <Input
                type="number"
                value={settings.autoOperatorTimeout}
                onChange={(e) => setSettings({ ...settings, autoOperatorTimeout: parseInt(e.target.value) || 30 })}
                className="bg-[#1a1a2e]/50 border-[#2a2a3e]"
              />
              <p className="text-xs text-[#555]">
                Через сколько секунд подключить оператора, если AI не может помочь
              </p>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="rounded-2xl border border-[#1a1a2e] bg-[#0a0a0f]/80 backdrop-blur-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <NetNextLogo size={20} />
              <h2 className="text-lg font-semibold">Настройки AI</h2>
            </div>
            <p className="text-sm text-[#888] mt-1">
              Поведение AI-ассистента
            </p>
          </div>
          
          <div className="p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2e]/30 border border-[#2a2a3e]">
              <div>
                <p className="font-medium">AI включен</p>
                <p className="text-sm text-[#888]">
                  Nexik будет автоматически отвечать на сообщения
                </p>
              </div>
              <Switch
                checked={settings.aiEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, aiEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a2e]/30 border border-[#2a2a3e]">
              <div>
                <p className="font-medium">Приветственное сообщение</p>
                <p className="text-sm text-[#888]">
                  Показывать приветствие при открытии чата
                </p>
              </div>
              <Switch
                checked={settings.welcomeEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, welcomeEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-[#888]">Системный промпт</Label>
              <Textarea
                rows={6}
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                className="bg-[#1a1a2e]/50 border-[#2a2a3e] resize-none"
              />
              <p className="text-xs text-[#555]">
                Инструкции для AI о том, как отвечать на вопросы. Этот текст не видят посетители.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-[#00ff88]">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Сохранено</span>
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90 gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  )
}
