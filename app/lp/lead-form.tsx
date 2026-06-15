"use client"

import { useState } from "react"
import { Phone, Send, Mail, Loader2, CheckCircle2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { reachGoal, YM_GOALS, contactMethodGoal } from "@/lib/analytics"
import { getAttribution } from "@/lib/attribution"

type Method = "phone" | "telegram" | "email"

const METHODS: { id: Method; label: string; icon: typeof Phone; placeholder: string }[] = [
  { id: "phone", label: "Телефон", icon: Phone, placeholder: "+375 (29) 123-45-67" },
  { id: "telegram", label: "Telegram", icon: Send, placeholder: "@username" },
  { id: "email", label: "Email", icon: Mail, placeholder: "you@example.com" },
]

export function LeadForm({ id }: { id?: string }) {
  const [name, setName] = useState("")
  const [method, setMethod] = useState<Method>("phone")
  const [contact, setContact] = useState("")
  const [comment, setComment] = useState("")
  const [consent, setConsent] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeMethod = METHODS.find((m) => m.id === method) ?? METHODS[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError("Укажите, как к вам обращаться")
      return
    }
    if (contact.trim().length < 3) {
      setError("Укажите контакт для связи")
      return
    }
    if (!consent) {
      setError("Нужно согласие на обработку данных")
      return
    }

    setIsLoading(true)
    try {
      const attribution = getAttribution()
      const value = contact.trim()

      const payload = {
        companyName: name.trim(),
        phone: method === "phone" ? value : "",
        email: method === "email" ? value : "",
        telegram: method === "telegram" ? value : "",
        contactMethod: method,
        description: comment.trim() || "Заявка с промо-страницы (акция 600 BYN)",
        source: "lp_promo_600",
        consentGiven: true,
        ...attribution,
      }

      await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {
        /* silent — не теряем конверсию из-за сбоя бэка */
      })

      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "contact_form",
          data: {
            name: name.trim(),
            contactMethod: method,
            contactValue: value,
            message: comment.trim() || "Акция: лендинг 600 BYN",
            source: "lp_promo_600",
            utmSource: attribution.utmSource,
            utmCampaign: attribution.utmCampaign,
            utmTerm: attribution.utmTerm,
            yclid: attribution.yclid,
          },
        }),
      }).catch(() => {
        /* silent */
      })

      // Conversion goals
      reachGoal(YM_GOALS.trustForm)
      reachGoal(contactMethodGoal(method))

      setDone(true)
    } catch {
      setError("Что-то пошло не так. Попробуйте ещё раз или напишите в Telegram.")
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div
        id={id}
        className="flex flex-col items-center text-center gap-4 rounded-2xl border border-primary/30 bg-card p-8 sm:p-10"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-card-foreground">Заявка принята!</h3>
        <p className="text-muted-foreground leading-relaxed max-w-sm">
          Менеджер свяжется с вами в течение рабочего дня (10:00–20:00 по Минску) и рассчитает
          стоимость вашего лендинга по акции.
        </p>
      </div>
    )
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="text-xl sm:text-2xl font-bold text-card-foreground text-balance">
          Получить лендинг за 600 BYN
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Оставьте заявку — рассчитаем стоимость и сроки бесплатно.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="lp-name" className="text-sm font-medium text-card-foreground">
          Как к вам обращаться
        </label>
        <input
          id="lp-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Иван"
          autoComplete="name"
          className="h-12 rounded-xl border border-input bg-background px-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-card-foreground">Как с вами связаться</span>
        <div className="grid grid-cols-3 gap-2">
          {METHODS.map((m) => {
            const Icon = m.icon
            const active = m.id === method
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={cn(
                  "flex items-center justify-center gap-2 h-11 rounded-xl border text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{m.label}</span>
              </button>
            )
          })}
        </div>
        <input
          type={method === "email" ? "email" : "text"}
          inputMode={method === "phone" ? "tel" : "text"}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={activeMethod.placeholder}
          autoComplete={method === "phone" ? "tel" : method === "email" ? "email" : "off"}
          className="h-12 rounded-xl border border-input bg-background px-4 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="lp-comment" className="text-sm font-medium text-card-foreground">
          Коротко о проекте <span className="text-muted-foreground font-normal">(необязательно)</span>
        </label>
        <textarea
          id="lp-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Например: лендинг для студии маникюра"
          className="rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none transition-colors resize-none"
        />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span className="text-xs text-muted-foreground leading-relaxed">
          Согласен на обработку персональных данных и получение ответа на заявку.
        </span>
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center justify-center gap-2 h-13 min-h-[52px] rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Отправляем…
          </>
        ) : (
          "Рассчитать мой лендинг"
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Без спама. Перезвоним только по делу.
      </div>
    </form>
  )
}
