import { z } from "zod"

// Color schemes available for generated sites
export const colorSchemes = {
  cyan: {
    primary: "oklch(0.7 0.18 195)",
    accent: "oklch(0.75 0.15 195)",
    name: "Cyan",
  },
  orange: {
    primary: "oklch(0.7 0.18 45)",
    accent: "oklch(0.75 0.15 45)",
    name: "Orange",
  },
  purple: {
    primary: "oklch(0.65 0.2 280)",
    accent: "oklch(0.7 0.18 280)",
    name: "Purple",
  },
  green: {
    primary: "oklch(0.65 0.18 145)",
    accent: "oklch(0.7 0.15 145)",
    name: "Green",
  },
  rose: {
    primary: "oklch(0.65 0.2 350)",
    accent: "oklch(0.7 0.18 350)",
    name: "Rose",
  },
  amber: {
    primary: "oklch(0.75 0.15 80)",
    accent: "oklch(0.8 0.12 80)",
    name: "Amber",
  },
} as const

export type ColorScheme = keyof typeof colorSchemes

export const styleOptions = {
  minimal: { name: "Минимализм", description: "Чистый и современный" },
  corporate: { name: "Корпоративный", description: "Профессиональный и надежный" },
  vibrant: { name: "Яркий", description: "Динамичный и энергичный" },
  premium: { name: "Премиум", description: "Элегантный и роскошный" },
} as const

export type StyleOption = keyof typeof styleOptions

// Schema for AI-generated site content
export const generatedSiteSchema = z.object({
  businessName: z.string().describe("Название бизнеса"),
  tagline: z.string().describe("Короткий слоган (5-10 слов)"),
  description: z.string().describe("Описание компании (2-3 предложения)"),
  colorScheme: z.enum(["cyan", "orange", "purple", "green", "rose", "amber"]).describe("Цветовая схема"),
  style: z.enum(["minimal", "corporate", "vibrant", "premium"]).describe("Стиль дизайна"),
  hero: z.object({
    headline: z.string().describe("Главный заголовок"),
    subheadline: z.string().describe("Подзаголовок"),
    ctaText: z.string().describe("Текст кнопки призыва к действию"),
  }),
  services: z.array(z.object({
    title: z.string(),
    description: z.string(),
    icon: z.enum(["briefcase", "code", "palette", "rocket", "shield", "chart"]),
  })).min(3).max(4).describe("Услуги компании"),
  features: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).min(3).max(4).describe("Ключевые преимущества"),
  testimonial: z.object({
    quote: z.string().describe("Отзыв клиента"),
    author: z.string().describe("Имя автора"),
    role: z.string().describe("Должность автора"),
  }),
  cta: z.object({
    headline: z.string().describe("Заголовок финального призыва"),
    description: z.string().describe("Описание"),
    buttonText: z.string().describe("Текст кнопки"),
  }),
})

export type GeneratedSite = z.infer<typeof generatedSiteSchema>

// Chat message types
export interface GeneratorMessage {
  id: string
  role: "assistant" | "user"
  content: string
  type?: "text" | "style-picker" | "color-picker" | "section-picker"
  options?: string[]
}

// Chat step types
export type ChatStep = 
  | "greeting"
  | "business"
  | "style"
  | "color"
  | "sections"
  | "generating"
  | "complete"

// User input collected through chat
export interface UserInput {
  businessDescription?: string
  style?: StyleOption
  colorScheme?: ColorScheme
  sections?: string[]
  contact?: {
    phone?: string
    email?: string
  }
}
