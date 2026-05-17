"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError("Недействительная ссылка для сброса пароля")
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError("Недействительная ссылка")
      return
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов")
      return
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setSuccess(true)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/nexik/dashboard")
        }, 2000)
      } else {
        setError(data.error || "Произошла ошибка")
      }
    } catch {
      setError("Ошибка подключения к серверу")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      {!success ? (
        <>
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400/20 to-teal-500/20 border border-cyan-500/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-cyan-400" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Новый пароль</h1>
            <p className="text-zinc-400 text-sm">
              Придумайте новый надежный пароль для вашего аккаунта
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm text-zinc-400 mb-2">
                Новый пароль
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 6 символов"
                  required
                  minLength={6}
                  disabled={!token}
                  className="w-full px-4 py-3.5 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm text-zinc-400 mb-2">
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                disabled={!token}
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !token || !password || !confirmPassword}
              className="w-full py-3.5 bg-cyan-500 text-black font-medium rounded-xl hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Сохранить новый пароль"
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link 
              href="/nexik/login" 
              className="text-sm text-zinc-400 hover:text-cyan-400 transition-colors"
            >
              Вернуться к входу
            </Link>
          </div>
        </>
      ) : (
        /* Success State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 border border-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3">Пароль изменен!</h2>
          <p className="text-zinc-400 mb-6">
            Ваш пароль успешно обновлен. Перенаправляем в дашборд...
          </p>

          <div className="flex items-center justify-center gap-2 text-cyan-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Переход...</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/nexik" className="flex items-center gap-3">
            <SiriOrb size={32} color="#00ffff" state="idle" />
            <span className="font-semibold">Nexik</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>

      {/* Decorative Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        <SiriOrb size={48} color="#00ffff" state="idle" />
      </div>
    </div>
  )
}
