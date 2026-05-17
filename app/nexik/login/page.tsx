"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

export default function NexikLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
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

      router.push("/nexik/dashboard")
    } catch {
      setError("Ошибка соединения")
      setLoading(false)
    }
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
              href="/nexik/start"
              className="text-white hover:text-cyan-400 transition-colors"
            >
              Создать
            </Link>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-zinc-600">или</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Demo button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
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
