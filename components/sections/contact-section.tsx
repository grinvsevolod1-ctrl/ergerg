"use client"

import React, { useState, useRef, useEffect } from "react"
import { Mail, Phone, CheckCircle, ArrowRight, MessageSquare, Briefcase, Rocket, Clock, SendHorizonal, AlertCircle } from "lucide-react"
import { CreativeIcon, LaunchIcon } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { PhoneInput } from "@/components/phone-input"
import { TelegramIcon, WhatsAppIcon, ViberIcon } from "@/components/icons"

const contactCards = [
  { icon: Phone, label: "Телефон", value: "+375 (29) 14-14-555", href: "tel:+375291414555", color: "#22c55e" },
  { icon: Mail, label: "Email", value: "hello@netnext.site", href: "mailto:hello@netnext.site", color: "#14b8a6" },
]

const messengerLinks = [
  { icon: TelegramIcon, label: "Telegram", href: "https://t.me/netnextadminbot", color: "#0088cc" },
  { icon: WhatsAppIcon, label: "WhatsApp", href: "https://wa.me/375291414555", color: "#25D366" },
  { icon: ViberIcon, label: "Viber", href: "viber://chat?number=%2B375291414555", color: "#7360F2" },
]

const projectTypes = [
  { id: "website", label: "Сайт", icon: MessageSquare },
  { id: "app", label: "Приложение", icon: Rocket },
  { id: "design", label: "Дизайн", icon: CreativeIcon },
  { id: "other", label: "Другое", icon: Briefcase },
]

const budgetRanges = [
  { id: "small", label: "до 3 000 Br" },
  { id: "medium", label: "3 000 - 10 000 Br" },
  { id: "large", label: "10 000 - 30 000 Br" },
  { id: "enterprise", label: "30 000+ Br" },
]

type ContactMethod = "email" | "telegram" | "phone"

const contactMethods = [
  { id: "email" as ContactMethod, label: "Email", icon: Mail, color: "#14b8a6", hint: "Подтверждение на почту" },
  { id: "telegram" as ContactMethod, label: "Telegram", icon: TelegramIcon, color: "#0088cc", hint: "Ответим в Telegram" },
  { id: "phone" as ContactMethod, label: "Телефон", icon: Phone, color: "#22c55e", hint: "Перезвоним вам" },
]

/* ── Validation helpers ── */
function validateEmail(email: string): string | null {
  if (!email) return "Введите email"
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!re.test(email)) return "Некорректный формат email"
  const domainPart = email.split("@")[1]?.split(".").pop()
  if (!email.includes(".") || !domainPart || domainPart.length < 2)
    return "Проверьте домен email"
  return null
}

function validateTelegram(value: string): string | null {
  if (!value) return "Введите ник или номер телефона"
  // If starts with @, validate as username
  if (value.startsWith("@")) {
    const username = value.slice(1)
    if (username.length < 5) return "Минимум 5 символов после @"
    if (username.length > 32) return "Максимум 32 символа"
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Только латиница, цифры и _"
    return null
  }
  // If starts with + or is digits, validate as phone
  const digits = value.replace(/\D/g, "")
  if (digits.length >= 7 && digits.length <= 15) return null
  // If it looks like a username without @
  if (/^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(value)) return "Добавьте @ перед ником"
  return "Введите @username или номер телефона"
}

function validatePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "")
  if (digits.length < 7) return "Слишком короткий номер"
  if (digits.length > 15) return "Слишком длинный номер"
  return null
}

export function ContactSection() {
  const [step, setStep] = useState(1)
  const [contactMethod, setContactMethod] = useState<ContactMethod>("email")
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    telegram: "",
    phone: "",
    projectType: "",
    budget: "",
    message: "",
  })
  const [fromGenerator, setFromGenerator] = useState(false)

  // Autofill from generator sessionStorage
  useEffect(() => {
    try {
      const generatorData = sessionStorage.getItem("generatorUserData")
      if (generatorData) {
        const data = JSON.parse(generatorData)
        setFormState(prev => ({
          ...prev,
          name: data.companyName || prev.name,
          email: data.email || prev.email,
          phone: data.phone || prev.phone,
          projectType: "website",
          message: data.description 
            ? `${data.description}\n\nХочу сайт как превью для ниши "${data.niche}"`
            : `Хочу сайт как превью для ниши "${data.niche}"`,
        }))
        setFromGenerator(true)
        setStep(2) // Jump to step 2 with contact info
        
        // Clear sessionStorage after use
        sessionStorage.removeItem("generatorUserData")
      }
    } catch {
      // Ignore parsing errors
    }
  }, [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  /* Validate on blur */
  const validateField = (field: string, value: string) => {
    let err: string | null = null
    if (field === "email") err = validateEmail(value)
    if (field === "telegram") err = validateTelegram(value)
    if (field === "phone") err = validatePhone(value)
    if (field === "name" && !value.trim()) err = "Введите ваше имя"
    setErrors(prev => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
    return err
  }

  const handleBlur = (field: string) => {
    setFocusedField(null)
    setTouched(prev => ({ ...prev, [field]: true }))
    const value = formState[field as keyof typeof formState]
    validateField(field, value)
  }

  const getContactValue = () => {
    if (contactMethod === "email") return formState.email
    if (contactMethod === "telegram") return formState.telegram
    return formState.phone
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formState.name.trim()) newErrors.name = "Введите ваше имя"
    
    if (contactMethod === "email") {
      const e = validateEmail(formState.email)
      if (e) newErrors.email = e
    } else if (contactMethod === "telegram") {
      const e = validateTelegram(formState.telegram)
      if (e) newErrors.telegram = e
    } else {
      const e = validatePhone(formState.phone)
      if (e) newErrors.phone = e
    }

    if (!formState.message.trim()) newErrors.message = "Расскажите о проекте"
    setErrors(newErrors)
    setTouched({ name: true, email: true, telegram: true, phone: true, message: true })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const contactValue = getContactValue()
      
      // Prepare lead data
      const leadPayload = {
        companyName: formState.name,
        phone: contactMethod === "phone" ? contactValue : "",
        email: contactMethod === "email" ? contactValue : "",
        telegram: contactMethod === "telegram" ? contactValue : "",
        contactMethod,
        projectType: formState.projectType,
        budget: formState.budget,
        description: formState.message,
        source: fromGenerator ? "generator_contact" : "contact_form",
        consentGiven: true,
      }

      // Save lead to database
      await fetch("/api/leads/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadPayload),
      }).catch(() => {/* silent */})

      // Send to Telegram notification
      const telegramPayload = {
        type: "contact_form",
        data: {
          name: formState.name,
          contactMethod,
          contactValue,
          projectType: formState.projectType,
          budget: formState.budget,
          message: formState.message,
        },
      }

      await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(telegramPayload),
      })

      // If email, also send confirmation email
      if (contactMethod === "email" && formState.email) {
        await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formState.email,
            name: formState.name,
            projectType: formState.projectType,
          }),
        }).catch(() => {/* silent */})
      }
    } catch {
      // silent fail
    }

    setIsSubmitted(true)
    setIsLoading(false)
    setFormState({ name: "", email: "", telegram: "", phone: "", projectType: "", budget: "", message: "" })
    setErrors({})
    setTouched({})
    setStep(1)
    setTimeout(() => setIsSubmitted(false), 6000)
  }

  const canProceedToStep2 = formState.projectType && formState.budget
  const canSubmit = formState.name && getContactValue() && formState.message

  return (
    <section id="contact" className="min-h-screen py-20 md:py-28 lg:py-32 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 md:w-80 h-64 md:h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 md:w-96 h-80 md:h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-20 relative">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary/10 border border-primary/20 mb-5">
            <LaunchIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-primary text-xs font-medium tracking-wide">Начните проект</span>
          </div>
          <h2 className="text-[1.75rem] sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-balance tracking-tight">
            Давайте создадим что-то{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              невероятное
            </span>
          </h2>
          <p className="text-muted-foreground text-[15px] md:text-lg leading-relaxed max-w-lg mx-auto">
            Расскажите о вашем проекте, и мы превратим вашу идею в реальность.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-3">
              {contactCards.map((item, index) => {
                const Icon = item.icon
                return (
                  <a key={item.label} href={item.href}
                    className="group flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                    style={{ animationDelay: `${index * 100}ms` }}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-muted-foreground block mb-0.5">{item.label}</span>
                      <p className="text-foreground font-medium text-sm md:text-base group-hover:text-primary transition-colors">{item.value}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                )
              })}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {messengerLinks.map((m) => {
                const Icon = m.icon
                return (
                  <a key={m.label} href={m.href} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/50 hover:border-opacity-50 transition-all duration-300 hover:shadow-lg group"
                    style={{ borderColor: `${m.color}30` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium" style={{ color: m.color }}>{m.label}</span>
                  </a>
                )
              })}
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-foreground">Работаем 24/7</h4>
                  <p className="text-xs text-muted-foreground">Ответим в течение 2 часов</p>
                </div>
              </div>
              <div className="flex gap-1.5">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                  <div key={day} className="flex-1 text-center py-1.5 rounded-lg bg-primary/10 text-xs text-primary font-medium">{day}</div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <div className="relative w-1.5 h-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-50" />
                </div>
                <span className="text-[11px] text-green-500 font-medium">Всегда на связи</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-border/50 relative overflow-hidden">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300",
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>1</div>
                <div className={cn("flex-1 h-1 rounded-full transition-all duration-500", step >= 2 ? "bg-primary" : "bg-secondary")} />
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all duration-300",
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>2</div>
              </div>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4 relative">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                    <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Заявка отправлена!</h3>
                  <p className="text-muted-foreground mb-2">
                    {contactMethod === "email" 
                      ? "Письмо-подтверждение отправлено на ваш email."
                      : contactMethod === "telegram"
                      ? "Мы свяжемся с вами в Telegram."
                      : "Мы перезвоним вам в ближайшее время."
                    }
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Среднее время ответа: 2 часа</span>
                  </div>
                </div>
              ) : (
                <form ref={formRef} onSubmit={handleSubmit}>
                  {/* Step 1 */}
                  <div className={cn("space-y-6 transition-all duration-300", step === 1 ? "block" : "hidden")}>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Тип проекта</label>
                      <div className="grid grid-cols-2 gap-3">
                        {projectTypes.map((type) => {
                          const Icon = type.icon
                          const isSelected = formState.projectType === type.id
                          return (
                            <button key={type.id} type="button"
                              onClick={() => setFormState({ ...formState, projectType: type.id })}
                              className={cn("flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200",
                                isSelected ? "border-primary bg-primary/10 shadow-lg shadow-primary/10" : "border-border hover:border-primary/50 bg-background/50")}>
                              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-foreground")}>{type.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Примерный бюджет</label>
                      <div className="grid grid-cols-2 gap-2">
                        {budgetRanges.map((range) => {
                          const isSelected = formState.budget === range.id
                          return (
                            <button key={range.id} type="button"
                              onClick={() => setFormState({ ...formState, budget: range.id })}
                              className={cn("py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                                isSelected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground")}>
                              {range.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <Button type="button" onClick={() => setStep(2)} disabled={!canProceedToStep2} className="w-full h-12 text-base">
                      Продолжить
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* Step 2 */}
                  <div className={cn("space-y-5 transition-all duration-300", step === 2 ? "block" : "hidden")}>
                    <button type="button" onClick={() => setStep(1)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mb-2">
                      <ArrowRight className="w-3 h-3 rotate-180" />
                      Назад
                    </button>

                    {/* Contact method selector */}
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Как с вами связаться?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {contactMethods.map((method) => {
                          const Icon = method.icon
                          const isSelected = contactMethod === method.id
                          return (
                            <button key={method.id} type="button"
                              onClick={() => setContactMethod(method.id)}
                              className={cn(
                                "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                                isSelected
                                  ? "border-current shadow-lg"
                                  : "border-border hover:border-current/30"
                              )}
                              style={isSelected ? { borderColor: method.color, backgroundColor: `${method.color}10` } : undefined}>
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: `${method.color}15`, color: method.color }}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={cn("text-xs font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
                                {method.label}
                              </span>
                              <span className="text-[10px] text-muted-foreground hidden sm:block">{method.hint}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Name */}
                    <div className="relative">
                      <label className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none z-10",
                        focusedField === "name" || formState.name ? "-top-2 text-xs bg-card px-1 text-primary" : "top-3 text-sm text-muted-foreground"
                      )}>Ваше имя</label>
                      <Input
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => handleBlur("name")}
                        className={cn("h-12 bg-background/50 border-2 transition-all duration-200",
                          touched.name && errors.name ? "border-red-500" : focusedField === "name" ? "border-primary" : "border-border"
                        )}
                      />
                      {touched.name && errors.name && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.name}
                        </p>
                      )}
                    </div>

                    {/* Dynamic contact field */}
                    {contactMethod === "email" && (
                      <div className="relative">
                        <label className={cn(
                          "absolute left-3 transition-all duration-200 pointer-events-none z-10",
                          focusedField === "email" || formState.email ? "-top-2 text-xs bg-card px-1 text-primary" : "top-3 text-sm text-muted-foreground"
                        )}>Email</label>
                        <Input
                          type="email"
                          value={formState.email}
                          onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => handleBlur("email")}
                          className={cn("h-12 bg-background/50 border-2 transition-all duration-200",
                            touched.email && errors.email ? "border-red-500" : focusedField === "email" ? "border-primary" : "border-border"
                          )}
                        />
                        {/* Live validation feedback */}
                        {formState.email && !errors.email && touched.email && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                              <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          </div>
                        )}
                        {touched.email && errors.email && (
                          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors.email}
                          </p>
                        )}
                      </div>
                    )}

                    {contactMethod === "telegram" && (
                      <div className="relative">
                        <label className={cn(
                          "absolute transition-all duration-200 pointer-events-none z-10",
                          focusedField === "telegram" || formState.telegram 
                            ? "left-3 -top-2 text-xs bg-card px-1" 
                            : "left-11 top-3 text-sm text-muted-foreground"
                        )} style={focusedField === "telegram" || formState.telegram ? { color: "#0088cc" } : undefined}>
                          {focusedField === "telegram" || formState.telegram ? "Telegram" : "@username или номер"}
                        </label>
                        <div className="relative">
                          <Input
                            value={formState.telegram}
                            onChange={(e) => setFormState({ ...formState, telegram: e.target.value })}
                            onFocus={() => setFocusedField("telegram")}
                            onBlur={() => handleBlur("telegram")}
                            placeholder=""
                            className={cn("h-12 bg-background/50 border-2 transition-all duration-200 pl-11",
                              touched.telegram && errors.telegram ? "border-red-500" : focusedField === "telegram" ? "border-[#0088cc]" : "border-border"
                            )}
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <TelegramIcon className="w-5 h-5 text-[#0088cc]" />
                          </div>
                          {/* Live validation */}
                          {formState.telegram && !errors.telegram && touched.telegram && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                        {touched.telegram && errors.telegram && (
                          <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />{errors.telegram}
                          </p>
                        )}
                        {/* Hint */}
                        {focusedField === "telegram" && !errors.telegram && (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            Введите @username (например @ivan_dev) или номер телефона
                          </p>
                        )}
                      </div>
                    )}

                    {contactMethod === "phone" && (
                      <div>
                        <PhoneInput
                          value={formState.phone}
                          onChange={(val) => setFormState({ ...formState, phone: val })}
                          error={touched.phone ? errors.phone : undefined}
                        />
                      </div>
                    )}

                    {/* Message */}
                    <div className="relative">
                      <label className={cn(
                        "absolute left-3 transition-all duration-200 pointer-events-none z-10",
                        focusedField === "message" || formState.message ? "-top-2 text-xs bg-card px-1 text-primary" : "top-3 text-sm text-muted-foreground"
                      )}>Расскажите о проекте</label>
                      <Textarea
                        value={formState.message}
                        onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                        onFocus={() => setFocusedField("message")}
                        onBlur={() => handleBlur("message")}
                        rows={4}
                        className={cn("bg-background/50 border-2 resize-none pt-4 transition-all duration-200",
                          touched.message && errors.message ? "border-red-500" : focusedField === "message" ? "border-primary" : "border-border"
                        )}
                      />
                      {touched.message && errors.message && (
                        <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />{errors.message}
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-12 text-base relative overflow-hidden group"
                      disabled={isLoading || !canSubmit}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Отправляем...
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 group-hover:-translate-y-10 transition-transform duration-300">
                            <SendHorizonal className="w-4 h-4" />
                            Отправить заявку
                          </span>
                          <span className="absolute inset-0 flex items-center justify-center gap-2 translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
                            <Rocket className="w-4 h-4" />
                            Поехали!
                          </span>
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Нажимая кнопку, вы соглашаетесь с{" "}
                      <a href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</a>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
