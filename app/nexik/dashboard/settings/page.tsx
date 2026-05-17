"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Users, Save } from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifyEmail: "hello@netnext.site",
    notifyTelegram: true,
    autoOperator: true,
    autoOperatorTimeout: 30,
    welcomeEnabled: true,
    systemPrompt: "Ты AI-ассистент компании. Помогай посетителям с вопросами об услугах, ценах и сроках.",
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-0.5 bg-primary" />
          <span className="text-primary font-mono text-sm">{"// Конфигурация"}</span>
        </div>
        <h1 className="text-3xl font-bold">Настройки</h1>
        <p className="text-muted-foreground mt-1">
          Конфигурация AI-ассистента
        </p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Notifications */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Уведомления</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Настройте уведомления о новых чатах
            </p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Email для уведомлений</Label>
              <Input
                type="email"
                value={settings.notifyEmail}
                onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
                className="bg-secondary/30 border-border"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border">
              <div>
                <p className="font-medium">Telegram уведомления</p>
                <p className="text-sm text-muted-foreground">
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
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#ff00aa]" />
              <h2 className="text-lg font-semibold">Подключение оператора</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Настройки передачи чата живому оператору
            </p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border">
              <div>
                <p className="font-medium">Авто-подключение</p>
                <p className="text-sm text-muted-foreground">
                  Автоматически подключать оператора при сложных вопросах
                </p>
              </div>
              <Switch
                checked={settings.autoOperator}
                onCheckedChange={(checked) => setSettings({ ...settings, autoOperator: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Таймаут ожидания (секунды)</Label>
              <Input
                type="number"
                value={settings.autoOperatorTimeout}
                onChange={(e) => setSettings({ ...settings, autoOperatorTimeout: parseInt(e.target.value) || 30 })}
                className="bg-secondary/30 border-border"
              />
              <p className="text-xs text-muted-foreground">
                Через сколько секунд подключить оператора, если AI не может помочь
              </p>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <NetNextLogo size={20} />
              <h2 className="text-lg font-semibold">Настройки AI</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Поведение AI-ассистента
            </p>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border">
              <div>
                <p className="font-medium">Приветственное сообщение</p>
                <p className="text-sm text-muted-foreground">
                  Показывать приветствие при открытии чата
                </p>
              </div>
              <Switch
                checked={settings.welcomeEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, welcomeEnabled: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Системный промпт</Label>
              <Textarea
                rows={4}
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                className="bg-secondary/30 border-border resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Инструкции для AI о том, как отвечать на вопросы
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </div>
  )
}
