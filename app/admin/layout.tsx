"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Mail,
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  MessageSquare,
  UserCheck,
  BarChart3,
  Bell,
  Search,
  Command,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAdminNotifications } from "@/hooks/use-admin-notifications"

const navigation = [
  { 
    name: "Dashboard", 
    href: "/admin", 
    icon: LayoutDashboard,
    description: "Обзор системы"
  },
  { 
    name: "Чаты", 
    href: "/admin/chats", 
    icon: MessageSquare,
    description: "История диалогов",
    badge: "newMessages"
  },
  { 
    name: "Лиды", 
    href: "/admin/leads", 
    icon: UserCheck,
    description: "Заявки клиентов",
    badge: "newLeads"
  },
  { 
    name: "Рассылки", 
    href: "/admin/mailings", 
    icon: Mail,
    description: "Email кампании"
  },
  { 
    name: "Автоответы", 
    href: "/admin/auto-responses", 
    icon: MessageSquare,
    description: "Правила бота"
  },
  { 
    name: "Аналитика", 
    href: "/admin/analytics", 
    icon: BarChart3,
    description: "Статистика"
  },
]

const bottomNav = [
  { 
    name: "Настройки", 
    href: "/admin/settings", 
    icon: Settings,
    description: "Конфигурация"
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [token, setToken] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const { counts, totalCount } = useAdminNotifications(15000)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/admin/auth/session", {
          credentials: 'include',
        })
        const data = await res.json()
        setIsAuthenticated(data.authenticated === true)
      } catch {
        setIsAuthenticated(false)
      }
    }

    checkSession()
  }, [])

  const handleLogin = async () => {
    if (!token.trim()) return

    setIsLoading(true)
    setLoginError("")

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
        credentials: 'include',
      })
      const data = await res.json()

      if (data.success) {
        setIsAuthenticated(true)
      } else {
        setLoginError(data.error || "Неверный токен")
      }
    } catch {
      setLoginError("Ошибка подключения к серверу")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: 'include',
      })
    } catch {
      // Logout anyway on error
    }
    setIsAuthenticated(false)
    setToken("")
  }

  const getBadgeCount = (badge?: string) => {
    if (!badge) return 0
    if (badge === 'newMessages') return counts.newMessages
    if (badge === 'newLeads') return counts.newLeads
    return 0
  }

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-b-cyan-500/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    )
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.02]" />
        
        <div className="relative w-full max-w-sm">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-teal-500/20 rounded-2xl blur-xl" />
          
          <div className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8">
            <div className="text-center mb-8">
              {/* Logo */}
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl rotate-6 opacity-50" />
                <div className="relative w-full h-full bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">N</span>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-white">NetNext Admin</h1>
              <p className="text-sm text-[#888] mt-2">Система управления</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-[#888] uppercase tracking-wider block mb-2">
                  Токен доступа
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="Введите токен"
                  disabled={isLoading}
                  className="w-full bg-[#111] border border-[#222] rounded-xl px-4 py-3.5 text-white placeholder:text-[#444] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 disabled:opacity-50 transition-all"
                />
              </div>
              
              {loginError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <p className="text-sm text-red-400">{loginError}</p>
                </div>
              )}
              
              <Button 
                onClick={handleLogin} 
                className="w-full h-12 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-medium rounded-xl transition-all" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Проверка...
                  </div>
                ) : (
                  "Войти в систему"
                )}
              </Button>
            </div>


          </div>
        </div>
      </div>
    )
  }

  // Authenticated layout
  return (
    <div className="min-h-screen bg-[#000]">
      {/* Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-950/30 via-transparent to-transparent pointer-events-none" />
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-[#1a1a1a] transform transition-all duration-300",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "lg:w-20" : "lg:w-64",
        "w-64"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#1a1a1a]">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-white hidden lg:block">NetNext</span>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-[#888] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const badgeCount = getBadgeCount(item.badge as string)
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-white border border-cyan-500/20"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-cyan-400" : "text-[#666] group-hover:text-[#888]"
                )} />
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-[#555] truncate">{item.description}</div>
                    </div>
                    {badgeCount > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {badgeCount}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div className="p-3 border-t border-[#1a1a1a] space-y-1">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  isActive
                    ? "bg-[#111] text-white"
                    : "text-[#888] hover:text-white hover:bg-[#111]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Выйти</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
      )}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-[#000]/80 backdrop-blur-xl border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-[#888] hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* Breadcrumb */}
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <Link href="/admin" className="text-[#888] hover:text-white transition-colors">
                  Admin
                </Link>
                {pathname !== '/admin' && (
                  <>
                    <ChevronRight className="w-4 h-4 text-[#444]" />
                    <span className="text-white font-medium">
                      {navigation.find(n => n.href === pathname)?.name || 
                       bottomNav.find(n => n.href === pathname)?.name ||
                       pathname.split('/').pop()}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#222] rounded-xl text-sm text-[#888] hover:text-white hover:border-[#333] transition-all"
              >
                <Search className="w-4 h-4" />
                <span>Поиск</span>
                <kbd className="ml-2 px-2 py-0.5 bg-[#222] rounded text-xs text-[#666]">
                  <Command className="w-3 h-3 inline mr-0.5" />K
                </kbd>
              </button>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-[#111] rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-[#888]" />
                {totalCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* Date */}
              <div className="hidden md:block text-sm text-[#888]">
                {new Date().toLocaleDateString("ru-RU", { 
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-[#111] border border-[#222] rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 border-b border-[#222]">
              <Search className="w-5 h-5 text-[#888]" />
              <input
                type="text"
                placeholder="Поиск по админке..."
                autoFocus
                className="flex-1 bg-transparent py-4 text-white placeholder:text-[#555] focus:outline-none"
              />
              <kbd className="px-2 py-1 bg-[#222] rounded text-xs text-[#666]">ESC</kbd>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto">
              {[...navigation, ...bottomNav].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium text-white">{item.name}</div>
                    <div className="text-xs text-[#555]">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
