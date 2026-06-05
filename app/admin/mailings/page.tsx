"use client"

import { toast } from "sonner"
import { useState, useEffect, useCallback } from "react"
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Mail,
  Users,
  Upload,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  X,
  FileText,
  MoreVertical,
  Eye,
  Copy,
  RefreshCw,
  Edit3,
  Code,
  Smartphone,
  Monitor,
  ExternalLink,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"
import { EmailEditor } from "@/components/admin/email-editor"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  html_content?: string
  total_recipients: number
  sent_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
  created_at: string
}

export default function MailingsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRecipientsModal, setShowRecipientsModal] = useState<string | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/mailings", {
        credentials: 'include',
      })
      const data = await res.json()
      setCampaigns(data.campaigns || [])
    } catch (err) {
      console.error("Failed to fetch campaigns:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  const performAction = async (action: string, campaignId?: string, extraData?: Record<string, unknown>) => {
    setActionLoading(action + (campaignId || ""))
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ action, campaignId, ...extraData }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Действие не выполнено")
        return null
      }

      const data = await res.json()
      await fetchCampaigns()
      return data
    } catch (err) {
      console.error("Action failed:", err)
      return null
    } finally {
      setActionLoading(null)
      setActiveMenu(null)
    }
  }

  const loadCampaignDetails = async (campaignId: string) => {
    const res = await fetch("/api/admin/mailings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ action: "get_details", campaignId }),
    })
    
    if (res.ok) {
      const data = await res.json()
      setEditingCampaign(data.campaign)
    }
  }

  // Stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0)
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0)
  const totalFailed = campaigns.reduce((sum, c) => sum + c.failed_count, 0)
  const activeCampaigns = campaigns.filter(c => c.status === "sending").length

  return (
    <div className="space-y-8">
      <PageHeader
        title="Рассылки"
        description="Управление email кампаниями"
        onRefresh={fetchCampaigns}
        loading={loading}
        actions={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Новая рассылка
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Отправлено"
          value={totalSent}
          icon={Send}
          color="primary"
        />
        <StatsCard
          title="Открыто"
          value={totalOpened}
          icon={CheckCircle}
          color="green"
          subtitle={totalSent > 0 ? `${Math.round((totalOpened / totalSent) * 100)}% открытий` : undefined}
        />
        <StatsCard
          title="Ошибок"
          value={totalFailed}
          icon={XCircle}
          color="red"
        />
        <StatsCard
          title="Активных"
          value={activeCampaigns}
          icon={Mail}
          color="blue"
        />
      </div>

      {/* Campaigns List */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
        {loading && campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-[#888]">Загрузка рассылок...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-[#555]" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Нет рассылок</p>
            <p className="text-sm text-[#888] mb-4">Создайте первую рассылку</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Создать рассылку
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1a1a]">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                onAction={performAction}
                onAddRecipients={() => setShowRecipientsModal(campaign.id)}
                onEdit={() => loadCampaignDetails(campaign.id)}
                actionLoading={actionLoading}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchCampaigns()
          }}
        />
      )}

      {/* Recipients Modal */}
      {showRecipientsModal && (
        <RecipientsModal
          campaignId={showRecipientsModal}
          onClose={() => setShowRecipientsModal(null)}
          onSuccess={fetchCampaigns}
        />
      )}

      {/* Edit Campaign Modal */}
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSave={async (updates) => {
            await performAction("update", editingCampaign.id, updates)
            setEditingCampaign(null)
          }}
        />
      )}
    </div>
  )
}

function CampaignRow({
  campaign,
  onAction,
  onAddRecipients,
  onEdit,
  actionLoading,
  activeMenu,
  setActiveMenu,
}: {
  campaign: Campaign
  onAction: (action: string, id: string) => Promise<unknown>
  onAddRecipients: () => void
  onEdit: () => void
  actionLoading: string | null
  activeMenu: string | null
  setActiveMenu: (id: string | null) => void
}) {
  const progress = campaign.total_recipients > 0
    ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
    : 0

  const openRate = campaign.sent_count > 0
    ? Math.round((campaign.opened_count / campaign.sent_count) * 100)
    : 0

  return (
    <div className="p-5 hover:bg-[#111]/50 transition-colors">
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white truncate">{campaign.name}</h3>
            <CampaignStatus status={campaign.status} />
          </div>
          
          <p className="text-sm text-[#888] mb-4 truncate">{campaign.subject}</p>

          {/* Progress */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs text-[#888] mb-1">
                <span>Прогресс отправки</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-sm text-[#888]">
              {campaign.sent_count.toLocaleString()} / {campaign.total_recipients.toLocaleString()}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="text-[#888]">Открыто:</span>
              <span className="text-white font-medium">{campaign.opened_count}</span>
              <span className="text-[#555]">({openRate}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <span className="text-[#888]">Ошибок:</span>
              <span className="text-white font-medium">{campaign.failed_count}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#555]" />
              <span className="text-[#555]">
                {new Date(campaign.created_at).toLocaleDateString("ru-RU")}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {campaign.status === "draft" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="bg-transparent border-[#333] text-[#888] hover:text-white hover:bg-[#222]"
              >
                <Edit3 className="w-4 h-4 mr-1.5" />
                Редактировать
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddRecipients}
                className="bg-transparent border-[#333] text-[#888] hover:text-white hover:bg-[#222]"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Получатели
              </Button>
              <Button
                size="sm"
                onClick={() => onAction("start", campaign.id)}
                disabled={actionLoading === "start" + campaign.id || campaign.total_recipients === 0}
              >
                <Play className="w-4 h-4 mr-1.5" />
                Запустить
              </Button>
            </>
          )}
          {campaign.status === "sending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction("pause", campaign.id)}
              disabled={actionLoading === "pause" + campaign.id}
              className="bg-transparent border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            >
              <Pause className="w-4 h-4 mr-1.5" />
              Пауза
            </Button>
          )}
          {campaign.status === "paused" && (
            <Button
              size="sm"
              onClick={() => onAction("resume", campaign.id)}
              disabled={actionLoading === "resume" + campaign.id}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Продолжить
            </Button>
          )}
          {campaign.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="bg-transparent border-[#333] text-[#888] hover:text-white hover:bg-[#222]"
            >
              <Eye className="w-4 h-4 mr-1.5" />
              Просмотр
            </Button>
          )}

          {/* More menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMenu(activeMenu === campaign.id ? null : campaign.id)}
              className="text-[#888] hover:text-white"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>

            {activeMenu === campaign.id && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setActiveMenu(null)}
                />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#111] border border-[#222] rounded-xl shadow-xl z-20 py-2 overflow-hidden">
                  <button
                    onClick={() => { onEdit(); setActiveMenu(null) }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                  >
                    <Eye className="w-4 h-4" />
                    Просмотр / Редактировать
                  </button>
                  <button
                    onClick={() => { onAction("duplicate", campaign.id); setActiveMenu(null) }}
                    disabled={actionLoading === "duplicate" + campaign.id}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a] disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                    Дублировать
                  </button>
                  <div className="h-px bg-[#222] my-2" />
                  <button
                    onClick={() => {
                      if (confirm("Удалить рассылку?")) {
                        onAction("delete", campaign.id)
                      }
                    }}
                    disabled={actionLoading === "delete" + campaign.id}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CampaignStatus({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    draft: { label: "Черновик", className: "text-[#888] bg-[#222] border-[#333]" },
    scheduled: { label: "Запланировано", className: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    sending: { label: "Отправка", className: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    paused: { label: "Пауза", className: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
    completed: { label: "Завершено", className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    failed: { label: "Ошибка", className: "text-red-400 bg-red-500/10 border-red-500/20" },
  }

  const { label, className } = config[status] || config.draft

  return (
    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-medium border", className)}>
      {label}
    </span>
  )
}

// Edit Campaign Modal with Full HTML Editor
function EditCampaignModal({
  campaign,
  onClose,
  onSave,
}: {
  campaign: Campaign
  onClose: () => void
  onSave: (updates: { name?: string; subject?: string; htmlContent?: string }) => Promise<void>
}) {
  const [name, setName] = useState(campaign.name)
  const [subject, setSubject] = useState(campaign.subject)
  const [htmlContent, setHtmlContent] = useState(campaign.html_content || "")
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit")
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop")
  const [codeMode, setCodeMode] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ name, subject, htmlContent })
    } finally {
      setSaving(false)
    }
  }

  const canEdit = campaign.status === "draft"

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {canEdit ? "Редактирование письма" : "Просмотр письма"}
              </h2>
              <p className="text-sm text-[#888]">{campaign.name}</p>
            </div>
            <CampaignStatus status={campaign.status} />
          </div>
          
          <div className="flex items-center gap-2">
            {canEdit && (
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            )}
            <button 
              onClick={onClose} 
              className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#111] shrink-0">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("edit")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "edit" ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
              )}
            >
              <Edit3 className="w-4 h-4 inline mr-2" />
              {canEdit ? "Редактор" : "Содержимое"}
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === "preview" ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
              )}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              Предпросмотр
            </button>
          </div>

          {activeTab === "edit" && canEdit && (
            <div className="flex border border-[#333] rounded-lg overflow-hidden">
              <button
                onClick={() => setCodeMode(false)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  !codeMode ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
                )}
              >
                Визуальный
              </button>
              <button
                onClick={() => setCodeMode(true)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  codeMode ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
                )}
              >
                <Code className="w-3 h-3 inline mr-1" />
                HTML
              </button>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="flex border border-[#333] rounded-lg overflow-hidden">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  previewDevice === "desktop" ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
                )}
              >
                <Monitor className="w-3 h-3 inline mr-1" />
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors",
                  previewDevice === "mobile" ? "bg-[#222] text-white" : "text-[#888] hover:text-white"
                )}
              >
                <Smartphone className="w-3 h-3 inline mr-1" />
                Mobile
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "edit" ? (
            <div className="h-full flex flex-col">
              {/* Meta fields */}
              <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#1a1a1a]">
                <div>
                  <label className="text-xs text-[#888] block mb-1.5">Название кампании</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                    className="bg-[#111] border-[#222] h-10"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#888] block mb-1.5">Тема письма</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    disabled={!canEdit}
                    className="bg-[#111] border-[#222] h-10"
                  />
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 overflow-auto p-4">
                {canEdit ? (
                  codeMode ? (
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full h-full min-h-[400px] bg-[#111] border border-[#222] rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none"
                      placeholder="<html>...</html>"
                    />
                  ) : (
                    <EmailEditor value={htmlContent} onChange={setHtmlContent} />
                  )
                ) : (
                  <div className="bg-[#111] border border-[#222] rounded-xl p-4">
                    <pre className="text-sm text-[#888] whitespace-pre-wrap overflow-auto max-h-[500px]">
                      {htmlContent || "Нет содержимого"}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-4 bg-[#111]">
              <div 
                className={cn(
                  "bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300",
                  previewDevice === "desktop" ? "w-full max-w-3xl h-full" : "w-[375px] h-[667px]"
                )}
              >
                {/* Preview header */}
                <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-xs text-gray-600 font-medium">{subject || "Тема письма"}</div>
                    </div>
                  </div>
                </div>
                
                {/* Preview content */}
                <div className="h-[calc(100%-48px)] overflow-auto">
                  <iframe
                    srcDoc={htmlContent || "<p style='padding:20px;color:#888;'>Нет содержимого для предпросмотра</p>"}
                    className="w-full h-full border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats (for completed campaigns) */}
        {campaign.status !== "draft" && (
          <div className="p-4 border-t border-[#1a1a1a] bg-[#111] shrink-0">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{campaign.total_recipients}</div>
                <div className="text-xs text-[#888]">Получателей</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{campaign.sent_count}</div>
                <div className="text-xs text-[#888]">Отправлено</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">{campaign.opened_count}</div>
                <div className="text-xs text-[#888]">Открыто</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{campaign.failed_count}</div>
                <div className="text-xs text-[#888]">Ошибок</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateCampaignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [htmlContent, setHtmlContent] = useState("")

  const handleSubmit = async () => {
    if (!name || !subject || !htmlContent) {
      toast.error("Заполните все поля")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          action: "create",
          name,
          subject,
          htmlContent,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || "Не удалось создать рассылку")
      }
    } catch (err) {
      console.error("Create failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-semibold text-white">Новая рассылка</h2>
            <p className="text-sm text-[#888] mt-1">Шаг {step} из 2</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 px-6 py-3 bg-[#111]">
          <div className={cn(
            "flex-1 h-1 rounded-full transition-colors",
            step >= 1 ? "bg-cyan-500" : "bg-[#333]"
          )} />
          <div className={cn(
            "flex-1 h-1 rounded-full transition-colors",
            step >= 2 ? "bg-cyan-500" : "bg-[#333]"
          )} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Название кампании
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Новогодняя акция 2024"
                  className="bg-[#111] border-[#222] h-12"
                />
                <p className="text-xs text-[#555] mt-2">Внутреннее название для удобства управления</p>
              </div>

              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Тема письма
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Тема, которую увидит получатель"
                  className="bg-[#111] border-[#222] h-12"
                />
                <p className="text-xs text-[#555] mt-2">Отображается в почтовом клиенте получателя</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white block mb-2">
                  Содержимое письма
                </label>
                <EmailEditor
                  value={htmlContent}
                  onChange={setHtmlContent}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-[#1a1a1a] bg-[#111]">
          <Button 
            variant="ghost" 
            onClick={step === 1 ? onClose : () => setStep(1)}
            className="text-[#888]"
          >
            {step === 1 ? "Отмена" : "Назад"}
          </Button>
          
          {step === 1 ? (
            <Button 
              onClick={() => setStep(2)}
              disabled={!name || !subject}
            >
              Далее
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !htmlContent}
            >
              {loading ? "Создание..." : "Создать рассылку"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function RecipientsModal({
  campaignId,
  onClose,
  onSuccess,
}: {
  campaignId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [recipientsText, setRecipientsText] = useState("")
  const [importMethod, setImportMethod] = useState<'text' | 'file'>('text')

  const handleSubmit = async () => {
    const lines = recipientsText.trim().split("\n").filter(Boolean)
    const recipients = lines.map(line => {
      const parts = line.split(",").map(p => p.trim())
      return {
        email: parts[0],
        name: parts[1] || undefined,
        company: parts[2] || undefined,
      }
    }).filter(r => r.email && r.email.includes("@"))

    if (recipients.length === 0) {
      toast.error("Введите хотя бы один email")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/mailings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          action: "add_recipients",
          campaignId,
          recipients,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`Добавлено ${data.added} получателей`)
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || "Не удалось добавить получателей")
      }
    } catch (err) {
      console.error("Add recipients failed:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setRecipientsText(text)
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-semibold text-white">Добавить получателей</h2>
            <p className="text-sm text-[#888] mt-1">Импортируйте список email адресов</p>
          </div>
          <button onClick={onClose} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Import method tabs */}
          <div className="flex border border-[#222] rounded-xl overflow-hidden">
            <button
              onClick={() => setImportMethod('text')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                importMethod === 'text'
                  ? "bg-[#222] text-white"
                  : "text-[#888] hover:text-white"
              )}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Вставить текст
            </button>
            <button
              onClick={() => setImportMethod('file')}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                importMethod === 'file'
                  ? "bg-[#222] text-white"
                  : "text-[#888] hover:text-white"
              )}
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Загрузить файл
            </button>
          </div>

          {importMethod === 'file' && (
            <div className="border-2 border-dashed border-[#333] rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-[#555] mx-auto mb-3" />
                <p className="text-white font-medium">Нажмите для выбора файла</p>
                <p className="text-sm text-[#555] mt-1">CSV или TXT формат</p>
              </label>
            </div>
          )}

          <textarea
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="email@example.com, Имя, Компания&#10;email2@example.com, Имя 2&#10;email3@example.com"
            rows={10}
            className="w-full bg-[#111] border border-[#222] rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 resize-none placeholder:text-[#444]"
          />
          
          <p className="text-xs text-[#555]">
            Формат: email, имя (опционально), компания (опционально). Каждый получатель с новой строки.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#1a1a1a] bg-[#111]">
          <Button variant="ghost" onClick={onClose} className="text-[#888]">
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !recipientsText.trim()}>
            {loading ? "Добавление..." : "Добавить получателей"}
          </Button>
        </div>
      </div>
    </div>
  )
}
