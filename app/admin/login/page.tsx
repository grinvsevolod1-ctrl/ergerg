"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token })
      })
      
      const data = await res.json()
      
      if (data.success) {
        const next = searchParams.get("next")
        // Only allow internal admin paths to avoid open-redirects.
        const safeNext = next && next.startsWith("/admin") ? next : "/admin"
        router.push(safeNext)
      } else {
        setError(data.error || "Неверный токен")
      }
    } catch {
      setError("Ошибка подключения")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-zinc-900 rounded-2xl p-8 border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">NetNext Admin</h1>
          <p className="text-zinc-500">Введите токен для входа</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="password" 
            value={token} 
            onChange={(e) => setToken(e.target.value)} 
            placeholder="Токен доступа" 
            className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50" 
            autoFocus 
          />
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-3 bg-white text-black rounded-xl font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <AdminLoginForm />
    </Suspense>
  )
}
