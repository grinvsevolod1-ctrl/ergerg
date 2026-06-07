"use client"

/**
 * LandingPromoToast — компактное всплывающее промо акции «Лендинг за 600 BYN».
 *
 * Поведение:
 *  - Появляется через короткую задержку после загрузки (не мешает первому впечатлению).
 *  - Клик по карточке (или по кнопке-стрелке) плавно скроллит к секции #landing.
 *  - Авто-скрытие при скролле, чтобы не пересекаться со scroll-триггерным FloatingCTA.
 *  - Закрытие крестиком запоминается на сессию (sessionStorage), без навязчивости.
 *
 * Позиция: десктоп — правый нижний угол (орб сверху-справа, FloatingCTA слева —
 * пересечений нет); мобайл — снизу по центру, исчезает при первом же скролле.
 */

import { useEffect, useState, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, X } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "promo_landing_600_dismissed"
const SHOW_DELAY_MS = 2200

export function LandingPromoToast() {
  const [visible, setVisible] = useState(false)
  const [closed, setClosed] = useState(false)

  // Показ с задержкой, если ранее не закрывали в этой сессии.
  useEffect(() => {
    if (typeof window === "undefined") return
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(STORAGE_KEY) === "1"
    } catch {
      /* sessionStorage недоступен — просто покажем */
    }
    if (dismissed) {
      setClosed(true)
      return
    }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(t)
  }, [])

  // Авто-скрытие при скролле (уступаем место FloatingCTA).
  useEffect(() => {
    if (closed) return
    const onScroll = () => {
      if (window.scrollY > 120) setVisible(false)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [closed])

  const dismiss = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setVisible(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* no-op */
    }
    // Снимаем с дерева после анимации выхода.
    setTimeout(() => setClosed(true), 350)
  }, [])

  const goToLanding = useCallback(() => {
    const el = document.getElementById("landing")
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    setVisible(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch {
      /* no-op */
    }
    setTimeout(() => setClosed(true), 600)
  }, [])

  if (closed) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "fixed z-[54]",
            // mobile: bottom-center; desktop: bottom-right (orb is top-right, CTA bottom-left)
            "bottom-[4.5rem] left-4 right-4",
            "md:bottom-6 md:right-6 md:left-auto md:w-[360px]",
          )}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={goToLanding}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                goToLanding()
              }
            }}
            aria-label="Акция: лендинг за 600 BYN — перейти к предложению"
            className={cn(
              "group relative flex items-stretch overflow-hidden rounded-2xl cursor-pointer",
              "bg-card border border-border/60 shadow-2xl shadow-black/30",
              "transition-all duration-300 hover:border-primary/50 hover:shadow-primary/10",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {/* Картинка-акцент слева, аккуратно обрезана object-cover */}
            <div className="relative w-24 sm:w-28 shrink-0 overflow-hidden">
              <img
                src="/images/promo-nexik.png"
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
              {/* Оверлей-градиент: плавно растворяет правый край картинки в фон карточки */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card" />
              <div className="absolute inset-0 bg-primary/5" />
            </div>

            {/* Текстовая часть */}
            <div className="relative flex-1 min-w-0 py-3.5 pl-3.5 pr-9">
              <div className="inline-flex items-center gap-1.5 mb-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Акция месяца
                </span>
              </div>

              <p className="text-[15px] font-bold leading-tight text-foreground">
                Лендинг за <span className="text-primary">600&nbsp;BYN</span>
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground truncate">
                Продающая страница под ключ
              </p>

              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary">
                Смотреть предложение
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>

            {/* Кнопка закрытия */}
            <button
              type="button"
              onClick={dismiss}
              aria-label="Закрыть промо"
              className={cn(
                "absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg",
                "text-muted-foreground/80 hover:text-foreground hover:bg-secondary/60",
                "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
