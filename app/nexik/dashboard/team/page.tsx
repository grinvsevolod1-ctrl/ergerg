"use client"

import { useState, useEffect } from "react"
import { useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Users, 
  UserPlus, 
  Shield, 
  ShieldCheck, 
  Headphones, 
  User,
  MoreVertical,
  Trash2,
  Mail,
  Copy,
  Check,
  Loader2,
  Crown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TeamMember {
  id: string
  email: string
  name: string | null
  role: 'owner' | 'admin' | 'operator' | 'member'
  avatar_url: string | null
  email_verified: boolean
  last_login_at: string | null
  created_at: string
}

const roleConfig = {
  owner: { label: 'Владелец', icon: Crown, color: 'text-yellow-500' },
  admin: { label: 'Администратор', icon: ShieldCheck, color: 'text-purple-500' },
  operator: { label: 'Оператор', icon: Headphones, color: 'text-blue-500' },
  member: { label: 'Участник', icon: User, color: 'text-gray-500' }
}

export default function TeamPage() {
  const { session } = useNexikAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'operator' })
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadTeam()
  }, [])

  const loadTeam = async () => {
    try {
      const res = await fetch('/api/nexik/dashboard/team')
      const data = await res.json()
      
      if (data.success) {
        setMembers(data.members)
        setCurrentUserId(data.currentUserId)
      }
    } catch (error) {
      console.error('Failed to load team:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!newMember.email) return
    
    setInviting(true)
    try {
      const res = await fetch('/api/nexik/dashboard/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setInviteResult({ email: newMember.email, tempPassword: data.tempPassword })
        setNewMember({ email: '', name: '', role: 'operator' })
        loadTeam()
      } else {
        alert(data.error || 'Failed to invite')
      }
    } catch (error) {
      console.error('Invite error:', error)
      alert('Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleChangeRole = async (memberId: string, role: string) => {
    try {
      const res = await fetch('/api/nexik/dashboard/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role })
      })
      
      if (res.ok) {
        loadTeam()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Change role error:', error)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Удалить этого участника из команды?')) return
    
    try {
      const res = await fetch(`/api/nexik/dashboard/team?memberId=${memberId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        loadTeam()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to remove')
      }
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  const copyCredentials = () => {
    if (!inviteResult) return
    navigator.clipboard.writeText(`Email: ${inviteResult.email}\nПароль: ${inviteResult.tempPassword}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canManageTeam = session?.member?.role === 'owner' || session?.member?.role === 'admin'
  const isOwner = session?.member?.role === 'owner'

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48 bg-white/10 mb-4" />
        <Skeleton className="h-4 w-64 bg-white/10 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-[#00ffff]" />
            Команда
          </h1>
          <p className="text-[#888] mt-1">
            {members.length} {members.length === 1 ? 'участник' : 'участников'}
          </p>
        </div>
        
        {canManageTeam && (
          <Button 
            onClick={() => setInviteDialogOpen(true)}
            className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Пригласить
          </Button>
        )}
      </div>

      {/* Team list */}
      <div className="space-y-3">
        {members.map(member => {
          const roleInfo = roleConfig[member.role]
          const RoleIcon = roleInfo.icon
          const isCurrentUser = member.id === currentUserId
          const canEdit = isOwner && member.role !== 'owner'
          const canDelete = canManageTeam && member.role !== 'owner' && !isCurrentUser
          
          return (
            <div 
              key={member.id}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                isCurrentUser 
                  ? "bg-[#00ffff]/5 border-[#00ffff]/20" 
                  : "bg-[#0a0a0f]/50 border-white/5 hover:border-white/10"
              )}
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00ffff] to-[#ff00aa] flex items-center justify-center text-sm font-bold shrink-0">
                {member.name 
                  ? member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                  : member.email[0].toUpperCase()
                }
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">
                    {member.name || member.email.split('@')[0]}
                  </p>
                  {isCurrentUser && (
                    <span className="text-xs text-[#00ffff] bg-[#00ffff]/10 px-2 py-0.5 rounded">
                      Вы
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#888] truncate">{member.email}</p>
              </div>

              {/* Role badge */}
              <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5", roleInfo.color)}>
                <RoleIcon className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">{roleInfo.label}</span>
              </div>

              {/* Actions */}
              {(canEdit || canDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0a0a0f] border-white/10">
                    {canEdit && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(member.id, 'admin')}
                          disabled={member.role === 'admin'}
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Сделать админом
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(member.id, 'operator')}
                          disabled={member.role === 'operator'}
                        >
                          <Headphones className="w-4 h-4 mr-2" />
                          Сделать оператором
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(member.id, 'member')}
                          disabled={member.role === 'member'}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Сделать участником
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                      </>
                    )}
                    {canDelete && (
                      <DropdownMenuItem 
                        onClick={() => handleRemove(member.id)}
                        className="text-red-400 focus:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Удалить
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-[#0a0a0f] border-white/10">
          <DialogHeader>
            <DialogTitle>Пригласить в команду</DialogTitle>
            <DialogDescription>
              Новый участник получит временный пароль для входа
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-green-400 font-medium mb-2">Участник приглашен!</p>
                <p className="text-sm text-[#888]">Отправьте эти данные для входа:</p>
              </div>
              
              <div className="p-4 rounded-xl bg-[#1a1a2e] space-y-2">
                <p className="text-sm"><span className="text-[#888]">Email:</span> {inviteResult.email}</p>
                <p className="text-sm"><span className="text-[#888]">Пароль:</span> {inviteResult.tempPassword}</p>
              </div>

              <Button onClick={copyCredentials} variant="outline" className="w-full">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Скопировано' : 'Копировать'}
              </Button>

              <Button 
                onClick={() => {
                  setInviteResult(null)
                  setInviteDialogOpen(false)
                }}
                className="w-full bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
              >
                Готово
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newMember.email}
                    onChange={e => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-[#1a1a2e] border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Имя (опционально)</Label>
                  <Input
                    placeholder="Иван Иванов"
                    value={newMember.name}
                    onChange={e => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-[#1a1a2e] border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Роль</Label>
                  <Select 
                    value={newMember.role} 
                    onValueChange={value => setNewMember(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger className="bg-[#1a1a2e] border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10">
                      <SelectItem value="admin">
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-purple-500" />
                          Администратор
                        </span>
                      </SelectItem>
                      <SelectItem value="operator">
                        <span className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-blue-500" />
                          Оператор
                        </span>
                      </SelectItem>
                      <SelectItem value="member">
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          Участник
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setInviteDialogOpen(false)}
                  className="border-white/10"
                >
                  Отмена
                </Button>
                <Button 
                  onClick={handleInvite}
                  disabled={!newMember.email || inviting}
                  className="bg-[#00ffff] text-black hover:bg-[#00ffff]/90"
                >
                  {inviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                  Пригласить
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
