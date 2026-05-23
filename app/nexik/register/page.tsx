"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Loader2, Mail, ArrowLeft, Check } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"
import { getBusinessContext } from "@/lib/nexik/services/unified-memory"

type AuthStep = "method" | "email" | "otp" | "password" | "success"

// Google icon component
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

// Yandex icon component
function YandexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#FC3F1D"/>
      <path d="M13.643 18.5h-2.286V9.214c-.857 0-2.143.429-2.143 2.143s.857 2.143 2.143 2.143v2.286c-2.571 0-4.429-1.857-4.429-4.429 0-2.571 1.857-4.428 4.429-4.428h2.286V18.5z" fill="#fff"/>
    </svg>
  )
}

export default function NexikRegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<AuthStep>("method")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [focused, setFocused] = useState<string | null>(null)
  const [platform, setPlatform] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  // Get platform from URL or business context
  useEffect(() => {
    const urlPlatform = searchParams.get("platform")
    if (urlPlatform) {
      setPlatform(urlPlatform)
    } else {
      const ctx = getBusinessContext()
      if (ctx?.platforms?.length) {
        setPlatform(ctx.platforms[0])
      }
    }
  }, [searchParams])

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(""))
    }
  }

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
  }

  // Google OAuth
  const handleGoogleAuth = () => {
    setLoading(true)
    const state = encodeURIComponent(JSON.stringify({ platform, returnUrl: "/nexik/dashboard" }))
    window.location.href = `/api/nexik/auth/oauth/google?state=${state}`
  }

  // Yandex OAuth
  const handleYandexAuth = () => {
    setLoading(true)
    const state = encodeURIComponent(JSON.stringify({ platform, returnUrl: "/nexik/dashboard" }))
    window.location.href = `/api/nexik/auth/oauth/yandex?state=${state}`
  }

  // Send OTP to email
  const sendOtp = async () => {
    if (!email) {
      setError("Введите email")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка отправки кода")
        setLoading(false)
        return
      }

      setStep("otp")
      setResendTimer(60)
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const verifyOtp = async () => {
    const code = otp.join("")
    if (code.length !== 6) {
      setError("Введите 6-значный код")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Неверный код")
        setLoading(false)
        return
      }

      if (data.isNewUser) {
        // New user - set password
        setStep("password")
      } else {
        // Existing user - logged in
        setStep("success")
        setTimeout(() => {
          if (platform) {
            router.push(`/nexik/connect/${platform}`)
          } else {
            router.push("/nexik/dashboard")
          }
        }, 1500)
      }
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  // Create account with password
  const createAccount = async () => {
    if (password.length < 6) {
      setError("Минимум 6 символов")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка регистрации")
        setLoading(false)
        return
      }

      setStep("success")
      setTimeout(() => {
        if (platform) {
          router.push(`/nexik/connect/${platform}`)
        } else {
          router.push("/nexik/dashboard")
        }
      }, 1500)
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  // Platform label
  const platformLabels: Record<string, string> = {
    instagram: "Instagram",
    telegram: "Telegram",
    whatsapp: "WhatsApp",
    vk: "ВКонтакте",
    facebook: "Facebook",
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px]"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
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
        {/* Back button (on non-method steps) */}
        {step !== "method" && step !== "success" && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              if (step === "otp") setStep("email")
              else if (step === "password") setStep("otp")
              else if (step === "email") setStep("method")
            }}
            className="absolute -top-12 left-0 flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Назад
          </motion.button>
        )}

        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <Link href="/nexik" className="group">
            <SiriOrb size={56} color="#00ffff" state={loading ? "thinking" : "idle"} />
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step: Choose method */}
          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Title */}
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Создать аккаунт
                </h1>
                {platform && (
                  <p className="text-zinc-500 text-sm">
                    Для подключения {platformLabels[platform] || platform}
                  </p>
                )}
              </div>

              {/* OAuth buttons */}
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-3 text-sm disabled:opacity-50"
                >
                  <GoogleIcon className="w-5 h-5" />
                  Продолжить с Google
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleYandexAuth}
                  disabled={loading}
                  className="w-full py-3.5 bg-[#FC3F1D] text-white font-medium rounded-xl hover:bg-[#e53815] transition-colors flex items-center justify-center gap-3 text-sm disabled:opacity-50"
                >
                  <YandexIcon className="w-5 h-5" />
                  Продолжить с Яндекс
                </motion.button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-zinc-600">или</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setStep("email")}
                className="w-full py-3.5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-3 text-sm"
              >
                <Mail size={18} />
                Продолжить с Email
              </motion.button>

              {/* Login link */}
              <div className="text-center text-sm text-zinc-600 pt-2">
                Уже есть аккаунт?{" "}
                <Link href="/nexik/login" className="text-white hover:text-cyan-400 transition-colors">
                  Войти
                </Link>
              </div>
            </motion.div>
          )}

          {/* Step: Enter email */}
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Введите email
                </h1>
                <p className="text-zinc-500 text-sm">
                  Отправим код подтверждения
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                    className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] transition-all text-sm text-center"
                    placeholder="email@example.com"
                    autoFocus
                  />
                  {focused === "email" && (
                    <motion.div 
                      layoutId="focus-ring"
                      className="absolute inset-0 rounded-xl border border-cyan-500/50 pointer-events-none"
                    />
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={sendOtp}
                  disabled={loading || !email}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Отправка...
                    </>
                  ) : (
                    <>
                      Получить код
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Enter OTP */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Введите код
                </h1>
                <p className="text-zinc-500 text-sm">
                  Отправили на {email}
                </p>
              </div>

              <div className="space-y-4">
                {/* OTP inputs */}
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      className="w-11 h-13 bg-white/[0.03] border border-white/10 rounded-xl text-white text-center text-lg font-medium focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={verifyOtp}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Проверка...
                    </>
                  ) : (
                    <>
                      Подтвердить
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <span className="text-sm text-zinc-600">
                      Отправить снова через {resendTimer}с
                    </span>
                  ) : (
                    <button
                      onClick={sendOtp}
                      className="text-sm text-zinc-500 hover:text-white transition-colors"
                    >
                      Отправить код снова
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Create password */}
          {step === "password" && (
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Создайте пароль
                </h1>
                <p className="text-zinc-500 text-sm">
                  Минимум 6 символов
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    onKeyDown={(e) => e.key === "Enter" && createAccount()}
                    className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:bg-white/[0.05] transition-all text-sm"
                    placeholder="Пароль"
                    autoFocus
                  />
                  {focused === "password" && (
                    <motion.div 
                      layoutId="focus-ring"
                      className="absolute inset-0 rounded-xl border border-cyan-500/50 pointer-events-none"
                    />
                  )}
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={createAccount}
                  disabled={loading || password.length < 6}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Создание...
                    </>
                  ) : (
                    <>
                      Создать аккаунт
                      <ArrowRight size={18} />
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto"
              >
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              
              <div>
                <h1 className="text-xl font-medium text-white mb-2">
                  Готово!
                </h1>
                <p className="text-zinc-500 text-sm">
                  {platform 
                    ? `Переходим к подключению ${platformLabels[platform] || platform}...`
                    : "Переходим в панель управления..."
                  }
                </p>
              </div>

              <Loader2 className="w-6 h-6 animate-spin text-zinc-500 mx-auto" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Terms */}
        {step !== "success" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-xs text-zinc-600"
          >
            Продолжая, вы соглашаетесь с{" "}
            <Link href="/terms" className="text-zinc-500 hover:text-white transition-colors">
              условиями использования
            </Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
