"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  LogOut,
  Menu,
  X,
  Loader2,
  GraduationCap,
  Sparkles,
  Send
} from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

interface User {
  id: string
  email: string
  name: string
  role: string
  org_id: string
  org_name: string
}

const navItems = [
  { href: "/nexik/dashboard", label: "Главная", icon: LayoutDashboard, exact: true },
  { href: "/nexik/dashboard/chats", label: "Диалоги", icon: MessageSquare },
  { href: "/nexik/dashboard/train", label: "Обучение AI", icon: GraduationCap },
  { href: "/nexik/dashboard/settings", label: "Настройки", icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  async function checkSession() {
    try {
      const res = await fetch("/api/nexik/auth/session")
      if (res.ok) {
        const data = await res.json()
        if (data.session?.member) {
          setUser({
            id: data.session.member.id,
            email: data.session.member.email,
            name: data.session.member.name,
            role: data.session.member.role,
            org_id: data.session.org.id,
            org_name: data.session.org.name
          })
        } else {
          router.replace("/nexik/login")
        }
      } else {
        router.replace("/nexik/login")
      }
    } catch {
      router.replace("/nexik/login")
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/nexik/auth/logout", { method: "POST" })
    router.replace("/nexik/login")
  }

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <SiriOrb size={64} state="thinking" />
          <p className="text-white/50 text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b border-white/10 px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center justify-between">
          <Link href="/nexik/dashboard" className="flex items-center gap-2">
            <SiriOrb size={32} state="idle" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
              Nexik
            </span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 pt-16"
            style={{
              background: "rgba(0,0,0,0.95)",
              backdropFilter: "blur(20px)",
            }}
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active 
                          ? "bg-gradient-to-r from-cyan-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30" 
                          : "text-white/70 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navItems.length * 0.05 }}
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Выйти</span>
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 flex-col border-r border-white/10"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(9,9,11,0.98) 100%)",
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/nexik/dashboard" className="flex items-center gap-3">
            <SiriOrb size={40} state="idle" />
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Nexik
              </span>
              <p className="text-xs text-white/40 truncate max-w-[140px]">{user.org_name}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  active 
                    ? "text-cyan-400" 
                    : "text-white/60 hover:text-white"
                }`}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(34,211,238,0.15) 0%, rgba(34,211,238,0.05) 100%)",
                      border: "1px solid rgba(34,211,238,0.3)",
                    }}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Hover state */}
                <div className={`absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity ${active ? 'hidden' : ''}`} />
                
                <Icon className={`relative w-5 h-5 transition-colors ${active ? 'text-cyan-400' : 'group-hover:text-white'}`} />
                <span className="relative font-medium">{item.label}</span>
                
                {/* Glow effect for active item */}
                {active && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-cyan-400 blur-sm" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Widget install section */}
        <div className="p-4 mx-4 mb-4 rounded-xl border border-cyan-500/20"
          style={{
            background: "linear-gradient(135deg, rgba(34,211,238,0.08) 0%, rgba(34,211,238,0.02) 100%)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">Установить виджет</span>
          </div>
          <p className="text-xs text-white/50 mb-3">
            Добавьте AI-ассистента на ваш сайт
          </p>
          <Link 
            href="/nexik/dashboard/settings?tab=widget"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-colors"
          >
            <Send className="w-4 h-4" />
            Получить код
          </Link>
        </div>

        {/* User section */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
              <span className="text-sm font-medium text-white">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{user.name || "User"}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
