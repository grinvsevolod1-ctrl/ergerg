"use client"

import { useState, useEffect, Suspense } from "react"
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
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState(error_param === 'server_error' ? 'Ошибка авторизации' : "")
  const [focused, setFocused] = useState<string | null>(null)

  // Check if already logged in
  useEffect(() => {
    fetch("/api/nexik/auth/session")
      .then(res => res.json())
      .then(data => {
        if (data.session?.member) {
          router.replace("/nexik/dashboard")
        }
      })
      .catch(() => {})
  }, [router])

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

      router.push("/nexik/dashboard")
    } catch {
      setError("Ошибка соединения")
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'google' | 'yandex') => {
    setOauthLoading(provider)
    window.location.href = `/api/nexik/auth/oauth/${provider}`
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/10 via-transparent to-transparent blur-3xl" />
        </motion.div>
      </div>

      {/* Grid pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-10"
        >
          <Link href="/nexik" className="group">
            <SiriOrb size={64} color="#00ffff" state="idle" />
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-2xl font-medium text-white mb-2">
            Вход в Nexik
          </h1>
          <p className="text-zinc-500 text-sm">
            Управляйте вашим AI-ассистентом
          </p>
        </motion.div>

        {/* OAuth buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex gap-3 mb-6"
        >
          <button
            onClick={() => handleOAuth('google')}
            disabled={!!oauthLoading}
            className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {oauthLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span className="text-sm">Google</span>
          </button>
          
          <button
            onClick={() => handleOAuth('yandex')}
            disabled={!!oauthLoading}
            className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {oauthLoading === 'yandex' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <YandexIcon className="w-5 h-5" />
            )}
            <span className="text-sm">Яндекс</span>
          </button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-zinc-600">или</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Form */}
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] transition-all text-sm"
              placeholder="Email"
              required
            />
            {focused === "email" && (
              <motion.div 
                layoutId="focus-ring"
                className="absolute inset-0 rounded-xl border border-cyan-500/50 pointer-events-none"
                transition={{ duration: 0.2 }}
              />
            )}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] transition-all pr-12 text-sm"
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
            {focused === "password" && (
              <motion.div 
                layoutId="focus-ring"
                className="absolute inset-0 rounded-xl border border-cyan-500/50 pointer-events-none"
                transition={{ duration: 0.2 }}
              />
            )}
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
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Вход...</span>
              </>
            ) : (
              <>
                <span>Продолжить</span>
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Links */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 space-y-4 text-center"
        >
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
              className="text-white hover:text-cyan-400 transition-colors"
            >
              Создать
            </Link>
          </div>
        </motion.div>

        {/* Demo button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Link
            href="/nexik"
            className="w-full py-3.5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            Попробовать без регистрации
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white/50" />
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
