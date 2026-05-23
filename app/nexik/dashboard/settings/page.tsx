"use client"

import { useState } from "react"
import { Save, Loader2 } from "lucide-react"

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    botName: "Nexik",
    greeting: "Привет! Чем могу помочь?",
    tone: "friendly" as "friendly" | "professional" | "casual"
  })

  async function handleSave() {
    setSaving(true)
    // TODO: Save to API
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Настройки</h1>
        <p className="text-white/50 mt-1">Настройте поведение AI-ассистента</p>
      </div>

      {/* Settings form */}
      <div className="space-y-6">
        {/* Bot name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Имя бота</label>
          <input
            type="text"
            value={settings.botName}
            onChange={(e) => setSettings(s => ({ ...s, botName: e.target.value }))}
            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        {/* Greeting */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Приветствие</label>
          <textarea
            value={settings.greeting}
            onChange={(e) => setSettings(s => ({ ...s, greeting: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>

        {/* Tone */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Стиль общения</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "friendly", label: "Дружелюбный" },
              { value: "professional", label: "Деловой" },
              { value: "casual", label: "Расслабленный" }
            ].map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSettings(s => ({ ...s, tone: tone.value as typeof s.tone }))}
                className={`px-4 py-3 rounded-xl border transition-all ${
                  settings.tone === tone.value
                    ? "bg-white text-black border-white"
                    : "bg-zinc-900 border-white/10 hover:border-white/30"
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          Сохранить
        </button>
      </div>
    </div>
  )
}
