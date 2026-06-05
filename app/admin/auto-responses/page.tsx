"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  
  Plus, 
  RefreshCw,
  MessageSquare,
  Edit,
  Trash2,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Tag,
  Folder,
  Hash,
  Code,
  Smile,
  HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"

interface AutoResponseRule {
  id: string
  name: string
  trigger_type: 'keywords' | 'pattern' | 'greeting' | 'fallback'
  trigger_keywords?: string[]
  trigger_pattern?: string
  response_text: string
  response_buttons: { label: string; action: string }[]
  priority: number
  enabled: boolean
  use_count: number
}

interface QuickReplyTemplate {
  id: string
  category: string
  title: string
  content: string
  shortcut?: string
  use_count: number
}

const triggerTypeConfig = {
  greeting: { label: 'Приветствие', icon: Smile, color: 'text-emerald-400 bg-emerald-500/10' },
  keywords: { label: 'Ключевые слова', icon: Hash, color: 'text-cyan-400 bg-cyan-500/10' },
  pattern: { label: 'RegEx паттерн', icon: Code, color: 'text-violet-400 bg-violet-500/10' },
  fallback: { label: 'Запасной ответ', icon: HelpCircle, color: 'text-amber-400 bg-amber-500/10' },
}

export default function AutoResponsesPage() {
  const [activeTab, setActiveTab] = useState<'rules' | 'templates'>('rules')
  const [rules, setRules] = useState<AutoResponseRule[]>([])
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingRule, setEditingRule] = useState<AutoResponseRule | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null)
  const [showNewRule, setShowNewRule] = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesResponse, templatesResponse] = await Promise.all([
        fetch('/api/admin/auto-responses?type=rules', {
          credentials: 'include',
        }),
        fetch('/api/admin/auto-responses?type=quick-replies', {
          credentials: 'include',
        }),
      ])

      if (rulesResponse.status === 401 || templatesResponse.status === 401) {
        toast.error("Сессия истекла. Войдите снова.")
        return
      }

      if (rulesResponse.ok) {
        const data = await rulesResponse.json()
        setRules(data.rules || [])
      }

      if (templatesResponse.ok) {
        const data = await templatesResponse.json()
        setTemplates(data.templates || [])
        setCategories(data.categories || [])
      }

      if (!rulesResponse.ok && !templatesResponse.ok) {
        toast.error("Не удалось загрузить данные автоответов")
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Ошибка соединения с сервером")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleRule = async (rule: AutoResponseRule) => {
    try {
      const res = await fetch(`/api/admin/auto-responses/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled: !rule.enabled }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setRules(rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      toast.success(rule.enabled ? "Правило отключено" : "Правило включено")
    } catch (error) {
      console.error('Error toggling rule:', error)
      toast.error(error instanceof Error ? error.message : "Не удалось изменить правило")
    }
  }

  const deleteRule = async (id: string) => {
    if (!confirm('Удалить правило?')) return

    try {
      const res = await fetch(`/api/admin/auto-responses/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setRules(rules.filter(r => r.id !== id))
      toast.success("Правило удалено")
    } catch (error) {
      console.error('Error deleting rule:', error)
      toast.error(error instanceof Error ? error.message : "Не удалось удалить правило")
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Удалить шаблон?')) return

    try {
      const res = await fetch(`/api/admin/auto-responses/${id}?type=quick-reply`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setTemplates(templates.filter(t => t.id !== id))
      toast.success("Шаблон удалён")
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error(error instanceof Error ? error.message : "Не удалось удалить шаблон")
    }
  }

  const saveRule = async (rule: Partial<AutoResponseRule>) => {
    try {
      const res = editingRule
        ? await fetch(`/api/admin/auto-responses/${editingRule.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(rule),
          })
        : await fetch('/api/admin/auto-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(rule),
          })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      toast.success(editingRule ? "Правило обновлено" : "Правило создано")
      setEditingRule(null)
      setShowNewRule(false)
      fetchData()
    } catch (error) {
      console.error('Error saving rule:', error)
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить правило")
    }
  }

  const saveTemplate = async (template: Partial<QuickReplyTemplate>) => {
    try {
      const res = editingTemplate
        ? await fetch(`/api/admin/auto-responses/${editingTemplate.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ...template, type: 'quick-reply' }),
          })
        : await fetch('/api/admin/auto-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ ...template, type: 'quick-reply' }),
          })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      toast.success(editingTemplate ? "Шаблон обновлён" : "Шаблон создан")
      setEditingTemplate(null)
      setShowNewTemplate(false)
      fetchData()
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error(error instanceof Error ? error.message : "Не удалось сохранить шаблон")
    }
  }

  const totalUseCount = rules.reduce((sum, r) => sum + r.use_count, 0)
  const enabledRules = rules.filter(r => r.enabled).length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Автоответы"
        description="Правила бота и шаблоны быстрых ответов"
        onRefresh={fetchData}
        loading={loading}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Всего правил" value={rules.length} icon={MessageSquare} color="primary" />
        <StatsCard title="Активных" value={enabledRules} icon={Power} color="green" />
        <StatsCard title="Срабатываний" value={totalUseCount} icon={MessageSquare} color="blue" />
        <StatsCard title="Шаблонов" value={templates.length} icon={Tag} color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-[#111] rounded-xl border border-[#1a1a1a] w-fit">
        <button
          onClick={() => setActiveTab('rules')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'rules'
              ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-[#888] hover:text-white"
          )}
        >
          <div className="w-2 h-2 rounded-full bg-current" />
          Правила бота
          <span className="px-1.5 py-0.5 bg-[#222] rounded text-xs">{rules.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
            activeTab === 'templates'
              ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30"
              : "text-[#888] hover:text-white"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Быстрые ответы
          <span className="px-1.5 py-0.5 bg-[#222] rounded text-xs">{templates.length}</span>
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <Button onClick={() => setShowNewRule(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить правило
          </Button>

          {(showNewRule || editingRule) && (
            <RuleForm
              rule={editingRule}
              onSave={saveRule}
              onCancel={() => { setShowNewRule(false); setEditingRule(null) }}
            />
          )}

          <div className="space-y-3">
            {rules.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center h-48 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl">
                <MessageSquare className="w-10 h-10 text-[#555] mb-3" />
                <p className="text-white font-medium">Нет правил</p>
                <p className="text-sm text-[#888]">Добавьте первое правило автоответа</p>
              </div>
            ) : (
              rules.map((rule) => {
                const triggerConfig = triggerTypeConfig[rule.trigger_type]
                const TriggerIcon = triggerConfig.icon

                return (
                  <div
                    key={rule.id}
                    className={cn(
                      "bg-[#0a0a0a]/50 border rounded-xl overflow-hidden transition-all",
                      rule.enabled ? "border-[#1a1a1a]" : "border-[#1a1a1a] opacity-60"
                    )}
                  >
                    <div 
                      className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#111]/50 transition-colors"
                      onClick={() => setExpandedRules(prev => {
                        const next = new Set(prev)
                        if (next.has(rule.id)) next.delete(rule.id)
                        else next.add(rule.id)
                        return next
                      })}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          rule.enabled ? "bg-emerald-400" : "bg-[#555]"
                        )} />
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-white">{rule.name}</span>
                            <span className={cn(
                              "flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium",
                              triggerConfig.color
                            )}>
                              <TriggerIcon className="w-3 h-3" />
                              {triggerConfig.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-[#888]">
                            <span>{rule.use_count} срабатываний</span>
                            <span className="text-[#555]">•</span>
                            <span>Приоритет: {rule.priority}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleRule(rule) }}
                          className={cn(
                            "p-2.5 rounded-xl transition-colors",
                            rule.enabled 
                              ? "text-emerald-400 hover:bg-emerald-500/10" 
                              : "text-[#555] hover:bg-[#222]"
                          )}
                        >
                          {rule.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingRule(rule) }}
                          className="p-2.5 rounded-xl text-[#888] hover:text-white hover:bg-[#222]"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteRule(rule.id) }}
                          className="p-2.5 rounded-xl text-[#888] hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {expandedRules.has(rule.id) ? (
                          <ChevronUp className="w-4 h-4 text-[#888]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#888]" />
                        )}
                      </div>
                    </div>

                    {expandedRules.has(rule.id) && (
                      <div className="px-5 pb-5 border-t border-[#1a1a1a] pt-4 space-y-4">
                        {rule.trigger_keywords && rule.trigger_keywords.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                              Ключевые слова
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {rule.trigger_keywords.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-[#111] border border-[#222] rounded-lg text-sm text-white">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {rule.trigger_pattern && (
                          <div>
                            <span className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                              Регулярное выражение
                            </span>
                            <code className="text-sm text-violet-400 bg-violet-500/10 px-3 py-1.5 rounded-lg font-mono">
                              {rule.trigger_pattern}
                            </code>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                            Ответ бота
                          </span>
                          <div className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 text-sm text-white whitespace-pre-wrap">
                            {rule.response_text}
                          </div>
                        </div>
                        {rule.response_buttons.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {rule.response_buttons.map((btn, i) => (
                              <span 
                                key={i} 
                                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium border border-cyan-500/30"
                              >
                                {btn.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <Button onClick={() => setShowNewTemplate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Добавить шаблон
          </Button>

          {(showNewTemplate || editingTemplate) && (
            <TemplateForm
              template={editingTemplate}
              categories={categories}
              onSave={saveTemplate}
              onCancel={() => { setShowNewTemplate(false); setEditingTemplate(null) }}
            />
          )}

          {templates.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-48 bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl">
              <MessageSquare className="w-10 h-10 text-[#555] mb-3" />
              <p className="text-white font-medium">Нет шаблонов</p>
              <p className="text-sm text-[#888]">Добавьте быстрые ответы для операторов</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-5 hover:border-[#333] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-white">{template.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg">
                          {template.category}
                        </span>
                        {template.shortcut && (
                          <span className="text-xs text-[#888] bg-[#222] px-2 py-0.5 rounded-lg font-mono">
                            /{template.shortcut}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-2 rounded-lg text-[#888] hover:text-white hover:bg-[#222]"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-2 rounded-lg text-[#888] hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#888] line-clamp-3 mb-3">{template.content}</p>
                  <div className="text-xs text-[#555]">
                    {template.use_count} использований
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule: AutoResponseRule | null
  onSave: (rule: Partial<AutoResponseRule>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    name: rule?.name || '',
    trigger_type: rule?.trigger_type || 'keywords' as const,
    trigger_keywords: rule?.trigger_keywords?.join(', ') || '',
    trigger_pattern: rule?.trigger_pattern || '',
    response_text: rule?.response_text || '',
    priority: rule?.priority || 0,
    enabled: rule?.enabled !== false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      name: form.name,
      trigger_type: form.trigger_type,
      trigger_keywords: form.trigger_keywords.split(',').map(k => k.trim()).filter(Boolean),
      trigger_pattern: form.trigger_pattern,
      response_text: form.response_text,
      priority: form.priority,
      enabled: form.enabled,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6 space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-white block mb-2">Название</label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            required
            placeholder="Например: Ответ на вопрос о ценах"
            className="bg-[#111] border-[#222]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white block mb-2">Тип триггера</label>
          <select
            value={form.trigger_type}
            onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value as any }))}
            className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-2.5 text-white"
          >
            <option value="greeting">Приветствие</option>
            <option value="keywords">Ключевые слова</option>
            <option value="pattern">Регулярное выражение</option>
            <option value="fallback">Запасной ответ</option>
          </select>
        </div>
      </div>

      {form.trigger_type === 'keywords' && (
        <div>
          <label className="text-sm font-medium text-white block mb-2">Ключевые слова</label>
          <Input
            value={form.trigger_keywords}
            onChange={e => setForm(f => ({ ...f, trigger_keywords: e.target.value }))}
            placeholder="цена, стоимость, сколько стоит (через запятую)"
            className="bg-[#111] border-[#222]"
          />
        </div>
      )}

      {form.trigger_type === 'pattern' && (
        <div>
          <label className="text-sm font-medium text-white block mb-2">Регулярное выражение</label>
          <Input
            value={form.trigger_pattern}
            onChange={e => setForm(f => ({ ...f, trigger_pattern: e.target.value }))}
            placeholder="(цен[аы]|стоимость|прайс)"
            className="bg-[#111] border-[#222] font-mono"
          />
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-white block mb-2">Ответ бота</label>
        <Textarea
          value={form.response_text}
          onChange={e => setForm(f => ({ ...f, response_text: e.target.value }))}
          required
          rows={4}
          placeholder="Текст ответа, который увидит пользователь..."
          className="bg-[#111] border-[#222]"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-white block mb-2">Приоритет</label>
          <Input
            type="number"
            value={form.priority}
            onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
            className="bg-[#111] border-[#222]"
          />
          <p className="text-xs text-[#555] mt-1">Чем выше число, тем выше приоритет</p>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              className="w-5 h-5 rounded border-[#333] bg-[#111] text-cyan-500"
            />
            <span className="text-sm text-white">Включено</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-[#888]">
          Отмена
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {rule ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}

function TemplateForm({
  template,
  categories,
  onSave,
  onCancel,
}: {
  template: QuickReplyTemplate | null
  categories: string[]
  onSave: (template: Partial<QuickReplyTemplate>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    category: template?.category || categories[0] || 'Общие',
    title: template?.title || '',
    content: template?.content || '',
    shortcut: template?.shortcut || '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-6 space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-white block mb-2">Название</label>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            required
            placeholder="Краткое название шаблона"
            className="bg-[#111] border-[#222]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white block mb-2">Категория</label>
          <Input
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            placeholder="Общие, Цены, Поддержка..."
            className="bg-[#111] border-[#222]"
            list="categories"
          />
          <datalist id="categories">
            {categories.map(c => <option key={c} value={c} />)}
          </datalist>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-white block mb-2">Текст шаблона</label>
        <Textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          required
          rows={4}
          placeholder="Полный текст ответа..."
          className="bg-[#111] border-[#222]"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-white block mb-2">Shortcut (опционально)</label>
        <Input
          value={form.shortcut}
          onChange={e => setForm(f => ({ ...f, shortcut: e.target.value }))}
          placeholder="price, help, contact..."
          className="bg-[#111] border-[#222] font-mono"
        />
        <p className="text-xs text-[#555] mt-1">Оператор может ввести /shortcut для быстрой вставки</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} className="text-[#888]">
          Отмена
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {template ? 'Сохранить' : 'Создать'}
        </Button>
      </div>
    </form>
  )
}
