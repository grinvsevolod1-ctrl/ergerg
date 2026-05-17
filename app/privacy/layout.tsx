import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Политика конфиденциальности | NetNext",
  description: "Политика конфиденциальности веб-студии NetNext",
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
