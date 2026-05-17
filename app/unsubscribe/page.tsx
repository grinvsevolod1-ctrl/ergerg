"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Отдельный компонент, который использует useSearchParams
function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "ready" | "unsubscribed" | "error">("loading")
  const [email, setEmail] = useState("")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      setStatus("error")
      return
    }

    // Check current status
    fetch(`/api/unsubscribe?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("error")
        } else {
          setEmail(data.email)
          setStatus(data.unsubscribed ? "unsubscribed" : "ready")
        }
      })
      .catch(() => setStatus("error"))
  }, [token])

  const handleUnsubscribe = async () => {
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason }),
      })

      if (res.ok) {
        setStatus("unsubscribed")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Загрузка...</p>
          </>
        )}

        {status === "ready" && (
          <>
            <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
            <h1 className="text-2xl font-bold mb-2">Отписка от рассылки</h1>
            <p className="text-muted-foreground mb-6">
              Вы действительно хотите отписаться от рассылки NetNext?
              <br />
              <span className="text-sm">{email}</span>
            </p>

            <div className="mb-6 text-left">
              <label className="text-sm text-muted-foreground mb-2 block">
                Причина отписки (необязательно)
              </label>
              <Textarea
                placeholder="Расскажите, почему вы отписываетесь..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleUnsubscribe}
              disabled={isSubmitting}
              className="w-full"
              variant="destructive"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Отписка...
                </>
              ) : (
                "Отписаться"
              )}
            </Button>

            <p className="text-xs text-muted-foreground mt-4">
              Вы больше не будете получать от нас рекламные письма.
              <br />
              Важные уведомления о ваших проектах могут продолжать приходить.
            </p>
          </>
        )}

        {status === "unsubscribed" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Вы отписались</h1>
            <p className="text-muted-foreground mb-6">
              Email <span className="font-medium">{email}</span> удалён из рассылки.
            </p>
            <p className="text-sm text-muted-foreground">
              Если вы передумали, свяжитесь с нами:
              <br />
              <a href="mailto:hello@netnext.site" className="text-primary hover:underline">
                hello@netnext.site
              </a>
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2">Ошибка</h1>
            <p className="text-muted-foreground mb-6">
              Недействительная или устаревшая ссылка для отписки.
            </p>
            <p className="text-sm text-muted-foreground">
              Для отписки напишите нам:
              <br />
              <a href="mailto:unsubscribe@netnext.site" className="text-primary hover:underline">
                unsubscribe@netnext.site
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// Основной компонент страницы с Suspense
export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
