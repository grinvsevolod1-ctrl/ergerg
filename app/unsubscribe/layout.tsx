import { Metadata } from "next"

// Utility page (email unsubscribe) — must never appear in search results.
export const metadata: Metadata = {
  title: "Отписка от рассылки | NetNext",
  description: "Управление подпиской на рассылку NetNext.",
  alternates: {
    canonical: "https://netnext.site/unsubscribe",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function UnsubscribeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
