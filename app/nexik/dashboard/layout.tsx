"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  Code,
  BarChart3,
  ArrowLeft,
  Clock,
  HelpCircle,
  Plug,
  Key
} from "lucide-react"
import { NetNextLogo } from "@/components/netnext-logo"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/nexik/dashboard", icon: LayoutDashboard, label: "Обзор", exact: true },
  { href: "/nexik/dashboard/chats", icon: MessageSquare, label: "Диалоги" },
  { href: "/nexik/dashboard/knowledge", icon: BookOpen, label: "База знаний" },
  { href: "/nexik/dashboard/schedule", icon: Clock, label: "Расписание" },
  { href: "/nexik/dashboard/integration", icon: Plug, label: "Интеграция" },
  { href: "/nexik/dashboard/widget", icon: Code, label: "Виджет" },
  { href: "/nexik/dashboard/api-keys", icon: Key, label: "API ключи" },
  { href: "/nexik/dashboard/settings", icon: Settings, label: "Настройки" },
]

export default function NexikDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href
    }
    return pathname.startsWith(item.href)
  }

  return (
    <div className="min-h-screen bg-[#030305] text-white flex">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-[#00ffff]/3 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#ff00aa]/3 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 flex flex-col relative z-10">
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
        <div className="px-4 py-3 mx-4 mt-4 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
            <span className="text-xs text-[#00ff88] font-medium">AI работает</span>
          </div>
          <p className="text-[10px] text-[#888] mt-1">Отвечает на сообщения 24/7</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 mt-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
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
        </nav>

        {/* Help & Back */}
        <div className="p-4 border-t border-white/5 space-y-1">
          <Link
            href="/nexik/help"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <HelpCircle className="w-5 h-5" />
            Помощь
          </Link>
          <Link
            href="/nexik"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[#888] hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            На главную
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  )
}
