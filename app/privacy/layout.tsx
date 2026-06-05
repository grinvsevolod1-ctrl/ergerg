import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика конфиденциальности веб-студии NetNext: как мы собираем, используем и защищаем персональные данные, и как запросить их удаление.",
  alternates: {
    canonical: "https://netnext.site/privacy",
  },
  openGraph: {
    title: "Политика конфиденциальности | NetNext",
    description:
      "Как NetNext Studio обрабатывает и защищает персональные данные пользователей.",
    url: "https://netnext.site/privacy",
    type: "article",
  },
}

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Главная", item: "https://netnext.site" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Политика конфиденциальности",
      item: "https://netnext.site/privacy",
    },
  ],
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  )
}
