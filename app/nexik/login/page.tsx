"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

// Google icon
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

// Yandex icon
function YandexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#FC3F1D"/>
      <path d="M13.643 18.5h-2.286V9.214c-.857 0-2.143.429-2.143 2.143s.857 2.143 2.143 2.143v2.286c-2.571 0-4.429-1.857-4.429-4.429 0-2.571 1.857-4.428 4.429-4.428h2.286V18.5z" fill="#fff"/>
    </svg>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error_param = searchParams.get('error')
  const returnUrl = searchParams.get('returnUrl')
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState(error_param === 'server_error' ? 'Ошибка авторизации. Попробуйте еще раз.' : "")
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/nexik/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка входа")
        setLoading(false)
        return
      }

      router.push(returnUrl || "/nexik/dashboard")
    } catch {
      setError("Ошибка соединения")
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'google' | 'yandex') => {
    setOauthLoading(provider)
    const state = returnUrl ? encodeURIComponent(JSON.stringify({ returnUrl })) : ''
    window.location.href = `/api/nexik/auth/oauth/${provider}${state ? `?state=${state}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/nexik">
            <SiriOrb size={56} state="idle" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Вход в Nexik
          </h1>
          <p className="text-zinc-500 text-sm">
            Управляйте вашим AI-ассистентом
          </p>
        </div>

        {/* OAuth buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="w-full py-3 bg-white hover:bg-zinc-100 rounded-xl text-black font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>Продолжить с Google</span>
          </button>
          
          <button
            onClick={() => handleOAuth('yandex')}
            disabled={!!oauthLoading}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
          >
            {oauthLoading === 'yandex' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <YandexIcon className="w-5 h-5" />
            )}
            <span>Продолжить с Яндекс</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-zinc-600">или</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
              placeholder="Email"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-all pr-12 text-sm"
              placeholder="Пароль"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Вход...</span>
              </>
            ) : (
              <>
                <span>Войти</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Links */}
        <div className="mt-6 space-y-3 text-center">
          <Link
            href="/nexik/forgot-password"
            className="text-sm text-zinc-500 hover:text-white transition-colors block"
          >
            Забыли пароль?
          </Link>
          
          <div className="text-sm text-zinc-600">
            Нет аккаунта?{" "}
            <Link
              href="/nexik/register"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Создать
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
    </div>
  )
}

export default function NexikLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginContent />
    </Suspense>
  )
}
