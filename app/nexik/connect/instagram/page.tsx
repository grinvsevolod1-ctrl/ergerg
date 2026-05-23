"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Loader2, ArrowLeft, Check, Copy, ExternalLink, AlertCircle } from "lucide-react"
import { SiriOrb } from "@/components/nexik/siri-orb"

type ConnectStep = "intro" | "method" | "business" | "manual" | "success"

// Instagram icon
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDC80" />
          <stop offset="25%" stopColor="#FCAF45" />
          <stop offset="50%" stopColor="#F77737" />
          <stop offset="75%" stopColor="#F56040" />
          <stop offset="100%" stopColor="#C13584" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#instagram-gradient)" />
      <circle cx="12" cy="12" r="4" stroke="white" strokeWidth="1.5" fill="none" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="white" />
    </svg>
  )
}

export default function ConnectInstagramPage() {
  const router = useRouter()
  const [step, setStep] = useState<ConnectStep>("intro")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [manualToken, setManualToken] = useState("")
  const [copied, setCopied] = useState(false)
  const [botUsername, setBotUsername] = useState("nexik_bot")

  // Check auth on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/nexik/auth/session")
      if (!res.ok) {
        router.push("/nexik/register?platform=instagram")
      }
    } catch {
      router.push("/nexik/register?platform=instagram")
    }
  }

  // Connect via Facebook OAuth (Instagram Business API)
  const connectBusinessAccount = () => {
    setLoading(true)
    window.location.href = "/api/nexik/integrations/oauth/instagram"
  }

  // Manual token setup
  const submitManualToken = async () => {
    if (!manualToken.trim()) {
      setError("Введите токен")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/nexik/integrations/instagram/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: manualToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Ошибка подключения")
        setLoading(false)
        return
      }

      setStep("success")
    } catch {
      setError("Ошибка соединения")
    } finally {
      setLoading(false)
    }
  }

  const copyBotUsername = () => {
    navigator.clipboard.writeText(`@${botUsername}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-black flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 bg-gradient-radial from-pink-500/10 via-transparent to-transparent blur-3xl" />
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative z-10"
      >
        {/* Back button */}
        {step !== "intro" && step !== "success" && (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              if (step === "method") setStep("intro")
              else if (step === "business" || step === "manual") setStep("method")
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
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <SiriOrb size={48} color="#E1306C" state={loading ? "thinking" : "idle"} />
            <div className="absolute -bottom-1 -right-1 w-6 h-6">
              <InstagramIcon className="w-full h-full" />
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step: Intro */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Подключить Instagram
                </h1>
                <p className="text-zinc-500 text-sm">
                  Nexik будет отвечать на сообщения в Direct
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                {[
                  "Мгновенные ответы 24/7",
                  "Консультации по услугам",
                  "Запись клиентов",
                  "Сбор контактов"
                ].map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-zinc-400"
                  >
                    <div className="w-5 h-5 rounded-full bg-pink-500/20 flex items-center justify-center">
                      <Check size={12} className="text-pink-400" />
                    </div>
                    {feature}
                  </motion.div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setStep("method")}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-sm"
              >
                Начать подключение
                <ArrowRight size={18} />
              </motion.button>

              <Link
                href="/nexik/dashboard"
                className="block text-center text-sm text-zinc-600 hover:text-white transition-colors"
              >
                Пропустить пока
              </Link>
            </motion.div>
          )}

          {/* Step: Choose method */}
          {step === "method" && (
            <motion.div
              key="method"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Выберите способ
                </h1>
                <p className="text-zinc-500 text-sm">
                  Как подключить ваш Instagram
                </p>
              </div>

              <div className="space-y-3">
                {/* Business account */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStep("business")}
                  className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-white/20 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm mb-1">Бизнес аккаунт</div>
                      <div className="text-zinc-500 text-xs">Через Facebook. Для бизнес-аккаунтов Instagram</div>
                    </div>
                    <ArrowRight size={16} className="text-zinc-600 mt-1" />
                  </div>
                </motion.button>

                {/* Manual token */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStep("manual")}
                  className="w-full p-4 bg-white/[0.03] border border-white/10 rounded-xl hover:border-white/20 transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium text-sm mb-1">Ручная настройка</div>
                      <div className="text-zinc-500 text-xs">Ввести токен вручную. Для любых аккаунтов</div>
                    </div>
                    <ArrowRight size={16} className="text-zinc-600 mt-1" />
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step: Business account */}
          {step === "business" && (
            <motion.div
              key="business"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Подключение через Facebook
                </h1>
                <p className="text-zinc-500 text-sm">
                  Авторизуйтесь и выберите Instagram аккаунт
                </p>
              </div>

              {/* Requirements */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-400 mt-0.5" />
                  <div className="text-xs text-amber-200/80">
                    <div className="font-medium mb-1">Требования:</div>
                    <ul className="list-disc list-inside space-y-1 text-amber-200/60">
                      <li>Instagram аккаунт должен быть бизнес или автор</li>
                      <li>Аккаунт должен быть привязан к странице Facebook</li>
                    </ul>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={connectBusinessAccount}
                disabled={loading}
                className="w-full py-3.5 bg-[#1877F2] text-white font-medium rounded-xl hover:bg-[#166fe5] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Подключение...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Войти через Facebook
                  </>
                )}
              </motion.button>

              <button
                onClick={() => setStep("manual")}
                className="w-full text-center text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Или настроить вручную
              </button>
            </motion.div>
          )}

          {/* Step: Manual token */}
          {step === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h1 className="text-xl font-medium text-white mb-2">
                  Ручная настройка
                </h1>
                <p className="text-zinc-500 text-sm">
                  Получите токен в Instagram Developer Portal
                </p>
              </div>

              {/* Instructions */}
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 text-zinc-400">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs">1</div>
                  <div>
                    Перейдите в{" "}
                    <a 
                      href="https://developers.facebook.com/apps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center gap-1"
                    >
                      Meta for Developers <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-zinc-400">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs">2</div>
                  <div>Создайте приложение и добавьте Instagram Basic Display</div>
                </div>
                <div className="flex items-start gap-3 text-zinc-400">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-xs">3</div>
                  <div>Сгенерируйте Access Token и вставьте ниже</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] transition-all text-sm font-mono"
                    placeholder="IGQ..."
                  />
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
                  onClick={submitManualToken}
                  disabled={loading || !manualToken}
                  className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Проверка...
                    </>
                  ) : (
                    <>
                      Подключить
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
                  Instagram подключен!
                </h1>
                <p className="text-zinc-500 text-sm">
                  Nexik начнёт отвечать на сообщения в Direct
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => router.push("/nexik/dashboard")}
                className="w-full py-3.5 bg-white text-black font-medium rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                Перейти в панель
                <ArrowRight size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
