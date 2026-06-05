"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { 
  UserCheck, 
  Search, 
  RefreshCw,
  Phone,
  Mail,
  Building,
  Clock,
  MoreVertical,
  MessageSquare,
  CheckCircle,
  XCircle,
  Circle,
  Loader,
  ExternalLink,
  Copy,
  Trash2,
  Edit3,
  X,
  Filter,
  Plus,
  Tag
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/admin/page-header"
import { StatsCard } from "@/components/admin/stats-card"

interface Lead {
  id: string
  company_name: string
  phone: string
  email: string
  description?: string
  niche?: string
  status: 'new' | 'in_progress' | 'completed' | 'rejected'
  source: string
  created_at: string
  chat_session_id?: string
  notes?: string
}

interface LeadStats {
  total: number
  new: number
  inProgress: number
  completed: number
  rejected: number
  todayCount: number
  weekCount: number
}

const statusConfig = {
  new: { 
    label: 'Новый', 
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', 
    icon: Circle,
    dotColor: 'bg-blue-400'
  },
  in_progress: { 
    label: 'В работе', 
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', 
    icon: Loader,
    dotColor: 'bg-amber-400 animate-pulse'
  },
  completed: { 
    label: 'Завершён', 
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', 
    icon: CheckCircle,
    dotColor: 'bg-emerald-400'
  },
  rejected: { 
    label: 'Отклонён', 
    color: 'bg-red-500/20 text-red-400 border-red-500/30', 
    icon: XCircle,
    dotColor: 'bg-red-400'
  },
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })

      if (filters.status !== 'all') {
        params.set('status', filters.status)
      }
      if (filters.source !== 'all') {
        params.set('source', filters.source)
      }
      if (filters.search) {
        params.set('search', filters.search)
      }

      const response = await fetch(`/api/admin/leads?${params}`, {
        credentials: 'include',
      })

      if (response.status === 401) {
        toast.error('Сессия истекла. Войдите снова.')
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setLeads(Array.isArray(data.leads) ? data.leads : [])
      setTotalPages(data.pagination?.pages ?? 1)
    } catch (error) {
      console.error('Error fetching leads:', error)
      toast.error('Не удалось загрузить лиды')
      setLeads([])
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/leads?stats=true', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    fetchStats()
  }, [fetchLeads, fetchStats])

  const updateStatus = async (leadId: string, status: string) => {
    setUpdatingStatus(leadId)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setLeads(leads.map(l => l.id === leadId ? { ...l, status: status as Lead['status'] } : l))
      fetchStats()
      toast.success(`Статус изменён: ${statusConfig[status as Lead['status']]?.label ?? status}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Не удалось обновить статус')
    } finally {
      setUpdatingStatus(null)
      setActiveMenu(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / 86400000)

    if (days === 0) {
      return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Вчера'
    } else if (days < 7) {
      return `${days} дн. назад`
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Скопировано')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  const hasActiveFilters = filters.status !== 'all' || filters.source !== 'all' || filters.search

  return (
    <div className="space-y-8">
      <PageHeader
        title="Лиды"
        description="Управление заявками клиентов"
        onRefresh={() => { fetchLeads(); fetchStats() }}
        loading={loading}
      />

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <StatsCard title="Всего" value={stats.total} icon={UserCheck} color="primary" />
          <StatsCard title="Новых" value={stats.new} icon={Circle} color="blue" />
          <StatsCard title="В работе" value={stats.inProgress} icon={Loader} color="yellow" />
          <StatsCard title="Завершено" value={stats.completed} icon={CheckCircle} color="green" />
          <StatsCard title="Отклонено" value={stats.rejected} icon={XCircle} color="red" />
          <StatsCard title="Сегодня" value={stats.todayCount} icon={Clock} color="purple" />
          <StatsCard title="За неделю" value={stats.weekCount} icon={Tag} color="orange" />
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              placeholder="Поиск по компании, email, телефону..."
              value={filters.search}
              onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
              className="w-full bg-[#111] border border-[#222] rounded-xl pl-11 pr-4 py-3 text-white placeholder:text-[#555] focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>

          {/* Quick Status Filters */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'new', 'in_progress', 'completed', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => { setFilters(f => ({ ...f, status })); setPage(1) }}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  filters.status === status
                    ? status === 'all' 
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      : statusConfig[status]?.color + " border"
                    : "bg-[#111] border border-[#222] text-[#888] hover:text-white hover:border-[#333]"
                )}
              >
                {status === 'all' ? 'Все' : statusConfig[status]?.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ status: 'all', source: 'all', search: '' })
                setPage(1)
              }}
              className="text-[#888] hover:text-white"
            >
              <X className="w-4 h-4 mr-2" />
              Сбросить
            </Button>
          )}
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-[#0a0a0a]/50 border border-[#1a1a1a] rounded-xl overflow-hidden">
        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
            <p className="text-[#888]">Загрузка лидов...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 bg-[#111] rounded-2xl flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-[#555]" />
            </div>
            <p className="text-lg font-medium text-white mb-1">Нет лидов</p>
            <p className="text-sm text-[#888]">
              {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Лиды появятся после заполнения формы на сайте'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Компания</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Контакты</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Ниша</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Статус</th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Дата</th>
                  <th className="text-right px-5 py-4 text-xs font-semibold text-[#888] uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a1a]">
                {leads.map((lead) => {
                  const status = statusConfig[lead.status]
                  const StatusIcon = status.icon
                  
                  return (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-[#111]/50 transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/10">
                            <Building className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div>
                            <div className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                              {lead.company_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#555]">
                              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded-lg">{lead.source}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <button 
                            onClick={() => copyToClipboard(lead.phone)}
                            className="flex items-center gap-2 text-sm text-white hover:text-cyan-400 transition-colors group/copy"
                          >
                            <Phone className="w-3.5 h-3.5 text-[#555] group-hover/copy:text-cyan-400" />
                            {lead.phone}
                            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(lead.email)}
                            className="flex items-center gap-2 text-sm text-[#888] hover:text-cyan-400 transition-colors group/copy"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#555] group-hover/copy:text-cyan-400" />
                            <span className="truncate max-w-[180px]">{lead.email}</span>
                            <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-white">
                          {lead.niche || <span className="text-[#555]">Не указано</span>}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border",
                          status.color
                        )}>
                          <span className={cn("w-2 h-2 rounded-full", status.dotColor)} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#888]">
                          <Clock className="w-3.5 h-3.5 text-[#555]" />
                          {formatDate(lead.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {lead.chat_session_id && (
                            <Link
                              href={`/admin/chats/${lead.chat_session_id}`}
                              className="p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#888] hover:text-cyan-400"
                              title="Перейти к чату"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Link>
                          )}
                          
                          {/* Status Menu */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                              className="p-2.5 hover:bg-[#1a1a1a] rounded-xl transition-colors text-[#888] hover:text-white"
                            >
                              {updatingStatus === lead.id ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreVertical className="w-4 h-4" />
                              )}
                            </button>

                            {activeMenu === lead.id && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setActiveMenu(null)} 
                                />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-[#222] rounded-xl shadow-2xl z-20 py-2 overflow-hidden">
                                  <div className="px-3 py-2 text-xs font-medium text-[#555] uppercase tracking-wider">
                                    Изменить статус
                                  </div>
                                  {(['new', 'in_progress', 'completed', 'rejected'] as const).map((s) => (
                                    <button
                                      key={s}
                                      onClick={() => updateStatus(lead.id, s)}
                                      className={cn(
                                        "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left hover:bg-[#1a1a1a] transition-colors",
                                        lead.status === s ? "text-cyan-400" : "text-[#888] hover:text-white"
                                      )}
                                    >
                                      <span className={cn("w-2 h-2 rounded-full", statusConfig[s].dotColor)} />
                                      {statusConfig[s].label}
                                      {lead.status === s && (
                                        <CheckCircle className="w-4 h-4 ml-auto" />
                                      )}
                                    </button>
                                  ))}
                                  <div className="h-px bg-[#222] my-2" />
                                  <button
                                    onClick={() => setSelectedLead(lead)}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                    Подробнее
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#1a1a1a]">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[#888] hover:text-white"
            >
              Назад
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                      page === pageNum
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "text-[#888] hover:text-white hover:bg-[#1a1a1a]"
                    )}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[#888] hover:text-white"
            >
              Далее
            </Button>
          </div>
        )}
      </div>

      {/* Lead Details Modal */}
      {selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updatedLead) => {
            setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l))
            setSelectedLead(null)
          }}
        />
      )}
    </div>
  )
}

function LeadDetailsModal({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead
  onClose: () => void
  onUpdate: (lead: Lead) => void
}) {
  const status = statusConfig[lead.status]

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center border border-cyan-500/10">
              <Building className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{lead.company_name}</h2>
              <span className={cn(
                "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-medium border mt-1",
                status.color
              )}>
                <span className={cn("w-2 h-2 rounded-full", status.dotColor)} />
                {status.label}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
              <div className="flex items-center gap-2 text-[#888] mb-2">
                <Phone className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Телефон</span>
              </div>
              <a 
                href={`tel:${lead.phone}`} 
                className="text-white hover:text-cyan-400 transition-colors font-medium"
              >
                {lead.phone}
              </a>
            </div>
            <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
              <div className="flex items-center gap-2 text-[#888] mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Email</span>
              </div>
              <a 
                href={`mailto:${lead.email}`}
                className="text-white hover:text-cyan-400 transition-colors font-medium break-all"
              >
                {lead.email}
              </a>
            </div>
          </div>

          {/* Niche */}
          {lead.niche && (
            <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
              <div className="flex items-center gap-2 text-[#888] mb-2">
                <Tag className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Ниша</span>
              </div>
              <p className="text-white">{lead.niche}</p>
            </div>
          )}

          {/* Description */}
          {lead.description && (
            <div className="bg-[#111] rounded-xl p-4 border border-[#1a1a1a]">
              <div className="flex items-center gap-2 text-[#888] mb-2">
                <Edit3 className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider">Описание</span>
              </div>
              <p className="text-white whitespace-pre-wrap">{lead.description}</p>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between text-sm text-[#555]">
            <span>Источник: {lead.source}</span>
            <span>
              {new Date(lead.created_at).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-[#1a1a1a] bg-[#111]">
          {lead.chat_session_id && (
            <Link href={`/admin/chats/${lead.chat_session_id}`}>
              <Button variant="outline" className="border-[#333]">
                <MessageSquare className="w-4 h-4 mr-2" />
                Открыть чат
              </Button>
            </Link>
          )}
          <Button variant="ghost" onClick={onClose} className="ml-auto">
            Закрыть
          </Button>
        </div>
      </div>
    </div>
  )
}
