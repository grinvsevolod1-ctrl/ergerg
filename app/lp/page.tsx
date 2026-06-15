import type { Metadata } from "next"
import { LpClient } from "./lp-client"

export const metadata: Metadata = {
  title: "Лендинг за 600 BYN под ключ за 5 дней",
  description:
    "Акция для новых клиентов: продающий лендинг за 600 BYN (вместо 1200). Уникальный дизайн, адаптив, форма заявок и аналитика. Запуск за 5 дней. Минск, Беларусь.",
  // Рекламная посадочная не должна конкурировать с главной в органике.
  robots: { index: false, follow: false },
  alternates: { canonical: "https://netnext.site/lp" },
  openGraph: {
    title: "Продающий лендинг за 600 BYN под ключ | NetNext",
    description:
      "Акция для новых клиентов: современный лендинг за 600 BYN, запуск за 5 дней. Готов принимать клиентов из рекламы.",
    type: "website",
    locale: "ru_BY",
  },
}

export default function LandingPromoPage() {
  return <LpClient />
}
