"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
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
          <Link 
            href="/nexik/login" 
            className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
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
                  <Mail className="w-8 h-8 text-cyan-400" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Восстановление пароля</h1>
                <p className="text-zinc-400 text-sm">
                  Введите email, указанный при регистрации. Мы отправим ссылку для сброса пароля.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm text-zinc-400 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
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
                  disabled={isLoading || !email.trim()}
                  className="w-full py-3.5 bg-cyan-500 text-black font-medium rounded-xl hover:bg-cyan-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    "Отправить ссылку"
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

              <h2 className="text-2xl font-bold mb-3">Проверьте почту</h2>
              <p className="text-zinc-400 mb-6 max-w-sm mx-auto">
                Если аккаунт с адресом <span className="text-white">{email}</span> существует, 
                мы отправили инструкции по восстановлению пароля.
              </p>

              <div className="space-y-3">
                <Link
                  href="/nexik/login"
                  className="block w-full py-3.5 bg-white/5 border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                >
                  Вернуться к входу
                </Link>
                
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail("")
                  }}
                  className="text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  Попробовать другой email
                </button>
              </div>

              {/* Hint */}
              <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/5 text-left">
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-medium">Не получили письмо?</span>
                  <br />
                  Проверьте папку спам или подождите несколько минут. 
                  Ссылка действительна 1 час.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </main>

      {/* Decorative Orb */}
      <div className="fixed bottom-6 right-6 z-50">
        <SiriOrb 
          size={48} 
          color="#00ffff" 
          state={isLoading ? "thinking" : "idle"} 
        />
      </div>
    </div>
  )
}
