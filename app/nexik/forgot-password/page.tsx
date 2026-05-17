"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // TODO: implement password reset
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8">
        {!submitted ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Восстановление пароля</h1>
            <p className="text-muted-foreground mb-6">
              Введите email, и мы отправим инструкции для восстановления пароля.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Отправка..." : "Отправить"}
              </Button>
            </form>
            <Link href="/nexik/login" className="block text-center text-sm text-muted-foreground mt-4 hover:text-primary">
              Вернуться к входу
            </Link>
          </>
        ) : (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2">Проверьте почту</h2>
              <p className="text-muted-foreground mb-6">
                Мы отправили инструкции по восстановлению пароля на {email}
              </p>
              <Link href="/nexik/login">
                <Button variant="outline">Вернуться к входу</Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
