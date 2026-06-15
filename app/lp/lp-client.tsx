"use client"

import { useState } from "react"
import {
  ArrowRight,
  Check,
  Zap,
  Sparkles,
  Smartphone,
  Search,
  Headphones,
  MessageCircle,
  Clock,
  Star,
  ChevronDown,
} from "lucide-react"
import { NetNextChat } from "@/components/chat/netnext-chat"
import { reachGoal, YM_GOALS } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { LeadForm } from "./lead-form"

const METRICS = [
  { value: "5 дней", label: "запуск под ключ" },
  { value: "−50%", label: "на первый проект" },
  { value: "50+", label: "проектов в портфолио" },
  { value: "24/7", label: "поддержка и правки" },
]

const INCLUDED = [
  { icon: Zap, title: "Дизайн под ваш бизнес", text: "Уникальный продающий дизайн, а не шаблон. Под вашу нишу и аудиторию." },
  { icon: Smartphone, title: "Адаптив под мобильные", text: "Идеально на телефоне, планшете и десктопе — там, где ваши клиенты." },
  { icon: Search, title: "Базовое SEO и скорость", text: "Быстрая загрузка и оптимизация, чтобы реклама не сливалась впустую." },
  { icon: Sparkles, title: "Форма заявок + аналитика", text: "Заявки приходят в Telegram, настроена Яндекс Метрика и цели." },
  { icon: Headphones, title: "Подключение рекламы", text: "Поможем с Яндекс Директом, чтобы лендинг сразу приносил клиентов." },
  { icon: Check, title: "Хостинг и домен", text: "Поможем с публикацией, подключением домена и SSL-сертификатом." },
]

const STEPS = [
  { n: "01", title: "Заявка и бриф", text: "Оставляете заявку, обсуждаем задачу и нишу. Бесплатно считаем смету." },
  { n: "02", title: "Дизайн и согласование", text: "Готовим дизайн, показываем, вносим правки до полного одобрения." },
  { n: "03", title: "Вёрстка и запуск", text: "Собираем сайт, подключаем формы, аналитику и публикуем за 5 дней." },
  { n: "04", title: "Реклама и заявки", text: "Помогаем настроить рекламу — лендинг начинает приносить клиентов." },
]

const CASES = [
  { name: "Студия маникюра", result: "+38 заявок", text: "за первый месяц после запуска лендинга и рекламы" },
  { name: "Мебель на заказ", result: "×2,5 заявок", text: "рост обращений против старого сайта" },
  { name: "Автосервис", result: "8,4₽", text: "средняя стоимость заявки из Яндекс Директа" },
]

const FAQ = [
  { q: "Почему так недорого — 600 BYN?", a: "Это акция на первый проект для новых клиентов (обычная цена от 1200 BYN). Так мы знакомимся: вы получаете качественный лендинг, а мы — нового долгосрочного клиента." },
  { q: "Что входит в эту цену?", a: "Уникальный дизайн, адаптив под все устройства, форма заявок с уведомлениями в Telegram, базовое SEO, подключение Яндекс Метрики и помощь с публикацией." },
  { q: "Сколько занимает разработка?", a: "В среднем 5 рабочих дней с момента согласования дизайна. Сроки зависят от объёма, точные назовём после брифа." },
  { q: "А реклама входит в стоимость?", a: "Сам лендинг — да. Настройку и ведение рекламы обсуждаем отдельно, но поможем стартовать и подскажем по бюджету." },
  { q: "Где вы находитесь?", a: "Мы веб-студия NetNext из Минска, работаем по всей Беларуси и за её пределами удалённо." },
]

export function LpClient() {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const scrollToForm = (source: string) => {
    reachGoal(YM_GOALS.clickCtaDiscuss, { source })
    document.getElementById("lead")?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const openChat = (source: string) => {
    reachGoal(YM_GOALS.clickCtaDiscuss, { source })
    setIsChatOpen(true)
  }

  return (
    <>
      <NetNextChat isOpen={isChatOpen} onOpenChange={setIsChatOpen} />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Net<span className="text-primary">Next</span>
          </span>
          <div className="flex items-center gap-3">
            <a
              href="tel:+375291414555"
              onClick={() => reachGoal(YM_GOALS.clickContactInfo, { source: "lp_header" })}
              className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              +375 (29) 141-45-55
            </a>
            <button
              type="button"
              onClick={() => scrollToForm("lp_header_btn")}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="grid gap-10 py-12 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-2 text-xs sm:text-sm font-medium text-foreground/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Акция для новых клиентов
            </span>

            <h1 className="mt-5 text-pretty text-[2.1rem] font-bold leading-[1.12] tracking-tight sm:text-5xl lg:text-6xl">
              Продающий лендинг за{" "}
              <span className="text-primary">600&nbsp;BYN</span>
            </h1>

            <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
              Запускаем современный сайт под ключ за 5 дней: уникальный дизайн, адаптив, форма
              заявок и аналитика. Готов принимать клиентов из рекламы сразу.
            </p>

            <div className="mt-7 flex items-end gap-3">
              <span className="text-4xl font-bold text-foreground sm:text-5xl">600 BYN</span>
              <span className="mb-1 text-lg text-muted-foreground line-through decoration-[#ff6b35]/70">
                1200 BYN
              </span>
              <span className="mb-1.5 rounded-md bg-[#ff6b35]/15 px-2 py-0.5 text-sm font-semibold text-[#ff6b35]">
                −50%
              </span>
            </div>

            <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => scrollToForm("lp_hero_primary")}
                className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Получить за 600 BYN
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                type="button"
                onClick={() => openChat("lp_hero_chat")}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-semibold text-card-foreground transition-colors hover:border-primary/50"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                Задать вопрос
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary" /> Запуск за 5 дней
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-primary" /> 50+ проектов
              </span>
            </div>
          </div>

          {/* Form in hero on desktop */}
          <div className="lg:pt-2">
            <LeadForm id="lead" />
          </div>
        </section>

        {/* Metrics bento */}
        <section className="grid grid-cols-2 gap-3 border-y border-border py-8 sm:gap-4 md:grid-cols-4">
          {METRICS.map((m) => (
            <div key={m.label} className="flex flex-col gap-1 px-2">
              <span className="text-2xl font-bold text-foreground sm:text-3xl">{m.value}</span>
              <span className="text-sm text-muted-foreground leading-snug">{m.label}</span>
            </div>
          ))}
        </section>

        {/* What's included */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-pretty text-2xl font-bold tracking-tight sm:text-4xl">
              Что входит в лендинг за 600 BYN
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Полноценный сайт, готовый зарабатывать — без скрытых доплат.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Steps */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-pretty text-2xl font-bold tracking-tight sm:text-4xl">
              Как мы работаем
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Прозрачный процесс от заявки до клиентов из рекламы.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
                <span className="text-3xl font-bold text-primary/40">{s.n}</span>
                <h3 className="text-lg font-semibold text-card-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cases */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-pretty text-2xl font-bold tracking-tight sm:text-4xl">
              Результаты клиентов
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {CASES.map((c) => (
              <div key={c.name} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6">
                <span className="text-3xl font-bold text-primary">{c.result}</span>
                <span className="text-sm font-medium text-card-foreground">{c.name}</span>
                <span className="text-sm text-muted-foreground leading-relaxed">{c.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-pretty text-2xl font-bold tracking-tight sm:text-4xl">
              Частые вопросы
            </h2>
          </div>
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {FAQ.map((item, i) => {
              const open = openFaq === i
              return (
                <div key={item.q} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={open}
                  >
                    <span className="font-medium text-card-foreground">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180 text-primary",
                      )}
                    />
                  </button>
                  {open && (
                    <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mb-16 rounded-3xl border border-primary/25 bg-card p-8 text-center sm:p-12">
          <h2 className="mx-auto max-w-xl text-pretty text-2xl font-bold tracking-tight sm:text-4xl">
            Запустим ваш лендинг за 600 BYN уже на этой неделе
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground leading-relaxed">
            Оставьте заявку — рассчитаем стоимость и сроки бесплатно, без обязательств.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => scrollToForm("lp_final_cta")}
              className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Оставить заявку
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => openChat("lp_final_chat")}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-primary/50"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              Написать в чат
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span>
            Net<span className="text-primary">Next</span> — веб-студия, Минск
          </span>
          <div className="flex items-center gap-4">
            <a
              href="tel:+375291414555"
              onClick={() => reachGoal(YM_GOALS.clickContactInfo, { source: "lp_footer" })}
              className="hover:text-foreground transition-colors"
            >
              +375 (29) 141-45-55
            </a>
            <a
              href="https://t.me/netnext_team"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => reachGoal(YM_GOALS.clickMessenger, { source: "lp_footer" })}
              className="hover:text-foreground transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
