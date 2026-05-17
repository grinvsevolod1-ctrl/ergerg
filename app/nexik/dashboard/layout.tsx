"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Code,
  Clock,
  HelpCircle,
  Plug,
  Key,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  BarChart3,
  Users
} from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"
import { NexikAuthProvider, useNexikAuth } from "@/lib/nexik/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const navItems = [
  { href: "/nexik/dashboard", icon: LayoutDashboard, label: "Обзор", exact: true },
  { href: "/nexik/dashboard/chats", icon: MessageSquare, label: "Диалоги" },
  { href: "/nexik/dashboard/knowledge", icon: BookOpen, label: "База знаний" },
  { href: "/nexik/dashboard/analytics", icon: BarChart3, label: "Аналитика" },
  { href: "/nexik/dashboard/schedule", icon: Clock, label: "Расписание" },
  { href: "/nexik/dashboard/team", icon: Users, label: "Команда" },
  { href: "/nexik/dashboard/integration", icon: Plug, label: "Интеграция" },
  { href: "/nexik/dashboard/widget", icon: Code, label: "Виджет" },
  { href: "/nexik/dashboard/api-keys", icon: Key, label: "API ключи" },
  { href: "/nexik/dashboard/settings", icon: Settings, label: "Настройки" },
]

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { session, isLoading, logout } = useNexikAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active = isActive(item)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active 
                  ? "bg-[#00ffff]/10 text-[#00ffff] border border-[#00ffff]/20" 
                  : "text-[#888] hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("w-5 h-5", active && "text-[#00ffff]")} />
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  const AIStatus = () => {
    const aiEnabled = session?.org?.ai_enabled ?? true
    
    return (
      <div className={cn(
        "px-4 py-3 mx-4 mt-4 rounded-xl border",
        aiEnabled 
          ? "bg-[#00ff88]/10 border-[#00ff88]/20" 
          : "bg-[#ffaa00]/10 border-[#ffaa00]/20"
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            aiEnabled ? "bg-[#00ff88] animate-pulse" : "bg-[#ffaa00]"
          )} />
          <span className={cn(
            "text-xs font-medium",
            aiEnabled ? "text-[#00ff88]" : "text-[#ffaa00]"
          )}>
            {aiEnabled ? "AI работает" : "AI отключен"}
          </span>
        </div>
        <p className="text-[10px] text-[#888] mt-1">
          {aiEnabled ? "Отвечает на сообщения 24/7" : "Только операторы отвечают"}
        </p>
      </div>
    )
  }

  const UserSection = () => {
    if (isLoading) {
      return (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 bg-white/10 mb-1" />
              <Skeleton className="h-3 w-32 bg-white/10" />
            </div>
          </div>
        </div>
      )
    }

    if (!session) return null

    const initials = session.member.name 
      ? session.member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : session.member.email[0].toUpperCase()

    return (
      <div className="p-4 border-t border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00ffff] to-[#ff00aa] flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.member.name || session.member.email.split('@')[0]}
                </p>
                <p className="text-xs text-[#888] truncate">{session.org.name}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-[#888]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start" 
            className="w-56 bg-[#0a0a0f] border-white/10"
          >
            <div className="px-3 py-2">
              <p className="text-sm font-medium">{session.member.email}</p>
              <p className="text-xs text-[#888] capitalize">{session.member.role}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem asChild>
              <Link href="/nexik/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                <User className="w-4 h-4" />
                Профиль
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem 
              onClick={logout}
              className="text-red-400 focus:text-red-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <Link href="/nexik" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00ffff] to-[#ff00aa] flex items-center justify-center transition-shadow group-hover:shadow-[0_0_30px_rgba(0,255,255,0.3)]">
            <NetNextLogo size={20} />
          </div>
          <div>
            <span className="font-bold text-lg block">Nexik</span>
            <span className="text-[10px] text-[#888] font-mono">Dashboard</span>
          </div>
        </Link>
      </div>

      {/* AI Status */}
      <AIStatus />

      {/* Navigation */}
      <nav className="flex-1 p-4 mt-2 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </nav>

      {/* Help link */}
      <div className="px-4 pb-2">
        <Link
          href="/nexik/help"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5" />
          Помощь
        </Link>
      </div>

      {/* User section */}
      <UserSection />
    </>
  )

  return (
    <div className="min-h-screen bg-[#030305] text-white flex">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#00ffff]/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#ff00aa]/3 rounded-full blur-[120px]" />
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 flex-col relative z-10">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between p-4">
          <Link href="/nexik" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ffff] to-[#ff00aa] flex items-center justify-center">
              <NetNextLogo size={16} />
            </div>
            <span className="font-bold">Nexik</span>
          </Link>
          
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-72 p-0 bg-[#0a0a0f] border-white/5"
            >
              <div className="flex flex-col h-full">
                <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10 lg:pt-0 pt-16">
        {children}
      </main>
    </div>
  )
}

export default function NexikDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NexikAuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </NexikAuthProvider>
  )
}
