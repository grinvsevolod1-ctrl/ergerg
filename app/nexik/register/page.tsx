"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Loader2, ArrowLeft, Check } from "lucide-react"
import { getBusinessContext } from "@/lib/nexik/services/unified-memory"

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

// Loading fallback
function RegisterLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-white/50" />
    </div>
  )
}

type Step = "email" | "otp" | "success"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [platform, setPlatform] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

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
    
    // Check for OAuth errors
    const urlError = searchParams.get("error")
    if (urlError) {
      setError(urlError === "oauth_denied" ? "Авторизация отменена" : "Ошибка авторизации")
    }
  }, [searchParams])

  // Focus email input on mount
  useEffect(() => {
    if (step === "email") {
      inputRef.current?.focus()
    }
  }, [step])

  // Resend timer
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1]
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when complete
    if (value && index === 5 && newOtp.every(d => d)) {
      verifyOtp(newOtp.join(""))
    }
  }

  // Handle OTP paste
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(""))
      verifyOtp(paste)
    }
  }

  // Handle OTP backspace
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // Google OAuth
  const handleGoogleAuth = () => {
    setLoading(true)
    const state = encodeURIComponent(JSON.stringify({ platform, returnUrl: "/nexik/connect/instagram" }))
    window.location.href = `/api/nexik/auth/oauth/google?state=${state}`
  }

  // Yandex OAuth
  const handleYandexAuth = () => {
    setLoading(true)
    const state = encodeURIComponent(JSON.stringify({ platform, returnUrl: "/nexik/connect/instagram" }))
    window.location.href = `/api/nexik/auth/oauth/yandex?state=${state}`
  }

  // Send OTP to email
  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    if (!email) {
      setError("Введите email")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Введите корректный email")
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
      setOtp(["", "", "", "", "", ""])
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP
  const verifyOtp = async (code?: string) => {
    const otpCode = code || otp.join("")
    if (otpCode.length !== 6) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otpCode, platform }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Неверный код")
        setOtp(["", "", "", "", "", ""])
        otpRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      setStep("success")
      
      // Redirect after success
      setTimeout(() => {
        if (platform === "instagram") {
          router.push("/nexik/connect/instagram")
        } else {
          router.push("/nexik/dashboard")
        }
      }, 1500)
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const resendOtp = async () => {
    if (resendTimer > 0) return
    await sendOtp()
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => step === "otp" ? setStep("email") : router.back()}
        className="absolute top-4 left-4 sm:top-8 sm:left-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Назад</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.h1 
            className="text-2xl font-semibold text-white mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {step === "success" ? "Готово!" : step === "otp" ? "Введите код" : "Создать аккаунт"}
          </motion.h1>
          <motion.p 
            className="text-white/50 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.1 } }}
          >
            {step === "success" 
              ? "Аккаунт создан" 
              : step === "otp" 
                ? `Код отправлен на ${email}`
                : "Войдите чтобы начать использовать Nexik"
            }
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Email form */}
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError("")
                    }}
                    placeholder="email@example.com"
                    className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all"
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm text-center"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-12 bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Продолжить
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-black text-white/40">или</span>
                </div>
              </div>

              {/* Social login buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="flex-1 h-11 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <GoogleIcon className="w-5 h-5" />
                  <span className="text-white/80 text-sm">Google</span>
                </button>

                <button
                  onClick={handleYandexAuth}
                  disabled={loading}
                  className="flex-1 h-11 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-white/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <YandexIcon className="w-5 h-5" />
                  <span className="text-white/80 text-sm">Яндекс</span>
                </button>
              </div>

              {/* Terms */}
              <p className="text-white/30 text-xs text-center mt-6">
                Продолжая, вы соглашаетесь с{" "}
                <Link href="/terms" className="text-white/50 hover:text-white/70 underline">
                  условиями использования
                </Link>
              </p>

              {/* Login link */}
              <p className="text-white/50 text-sm text-center mt-4">
                Уже есть аккаунт?{" "}
                <Link href="/nexik/login" className="text-white hover:underline">
                  Войти
                </Link>
              </p>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* OTP inputs */}
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-medium bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm text-center"
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <div className="flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-white/40 text-sm">
                    Отправить повторно через {resendTimer} сек
                  </p>
                ) : (
                  <button
                    onClick={resendOtp}
                    disabled={loading}
                    className="text-white/60 text-sm hover:text-white transition-colors"
                  >
                    Отправить код повторно
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-green-500" />
              </motion.div>
              <p className="text-white/60 text-sm">Перенаправляем...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function NexikRegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterContent />
    </Suspense>
  )
}
