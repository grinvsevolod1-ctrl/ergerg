import React from "react"
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://nexik.org'),
  title: {
    default: 'Nexik - AI-ассистент для бизнеса | Чат-бот для сайта',
    template: '%s | Nexik'
  },
  description: 'Nexik - готовый AI-ассистент, который встраивается на любой сайт одной строкой кода. Отвечает на вопросы клиентов 24/7, собирает заявки, записывает на встречи. Установка за 2 минуты без программирования.',
  keywords: [
    'AI чат-бот',
    'чат-бот для сайта',
    'виртуальный ассистент',
    'AI помощник',
    'автоматизация клиентского сервиса',
    'чат для бизнеса',
    'онлайн консультант',
    'искусственный интеллект для бизнеса',
    'nexik',
    'нейксик',
    'виджет чата',
    'автоответчик для сайта',
    'бот для заявок',
    'AI support',
    'customer service automation'
  ],
  authors: [{ name: 'Nexik', url: 'https://nexik.org' }],
  creator: 'NetNext Studio',
  publisher: 'NetNext Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/nexik/icon.svg',
    shortcut: '/nexik/icon.svg',
    apple: '/nexik/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://nexik.org',
    siteName: 'Nexik',
    title: 'Nexik - AI-ассистент для бизнеса',
    description: 'Готовый AI-ассистент для вашего сайта. Отвечает на вопросы клиентов 24/7, собирает заявки, переводит на оператора. Установка за 2 минуты.',
    images: [
      {
        url: '/nexik/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Nexik - AI-ассистент для бизнеса',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nexik - AI-ассистент для бизнеса',
    description: 'Готовый AI-ассистент для вашего сайта. Установка за 2 минуты без программирования.',
    images: ['/nexik/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://nexik.org',
    languages: {
      'ru-RU': 'https://nexik.org',
      'en-US': 'https://nexik.org/en',
    },
  },
  category: 'technology',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0a0f' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
}

export default function NexikLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Nexik",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "description": "AI-ассистент для бизнеса, который встраивается на любой сайт одной строкой кода. Отвечает на вопросы клиентов 24/7, собирает заявки, записывает на встречи.",
            "url": "https://nexik.org",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Бесплатный тариф до 100 сообщений в месяц"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "127"
            },
            "featureList": [
              "Мгновенные ответы на вопросы клиентов 24/7",
              "Сбор контактных данных и заявок",
              "Запись на встречу или консультацию",
              "Перевод диалога на живого оператора",
              "База знаний с обучением AI",
              "Интеграция с Telegram для уведомлений",
              "Установка одной строкой кода"
            ],
            "screenshot": "https://nexik.org/nexik/og-image.jpg",
            "author": {
              "@type": "Organization",
              "name": "NetNext Studio",
              "url": "https://netnext.site"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Что такое Nexik?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nexik — это готовый AI-ассистент для бизнеса, который встраивается на любой сайт одной строкой кода. Он отвечает на вопросы клиентов 24/7, собирает заявки и помогает автоматизировать клиентский сервис."
                }
              },
              {
                "@type": "Question",
                "name": "Сколько стоит Nexik?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nexik имеет бесплатный тариф до 100 сообщений в месяц. Платные тарифы начинаются от 990 рублей в месяц с неограниченными сообщениями."
                }
              },
              {
                "@type": "Question",
                "name": "Как установить Nexik на сайт?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Установка занимает 2 минуты: зарегистрируйтесь, получите код виджета и вставьте его на ваш сайт перед закрывающим тегом </body>. Никакого программирования не требуется."
                }
              },
              {
                "@type": "Question",
                "name": "Можно ли обучить Nexik своей базе знаний?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Да, в личном кабинете вы можете загрузить документы, добавить FAQ и обучить AI отвечать на вопросы специфичные для вашего бизнеса."
                }
              }
            ]
          })
        }}
      />
      {children}
    </>
  )
}
